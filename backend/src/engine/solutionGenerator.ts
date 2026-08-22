import { GridCellData } from "./types";

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Genera M posizioni (row, col) tali che:
 * - nessuna riga è riusata, nessuna colonna è riusata (vincolo sudoku-like)
 * - ogni cella scelta è isOccupiable
 * Implementato come permutazione casuale di colonne su M righe scelte
 * casualmente tra le N disponibili, con retry se una cella non è occupabile.
 */
export function generateValidPlacement(
  gridSize: number,
  characterCount: number,
  cells: GridCellData[],
  rng: () => number,
  maxAttempts = 500
): Array<[number, number]> | null {
  const occupiableByRowCol = new Map<string, boolean>();
  for (const cell of cells) {
    occupiableByRowCol.set(`${cell.row},${cell.col}`, cell.isOccupiable);
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rows = shuffle(
      Array.from({ length: gridSize }, (_, i) => i),
      rng
    ).slice(0, characterCount);
    const cols = shuffle(
      Array.from({ length: gridSize }, (_, i) => i),
      rng
    ).slice(0, characterCount);

    const placement: Array<[number, number]> = rows.map((r, idx) => [
      r,
      cols[idx],
    ]);

    const allOccupiable = placement.every(
      ([r, c]) => occupiableByRowCol.get(`${r},${c}`) !== false
    );
    if (allOccupiable) return placement;
  }
  return null;
}

/**
 * Sceglie vittima e assassino tra i personaggi piazzati, garantendo che:
 * - l'assassino condivida l'area della vittima
 * - nessun altro personaggio sia in quella stessa area (altrimenti la
 *   regola "unico altro presente" del punto 6 della spec non varrebbe)
 * Ritorna null se la disposizione corrente non permette una coppia valida
 * (il chiamante deve rigenerare il placement).
 */
export function assignVictimAndKiller(
  placement: Array<[number, number]>,
  cells: GridCellData[],
  rng: () => number
): { victimIndex: number; killerIndex: number } | null {
  const areaOf = new Map<string, string>();
  for (const cell of cells) {
    areaOf.set(`${cell.row},${cell.col}`, cell.areaName);
  }

  const areaOfCharacter = placement.map(
    ([r, c]) => areaOf.get(`${r},${c}`)!
  );

  // Raggruppa indici di personaggio per area
  const byArea = new Map<string, number[]>();
  areaOfCharacter.forEach((area, idx) => {
    if (!byArea.has(area)) byArea.set(area, []);
    byArea.get(area)!.push(idx);
  });

  // Aree con esattamente 2 personaggi: coppia candidata vittima/assassino,
  // e nessun terzo occupante -> soddisfa "unico altro presente in quell'area".
  const candidateAreas = [...byArea.values()].filter((idxs) => idxs.length === 2);
  if (candidateAreas.length === 0) return null;

  const chosenPair = candidateAreas[Math.floor(rng() * candidateAreas.length)];
  const [a, b] = shuffle(chosenPair, rng);
  return { victimIndex: a, killerIndex: b };
}
