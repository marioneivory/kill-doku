import { prisma } from "../lib/prisma";

/** Nome/descrizione placeholder come da punto 2.1 della spec ("decideremo dopo"). */
export function placeholderBadgeData(chapterNumber: number) {
  return {
    chapterNumber,
    name: `Badge Capitolo ${chapterNumber}`,
    description: `Assegnato per aver completato tutti i livelli del Capitolo ${chapterNumber}.`,
    iconKey: `badge_chapter_${chapterNumber}`,
  };
}

/** Idempotente: crea il badge di un capitolo se non esiste ancora (seed on-demand). */
export async function ensureBadgeExists(chapterNumber: number) {
  return prisma.badge.upsert({
    where: { chapterNumber },
    update: {},
    create: placeholderBadgeData(chapterNumber),
  });
}

/**
 * Se l'utente ha appena completato l'ultimo livello (50) di un capitolo,
 * sblocca il badge corrispondente. Ritorna il badge sbloccato, o null se
 * non è cambiato nulla (capitolo non ancora concluso, o badge già posseduto).
 */
export async function maybeUnlockChapterBadge(
  userId: string,
  chapterNumber: number,
  levelNumber: number,
  levelsInChapter: number
) {
  if (levelNumber !== levelsInChapter) return null;

  const completedCount = await prisma.storyProgress.count({
    where: { userId, chapterNumber, status: "COMPLETED" },
  });
  if (completedCount < levelsInChapter) return null;

  const badge = await ensureBadgeExists(chapterNumber);

  const alreadyUnlocked = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (alreadyUnlocked) return null;

  return prisma.userBadge.create({
    data: { userId, badgeId: badge.id },
    include: { badge: true },
  });
}
