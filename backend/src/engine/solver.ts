import { ClueConstraint, GridCellData } from "./types";
import { buildCellIndex, evaluateConstraint } from "./clueGenerator";

type Placement = Array<[number, number]>;
type Cell = [number, number];

export interface SolverOptions {
  /** Numero massimo di soluzioni da trovare prima di fermarsi (default 2, per test di unicità). */
  maxSolutions?: number;
}

/**
 * Solver CSP a backtracking con:
 *  - dominio iniziale per personaggio ristretto dai vincoli "a soggetto
 *    singolo" (ABSOLUTE_ROW, ABSOLUTE_COLUMN, IN_AREA, ADJACENT_TO_OBJECT),
 *    verificabili senza conoscere le altre assegnazioni;
 *  - vincolo strutturale "una riga/una colonna per personaggio" applicato
 *    come forward-checking (AllDifferent su righe e colonne separatamente);
 *  - euristica MRV (Minimum Remaining Values): ad ogni passo si assegna il
 *    personaggio con meno celle candidate rimaste, per massimizzare il
 *    pruning e rendere trattabili griglie fino a 12x12 con ~11 personaggi.
 * I vincoli relazionali (direzionali, stessa area, isolamento) restano
 * valutati in linea non appena le loro dipendenze sono assegnate.
 */
export function solvePuzzle(
  gridSize: number,
  characterCount: number,
  cells: GridCellData[],
  constraints: ClueConstraint[],
  options: SolverOptions = {}
): Placement[] {
  const maxSolutions = options.maxSolutions ?? 2;
  const index = buildCellIndex(cells);
  const occupiable = new Map<string, boolean>();
  for (const cell of cells) {
    occupiable.set(`${cell.row},${cell.col}`, cell.isOccupiable);
  }

  // ---- 1) Dominio statico per personaggio, dai vincoli a soggetto singolo ----
  const singleSubjectTypes = new Set([
    "ABSOLUTE_ROW",
    "ABSOLUTE_COLUMN",
    "IN_AREA",
    "ADJACENT_TO_OBJECT",
  ]);

  const staticDomains: Cell[][] = Array.from({ length: characterCount }, () => {
    const all: Cell[] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (occupiable.get(`${r},${c}`) !== false) all.push([r, c]);
      }
    }
    return all;
  });

  const constraintsBySubject = new Map<number, ClueConstraint[]>();
  for (const c of constraints) {
    if (!constraintsBySubject.has(c.subjectIndex)) {
      constraintsBySubject.set(c.subjectIndex, []);
    }
    constraintsBySubject.get(c.subjectIndex)!.push(c);
  }

  for (let charIndex = 0; charIndex < characterCount; charIndex++) {
    const relevant = (constraintsBySubject.get(charIndex) ?? []).filter((c) =>
      singleSubjectTypes.has(c.type)
    );
    if (relevant.length === 0) continue;

    staticDomains[charIndex] = staticDomains[charIndex].filter(([r, c]) => {
      const areaName = index.areaOf.get(`${r},${c}`);
      return relevant.every((constraint) => {
        switch (constraint.type) {
          case "ABSOLUTE_ROW":
            return r === constraint.row;
          case "ABSOLUTE_COLUMN":
            return c === constraint.col;
          case "IN_AREA":
            return areaName === constraint.areaName;
          case "ADJACENT_TO_OBJECT": {
            const offsets = [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ];
            return offsets.some(([dr, dc]) => {
              const nr = r + dr;
              const nc = c + dc;
              if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize)
                return false;
              return index.objectOf.get(`${nr},${nc}`) === constraint.objectKey;
            });
          }
          default:
            return true;
        }
      });
    });
  }

  // ---- 2) Vincoli relazionali/isolamento, valutati durante il backtracking ----
  const relationalConstraints = constraints.filter(
    (c) => !singleSubjectTypes.has(c.type)
  );

  function relationalDependenciesAssigned(
    constraint: ClueConstraint,
    assignedMask: boolean[]
  ): boolean {
    if (!assignedMask[constraint.subjectIndex]) return false;
    if (
      constraint.targetIndex !== undefined &&
      !assignedMask[constraint.targetIndex]
    ) {
      return false;
    }
    if (
      constraint.type === "ISOLATED_IN_AREA" ||
      constraint.type === "ISOLATED_IN_CORNER"
    ) {
      return assignedMask.every(Boolean);
    }
    return true;
  }

  // ---- 3) Backtracking con MRV + forward checking riga/colonna ----
  const solutions: Placement[] = [];
  const placement: Placement = Array.from({ length: characterCount }, () => [
    -1,
    -1,
  ]);
  const assignedMask = Array(characterCount).fill(false);
  const usedRows = new Set<number>();
  const usedCols = new Set<number>();

  function currentDomain(charIndex: number): Cell[] {
    return staticDomains[charIndex].filter(
      ([r, c]) => !usedRows.has(r) && !usedCols.has(c)
    );
  }

  function pickNextCharacter(): { charIndex: number; domain: Cell[] } | null {
    let best = -1;
    let bestDomain: Cell[] = [];
    let bestSize = Infinity;
    for (let i = 0; i < characterCount; i++) {
      if (assignedMask[i]) continue;
      const domain = currentDomain(i);
      if (domain.length < bestSize) {
        bestSize = domain.length;
        best = i;
        bestDomain = domain;
        if (bestSize === 0) break;
      }
    }
    if (best === -1) return null;
    return { charIndex: best, domain: bestDomain };
  }

  function relationalHold(charIndex: number): boolean {
    assignedMask[charIndex] = true;
    for (const constraint of relationalConstraints) {
      if (!relationalDependenciesAssigned(constraint, assignedMask)) continue;
      if (!evaluateConstraint(constraint, placement, index, gridSize)) {
        assignedMask[charIndex] = false;
        return false;
      }
    }
    return true;
  }

  function backtrack(assignedCount: number): void {
    if (solutions.length >= maxSolutions) return;
    if (assignedCount === characterCount) {
      solutions.push(placement.map(([r, c]) => [r, c]));
      return;
    }

    const next = pickNextCharacter();
    if (!next || next.domain.length === 0) return;
    const { charIndex, domain } = next;

    for (const [r, c] of domain) {
      placement[charIndex] = [r, c];
      usedRows.add(r);
      usedCols.add(c);

      if (relationalHold(charIndex)) {
        backtrack(assignedCount + 1);
      } else {
        assignedMask[charIndex] = false;
      }

      usedRows.delete(r);
      usedCols.delete(c);
      placement[charIndex] = [-1, -1];
      assignedMask[charIndex] = false;

      if (solutions.length >= maxSolutions) return;
    }
  }

  backtrack(0);
  return solutions;
}

/** true se e solo se esiste ESATTAMENTE una soluzione. */
export function hasUniqueSolution(
  gridSize: number,
  characterCount: number,
  cells: GridCellData[],
  constraints: ClueConstraint[]
): boolean {
  const solutions = solvePuzzle(gridSize, characterCount, cells, constraints, {
    maxSolutions: 2,
  });
  return solutions.length === 1;
}
