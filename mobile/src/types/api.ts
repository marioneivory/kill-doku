export type ThemeMode = "LIGHT" | "DARK";
export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "EXPERT";
export type PuzzleMode = "STORY" | "RANDOM";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  theme: ThemeMode;
  createdAt: string;
}

export interface GridCellDTO {
  row: number;
  col: number;
  areaName: string;
  objectKey: string | null;
  isOccupiable: boolean;
}

export interface CharacterDTO {
  id: string;
  name: string;
  clueText: string;
  clueType: string;
  isVictim: boolean;
}

export interface PuzzleDTO {
  id: string;
  mode: PuzzleMode;
  chapterNumber: number | null;
  levelNumber: number | null;
  gridSize: number;
  theme: string;
  title: string;
  introText: string;
  difficulty: Difficulty;
  gridCells: GridCellDTO[];
  characters: CharacterDTO[];
}

export interface SubmissionResultDTO {
  correct: boolean;
  killerCharacterId: string | null;
  perCharacterCorrect: Record<string, boolean>;
}

export interface StoryLevelSubmissionResultDTO extends SubmissionResultDTO {
  stars: number;
  unlockedBadge: { name: string; description: string; iconKey: string } | null;
  nextLevelUnlocked: boolean;
}

export interface ChapterOverviewDTO {
  chapterNumber: number;
  name: string;
  theme: string;
  flavorIntro: string;
  difficulty: Difficulty;
  levelsCount: number;
  levelsCompleted: number;
  isUnlocked: boolean;
}

export interface FullProgressDTO {
  story: {
    totalLevels: number;
    completedLevels: number;
    totalStars: number;
    progressRatio: number;
    levels: Array<{
      chapterNumber: number;
      levelNumber: number;
      status: "LOCKED" | "UNLOCKED" | "COMPLETED";
      stars: number;
      completedAt: string | null;
    }>;
  };
  random: {
    puzzlesCompleted: number;
    totalTimePlayedSeconds: number;
    averageTimeSeconds: number;
    currentStreak: number;
    longestStreak: number;
  };
  badges: Array<{
    chapterNumber: number;
    name: string;
    description: string;
    iconKey: string;
    unlockedAt: string;
  }>;
}

/** Piazzamento locale in corso di modifica: cellId -> personaggio piazzato. */
export interface PlacementEntry {
  characterId: string;
  row: number;
  col: number;
}
