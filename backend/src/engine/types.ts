// Tipi centrali del motore di generazione/validazione puzzle Kill-Doku.

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "EXPERT";

export type ClueType =
  | "ADJACENT_TO_OBJECT"
  | "IN_AREA"
  | "ISOLATED_IN_CORNER"
  | "ISOLATED_IN_AREA"
  | "DIRECTIONAL_TO_CHARACTER"
  | "DIRECTIONAL_TO_VICTIM"
  | "ABSOLUTE_ROW"
  | "ABSOLUTE_COLUMN"
  | "SAME_AREA_AS"
  | "NEVER_SAME_ROW_AS"
  | "NEVER_SAME_COLUMN_AS";

export interface GridCellData {
  row: number;
  col: number;
  areaName: string;
  objectKey: string | null;
  isOccupiable: boolean;
}

/** Vincolo strutturato: quello che il solver deve effettivamente verificare.
 *  clueText è SOLO la resa testuale per il giocatore; il solver lavora
 *  esclusivamente su questa forma strutturata per evitare ambiguità di NLP. */
export interface ClueConstraint {
  type: ClueType;
  // Indice del personaggio a cui si riferisce l'indizio (soggetto)
  subjectIndex: number;
  // Parametri specifici per tipo di indizio
  objectKey?: string;
  areaName?: string;
  direction?: "N" | "S" | "E" | "O";
  targetIndex?: number; // altro personaggio o vittima
  row?: number;
  col?: number;
}

export interface CharacterData {
  name: string;
  isVictim: boolean;
  isKiller: boolean;
  clueText: string;
  clueType: ClueType;
  solutionRow: number;
  solutionCol: number;
}

export interface PuzzleGenerationResult {
  gridSize: number;
  theme: string;
  title: string;
  introText: string;
  difficulty: Difficulty;
  gridCells: GridCellData[];
  characters: CharacterData[];
  // Soluzione: array di [row, col] indicizzato come `characters`. Mai esposta al client.
  solution: Array<[number, number]>;
  // Vincoli strutturati usati internamente dal solver per la verifica di unicità.
  constraints: ClueConstraint[];
}

export interface DifficultyConfig {
  gridSize: number;
  areaCount: number;
  characterCount: number;
  objectDensity: number; // 0..1, quota di celle con oggetto/non occupabili
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  EASY: { gridSize: 6, areaCount: 4, characterCount: 4, objectDensity: 0.15 },
  MEDIUM: { gridSize: 8, areaCount: 6, characterCount: 6, objectDensity: 0.18 },
  HARD: { gridSize: 10, areaCount: 8, characterCount: 8, objectDensity: 0.2 },
  EXPERT: { gridSize: 12, areaCount: 10, characterCount: 11, objectDensity: 0.22 },
};

export const OBJECT_POOL = [
  "sedia",
  "tavolo",
  "scaffale",
  "pianta",
  "letto",
  "finestra",
  "camino",
  "specchio",
  "baule",
  "quadro",
  "lampada",
  "poltrona",
];
