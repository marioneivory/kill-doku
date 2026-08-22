import { create } from "zustand";
import { PlacementEntry, PuzzleDTO } from "@/types/api";

interface PuzzleState {
  puzzle: PuzzleDTO | null;
  // Mappa cellKey ("row,col") -> characterId piazzato lì dall'utente
  placementByCell: Record<string, string>;
  selectedCharacterId: string | null;
  startedAt: number | null;

  loadPuzzle: (puzzle: PuzzleDTO) => void;
  selectCharacter: (characterId: string | null) => void;
  placeAt: (row: number, col: number) => void;
  clearCell: (row: number, col: number) => void;
  reset: () => void;
  getPlacementEntries: () => PlacementEntry[];
  getElapsedSeconds: () => number;
}

function cellKey(row: number, col: number) {
  return `${row},${col}`;
}

export const usePuzzleStore = create<PuzzleState>((set, get) => ({
  puzzle: null,
  placementByCell: {},
  selectedCharacterId: null,
  startedAt: null,

  loadPuzzle: (puzzle) =>
    set({
      puzzle,
      placementByCell: {},
      selectedCharacterId: puzzle.characters[0]?.id ?? null,
      startedAt: Date.now(),
    }),

  selectCharacter: (characterId) => set({ selectedCharacterId: characterId }),

  placeAt: (row, col) => {
    const { selectedCharacterId, placementByCell, puzzle } = get();
    if (!selectedCharacterId || !puzzle) return;

    const cell = puzzle.gridCells.find((c) => c.row === row && c.col === col);
    if (!cell || !cell.isOccupiable) return;

    // Rimuove qualunque altra assegnazione precedente dello stesso
    // personaggio (un personaggio occupa una sola cella alla volta).
    const next: Record<string, string> = {};
    for (const [key, charId] of Object.entries(placementByCell)) {
      if (charId !== selectedCharacterId) next[key] = charId;
    }
    next[cellKey(row, col)] = selectedCharacterId;

    // Avanza automaticamente al prossimo personaggio non ancora piazzato,
    // per velocizzare l'inserimento sequenziale.
    const placedIds = new Set(Object.values(next));
    const nextUnplaced = puzzle.characters.find((c) => !placedIds.has(c.id));

    set({ placementByCell: next, selectedCharacterId: nextUnplaced?.id ?? null });
  },

  clearCell: (row, col) => {
    const { placementByCell } = get();
    const next = { ...placementByCell };
    delete next[cellKey(row, col)];
    set({ placementByCell: next });
  },

  reset: () => set({ puzzle: null, placementByCell: {}, selectedCharacterId: null, startedAt: null }),

  getPlacementEntries: () => {
    const { placementByCell } = get();
    return Object.entries(placementByCell).map(([key, characterId]) => {
      const [row, col] = key.split(",").map(Number);
      return { characterId, row, col };
    });
  },

  getElapsedSeconds: () => {
    const { startedAt } = get();
    if (!startedAt) return 0;
    return Math.round((Date.now() - startedAt) / 1000);
  },
}));
