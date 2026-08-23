-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('LOCKED', 'UNLOCKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PuzzleMode" AS ENUM ('STORY', 'RANDOM');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "ClueType" AS ENUM ('ADJACENT_TO_OBJECT', 'IN_AREA', 'ISOLATED_IN_CORNER', 'ISOLATED_IN_AREA', 'DIRECTIONAL_TO_CHARACTER', 'DIRECTIONAL_TO_VICTIM', 'ABSOLUTE_ROW', 'ABSOLUTE_COLUMN', 'SAME_AREA_AS', 'NEVER_SAME_ROW_AS', 'NEVER_SAME_COLUMN_AS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "theme" "Theme" NOT NULL DEFAULT 'DARK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "levelNumber" INTEGER NOT NULL,
    "status" "StoryStatus" NOT NULL DEFAULT 'LOCKED',
    "stars" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "random_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puzzlesCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalTimePlayedSeconds" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),

    CONSTRAINT "random_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puzzles" (
    "id" TEXT NOT NULL,
    "mode" "PuzzleMode" NOT NULL,
    "chapterNumber" INTEGER,
    "levelNumber" INTEGER,
    "gridSize" INTEGER NOT NULL,
    "theme" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "introText" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solutionData" JSONB NOT NULL,

    CONSTRAINT "puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isVictim" BOOLEAN NOT NULL DEFAULT false,
    "isKiller" BOOLEAN NOT NULL DEFAULT false,
    "clueText" TEXT NOT NULL,
    "clueType" "ClueType" NOT NULL,
    "solutionRow" INTEGER NOT NULL,
    "solutionCol" INTEGER NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grid_cells" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "areaName" TEXT NOT NULL,
    "objectKey" TEXT,
    "isOccupiable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "grid_cells_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "story_progress_userId_idx" ON "story_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "story_progress_userId_chapterNumber_levelNumber_key" ON "story_progress"("userId", "chapterNumber", "levelNumber");

-- CreateIndex
CREATE UNIQUE INDEX "badges_chapterNumber_key" ON "badges"("chapterNumber");

-- CreateIndex
CREATE INDEX "user_badges_userId_idx" ON "user_badges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "random_stats_userId_key" ON "random_stats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "puzzles_mode_chapterNumber_levelNumber_key" ON "puzzles"("mode", "chapterNumber", "levelNumber");

-- CreateIndex
CREATE INDEX "characters_puzzleId_idx" ON "characters"("puzzleId");

-- CreateIndex
CREATE INDEX "grid_cells_puzzleId_idx" ON "grid_cells"("puzzleId");

-- CreateIndex
CREATE UNIQUE INDEX "grid_cells_puzzleId_row_col_key" ON "grid_cells"("puzzleId", "row", "col");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_progress" ADD CONSTRAINT "story_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "random_stats" ADD CONSTRAINT "random_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grid_cells" ADD CONSTRAINT "grid_cells_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
