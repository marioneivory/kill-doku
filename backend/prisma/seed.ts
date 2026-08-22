import { PrismaClient } from "@prisma/client";
import { STORY_CHAPTERS } from "../src/config/storyChapters";
import { placeholderBadgeData } from "../src/services/badgeService";

const prisma = new PrismaClient();

async function main() {
  for (const chapter of STORY_CHAPTERS) {
    await prisma.badge.upsert({
      where: { chapterNumber: chapter.chapterNumber },
      update: {},
      create: placeholderBadgeData(chapter.chapterNumber),
    });
  }
  console.log(`✅ Seed completato: ${STORY_CHAPTERS.length} badge capitolo creati/verificati.`);
}

main()
  .catch((err) => {
    console.error("❌ Errore durante il seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
