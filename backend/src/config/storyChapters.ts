import { Difficulty } from "../engine/types";

export interface ChapterConfig {
  chapterNumber: number;
  name: string;
  theme: string;
  flavorIntro: string;
  difficulty: Difficulty;
  levelsCount: number;
}

/**
 * 6 capitoli × 50 livelli = 300 livelli totali (punto 2.1 della spec).
 * Difficoltà/dimensione griglia crescono di capitolo in capitolo, dal
 * tier EASY (4 personaggi, griglia 6×6) al tier EXPERT (11 personaggi,
 * griglia 12×12). Nota di assunzione: la spec chiede "fino a 10-12
 * personaggi" nel capitolo 6 — il tier EXPERT del motore usa 11, valore
 * scelto come compromesso solido all'interno del range richiesto.
 */
export const STORY_CHAPTERS: ChapterConfig[] = [
  {
    chapterNumber: 1,
    name: "Capitolo 1: Villa di Campagna",
    theme: "Villa di campagna",
    flavorIntro:
      "Un weekend tra amici in una villa isolata si trasforma in un giallo da risolvere prima di cena.",
    difficulty: "EASY",
    levelsCount: 50,
  },
  {
    chapterNumber: 2,
    name: "Capitolo 2: Nave da Crociera",
    theme: "Nave da crociera",
    flavorIntro:
      "In mezzo all'oceano, nessuno può scendere: solo la logica può stanare il colpevole.",
    difficulty: "EASY",
    levelsCount: 50,
  },
  {
    chapterNumber: 3,
    name: "Capitolo 3: Teatro",
    theme: "Teatro",
    flavorIntro:
      "Dietro le quinte di un vecchio teatro, la finzione lascia spazio a un mistero molto reale.",
    difficulty: "MEDIUM",
    levelsCount: 50,
  },
  {
    chapterNumber: 4,
    name: "Capitolo 4: Hotel di Montagna",
    theme: "Hotel di montagna",
    flavorIntro:
      "Bloccati da una nevicata in un hotel di lusso, gli ospiti nascondono più di un segreto.",
    difficulty: "MEDIUM",
    levelsCount: 50,
  },
  {
    chapterNumber: 5,
    name: "Capitolo 5: Treno Notturno",
    theme: "Treno notturno",
    flavorIntro:
      "Un treno di lusso attraversa il continente di notte: qualcuno a bordo non arriverà a destinazione.",
    difficulty: "HARD",
    levelsCount: 50,
  },
  {
    chapterNumber: 6,
    name: "Capitolo 6: Museo",
    theme: "Museo",
    flavorIntro:
      "Durante il gala di inaugurazione al museo, tra le sale piene di ospiti, la verità si nasconde nei dettagli.",
    difficulty: "EXPERT",
    levelsCount: 50,
  },
];

export function getChapterConfig(chapterNumber: number): ChapterConfig | undefined {
  return STORY_CHAPTERS.find((c) => c.chapterNumber === chapterNumber);
}

export const TOTAL_STORY_LEVELS = STORY_CHAPTERS.reduce(
  (sum, c) => sum + c.levelsCount,
  0
);
