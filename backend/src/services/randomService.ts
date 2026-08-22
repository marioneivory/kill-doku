import { prisma } from "../lib/prisma";
import { Difficulty } from "../engine/types";
import { generatePuzzle } from "../engine/puzzleGenerator";
import {
  persistGeneratedPuzzle,
  serializePuzzleForClient,
  validateSubmission,
} from "./puzzleService";

export async function generateRandomPuzzle(difficulty: Difficulty) {
  const generated = generatePuzzle({ difficulty });
  const puzzle = await persistGeneratedPuzzle(generated, "RANDOM", null, null);
  return serializePuzzleForClient(puzzle);
}

function isConsecutiveDay(lastPlayedAt: Date | null, now: Date): "same" | "next" | "broken" {
  if (!lastPlayedAt) return "broken";
  const last = new Date(lastPlayedAt);
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(now) - startOfDay(last)) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "same";
  if (diffDays === 1) return "next";
  return "broken";
}

export async function submitRandomPuzzle(
  userId: string,
  puzzleId: string,
  placement: Array<{ characterId: string; row: number; col: number }>,
  elapsedSeconds?: number
) {
  const result = await validateSubmission(puzzleId, placement);
  if (!result.correct) return result;

  const stats = await prisma.randomStats.findUnique({ where: { userId } });
  const now = new Date();

  let currentStreak = 1;
  if (stats) {
    const continuity = isConsecutiveDay(stats.lastPlayedAt, now);
    if (continuity === "same") currentStreak = stats.currentStreak || 1;
    else if (continuity === "next") currentStreak = stats.currentStreak + 1;
    else currentStreak = 1;
  }

  const longestStreak = Math.max(stats?.longestStreak ?? 0, currentStreak);

  await prisma.randomStats.upsert({
    where: { userId },
    update: {
      puzzlesCompleted: { increment: 1 },
      totalTimePlayedSeconds: { increment: elapsedSeconds ?? 0 },
      currentStreak,
      longestStreak,
      lastPlayedAt: now,
    },
    create: {
      userId,
      puzzlesCompleted: 1,
      totalTimePlayedSeconds: elapsedSeconds ?? 0,
      currentStreak: 1,
      longestStreak: 1,
      lastPlayedAt: now,
    },
  });

  return result;
}
