import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { TOTAL_STORY_LEVELS } from "../config/storyChapters";

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, theme: true, createdAt: true },
  });
  if (!user) throw new AppError(404, "Utente non trovato.");
  return user;
}

export async function updateUserTheme(userId: string, theme: "LIGHT" | "DARK") {
  return prisma.user.update({
    where: { id: userId },
    data: { theme },
    select: { id: true, theme: true },
  });
}

/** Aggregazione completa per la schermata Profilo/Progressi (punto 3 della spec). */
export async function getFullProgress(userId: string) {
  const [storyProgress, randomStats, userBadges] = await Promise.all([
    prisma.storyProgress.findMany({ where: { userId } }),
    prisma.randomStats.findUnique({ where: { userId } }),
    prisma.userBadge.findMany({ where: { userId }, include: { badge: true } }),
  ]);

  const completedLevels = storyProgress.filter(
    (p) => p.status === "COMPLETED"
  ).length;

  const totalStars = storyProgress.reduce((sum, p) => sum + p.stars, 0);

  return {
    story: {
      totalLevels: TOTAL_STORY_LEVELS,
      completedLevels,
      totalStars,
      progressRatio: completedLevels / TOTAL_STORY_LEVELS,
      levels: storyProgress.map((p) => ({
        chapterNumber: p.chapterNumber,
        levelNumber: p.levelNumber,
        status: p.status,
        stars: p.stars,
        completedAt: p.completedAt,
      })),
    },
    random: {
      puzzlesCompleted: randomStats?.puzzlesCompleted ?? 0,
      totalTimePlayedSeconds: randomStats?.totalTimePlayedSeconds ?? 0,
      averageTimeSeconds:
        randomStats && randomStats.puzzlesCompleted > 0
          ? Math.round(
              randomStats.totalTimePlayedSeconds / randomStats.puzzlesCompleted
            )
          : 0,
      currentStreak: randomStats?.currentStreak ?? 0,
      longestStreak: randomStats?.longestStreak ?? 0,
    },
    badges: userBadges.map((ub) => ({
      chapterNumber: ub.badge.chapterNumber,
      name: ub.badge.name,
      description: ub.badge.description,
      iconKey: ub.badge.iconKey,
      unlockedAt: ub.unlockedAt,
    })),
  };
}
