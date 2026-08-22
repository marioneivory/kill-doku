import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { generatePuzzle } from "../engine/puzzleGenerator";
import { getChapterConfig, STORY_CHAPTERS } from "../config/storyChapters";
import {
  persistGeneratedPuzzle,
  serializePuzzleForClient,
  validateSubmission,
} from "./puzzleService";
import { maybeUnlockChapterBadge } from "./badgeService";

/** Vista aggregata capitoli + stato di sblocco per l'utente (GET /story/chapters). */
export async function getChaptersOverview(userId: string) {
  const progress = await prisma.storyProgress.findMany({ where: { userId } });
  const progressByKey = new Map(
    progress.map((p) => [`${p.chapterNumber}:${p.levelNumber}`, p])
  );

  return STORY_CHAPTERS.map((chapter) => {
    const levelsCompleted = progress.filter(
      (p) => p.chapterNumber === chapter.chapterNumber && p.status === "COMPLETED"
    ).length;

    // Il livello 1 di ogni capitolo è sempre sbloccato di default; gli altri
    // seguono lo stato salvato, o LOCKED se l'utente non li ha mai raggiunti.
    const firstLevelState =
      progressByKey.get(`${chapter.chapterNumber}:1`)?.status ?? "UNLOCKED";

    return {
      chapterNumber: chapter.chapterNumber,
      name: chapter.name,
      theme: chapter.theme,
      flavorIntro: chapter.flavorIntro,
      difficulty: chapter.difficulty,
      levelsCount: chapter.levelsCount,
      levelsCompleted,
      isUnlocked:
        chapter.chapterNumber === 1 ||
        firstLevelState !== "LOCKED" ||
        levelsCompleted > 0 ||
        isChapterUnlockedByPreviousCompletion(progress, chapter.chapterNumber),
    };
  });
}

function isChapterUnlockedByPreviousCompletion(
  progress: { chapterNumber: number; levelNumber: number; status: string }[],
  chapterNumber: number
): boolean {
  if (chapterNumber === 1) return true;
  const prevChapter = getChapterConfig(chapterNumber - 1);
  if (!prevChapter) return false;
  const prevCompleted = progress.filter(
    (p) => p.chapterNumber === chapterNumber - 1 && p.status === "COMPLETED"
  ).length;
  return prevCompleted >= prevChapter.levelsCount;
}

/** Determina se un dato livello è raggiungibile dall'utente (progressione lineare). */
async function assertLevelUnlocked(
  userId: string,
  chapterNumber: number,
  levelNumber: number
) {
  if (levelNumber === 1) {
    if (chapterNumber === 1) return;
    const prevChapter = getChapterConfig(chapterNumber - 1);
    if (!prevChapter) throw new AppError(404, "Capitolo non trovato.");
    const prevCompleted = await prisma.storyProgress.count({
      where: {
        userId,
        chapterNumber: chapterNumber - 1,
        status: "COMPLETED",
      },
    });
    if (prevCompleted < prevChapter.levelsCount) {
      throw new AppError(403, "Capitolo precedente non ancora completato.");
    }
    return;
  }

  const previousLevel = await prisma.storyProgress.findUnique({
    where: {
      userId_chapterNumber_levelNumber: {
        userId,
        chapterNumber,
        levelNumber: levelNumber - 1,
      },
    },
  });
  if (!previousLevel || previousLevel.status !== "COMPLETED") {
    throw new AppError(403, "Livello precedente non ancora completato.");
  }
}

