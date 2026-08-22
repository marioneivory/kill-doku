export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type StoryStackParamList = {
  ChapterMap: undefined;
  LevelList: { chapterNumber: number };
  StoryPuzzle: { chapterNumber: number; levelNumber: number };
};

export type RandomStackParamList = {
  DifficultySelect: undefined;
  RandomPuzzle: { difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT" };
};

export type MainTabParamList = {
  Home: undefined;
  StoryTab: undefined;
  RandomTab: undefined;
  Profile: undefined;
  Settings: undefined;
};
