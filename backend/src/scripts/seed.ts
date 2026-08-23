import { PrismaClient } from "@prisma/client";
import { STORY_CHAPTERS } from "../config/storyChapters";

function badgeData(chapterNumber: number) {
  return {
    chapterNumber,
    name: `Badge Capitolo ${chapterNumber}`,
    description: `Assegnato per aver completato tutti i livelli del Capitolo ${chapterNumber}.`,
    iconKey: `badge_chapter_${chapterNumber}`,
  };
}

export async function seedBadges() {
  const prisma = new PrismaClient();

  try {
    for (const chapter of STORY_CHAPTERS) {
      await prisma.badge.upsert({
        where: { chapterNumber: chapter.chapterNumber },
        update: {},
        create: badgeData(chapter.chapterNumber),
      });
    }

    console.log(
      `✅ Seed completato: ${STORY_CHAPTERS.length} badge capitolo creati/verificati.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedBadges().catch((err) => {
    console.error("❌ Errore durante il seed:", err);
    process.exit(1);
  });
}