/** Ottiene (dalla cache) o genera on-demand il puzzle canonico per un livello Storia. */
async function getOrCreateStoryPuzzle(chapterNumber: number, levelNumber: number) {
  const existing = await prisma.puzzle.findUnique({
    where: {
      mode_chapterNumber_levelNumber: {
        mode: "STORY",
        chapterNumber,
        levelNumber,
      },
    },
    include: { characters: true, gridCells: true },
  });
  if (existing) return existing;

  const chapter = getChapterConfig(chapterNumber);
  if (!chapter) throw new AppError(404, "Capitolo non trovato.");

  // Seed deterministico per capitolo+livello: stesso puzzle per tutti gli
  // utenti che giocano quel livello, riproducibile e cache-friendly.
  const seed = chapterNumber * 100000 + levelNumber;

  const generated = generatePuzzle({
    difficulty: chapter.difficulty,
    theme: chapter.theme,
    title: `${chapter.name} — Livello ${levelNumber}`,
    introText: chapter.flavorIntro,
    seed,
  });

  return persistGeneratedPuzzle(generated, "STORY", chapterNumber, levelNumber);
}

export async function getStoryLevel(
  userId: string,
  chapterNumber: number,
  levelNumber: number
) {
  await assertLevelUnlocked(userId, chapterNumber, levelNumber);
  const puzzle = await getOrCreateStoryPuzzle(chapterNumber, levelNumber);

  // Assicura che esista una riga di progresso UNLOCKED per il livello
  // corrente, così la UI la può mostrare come "in corso" prima del submit.
  await prisma.storyProgress.upsert({
    where: {
      userId_chapterNumber_levelNumber: { userId, chapterNumber, levelNumber },
    },
    update: {},
    create: { userId, chapterNumber, levelNumber, status: "UNLOCKED" },
  });

  return serializePuzzleForClient(puzzle);
}

export interface StoryLevelSubmissionResult {
  correct: boolean;
  killerCharacterId: string | null;
  perCharacterCorrect: Record<string, boolean>;
  stars: number;
  unlockedBadge: { name: string; description: string; iconKey: string } | null;
  nextLevelUnlocked: boolean;
}

export async function submitStoryLevel(
  userId: string,
  chapterNumber: number,
  levelNumber: number,
  placement: Array<{ characterId: string; row: number; col: number }>
): Promise<StoryLevelSubmissionResult> {
  await assertLevelUnlocked(userId, chapterNumber, levelNumber);
  const chapter = getChapterConfig(chapterNumber);
  if (!chapter) throw new AppError(404, "Capitolo non trovato.");

  const puzzle = await getOrCreateStoryPuzzle(chapterNumber, levelNumber);
  const result = await validateSubmission(puzzle.id, placement);

  if (!result.correct) {
    return {
      ...result,
      stars: 0,
      unlockedBadge: null,
      nextLevelUnlocked: false,
    };
  }

  // Punteggio semplice: 3 stelle sempre al primo completamento corretto.
  // Estendibile in futuro con criteri di tempo/tentativi.
  const stars = 3;

  await prisma.storyProgress.upsert({
    where: {
      userId_chapterNumber_levelNumber: { userId, chapterNumber, levelNumber },
    },
    update: { status: "COMPLETED", stars, completedAt: new Date() },
    create: {
      userId,
      chapterNumber,
      levelNumber,
      status: "COMPLETED",
      stars,
      completedAt: new Date(),
    },
  });

  let nextLevelUnlocked = false;
  if (levelNumber < chapter.levelsCount) {
    await prisma.storyProgress.upsert({
      where: {
        userId_chapterNumber_levelNumber: {
          userId,
          chapterNumber,
          levelNumber: levelNumber + 1,
        },
      },
      update: {},
      create: {
        userId,
        chapterNumber,
        levelNumber: levelNumber + 1,
        status: "UNLOCKED",
      },
    });
    nextLevelUnlocked = true;
  }

  const unlockedBadge = await maybeUnlockChapterBadge(
    userId,
    chapterNumber,
    levelNumber,
    chapter.levelsCount
  );

  return {
    ...result,
    stars,
    unlockedBadge: unlockedBadge
      ? {
          name: unlockedBadge.badge.name,
          description: unlockedBadge.badge.description,
          iconKey: unlockedBadge.badge.iconKey,
        }
      : null,
    nextLevelUnlocked,
  };
}
