import { generatePuzzle } from "../engine/puzzleGenerator";
import { solvePuzzle } from "../engine/solver";
import { DIFFICULTY_CONFIG, Difficulty } from "../engine/types";

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD", "EXPERT"];
const PUZZLES_PER_DIFFICULTY = 50;

describe("puzzleGenerator — unicità della soluzione", () => {
  for (const difficulty of DIFFICULTIES) {
    it(`genera ${PUZZLES_PER_DIFFICULTY} puzzle ${difficulty} tutti con soluzione unica`, () => {
      const config = DIFFICULTY_CONFIG[difficulty];

      for (let i = 0; i < PUZZLES_PER_DIFFICULTY; i++) {
        const puzzle = generatePuzzle({ difficulty, seed: i * 7919 + 1 });

        expect(puzzle.gridSize).toBe(config.gridSize);
        expect(puzzle.characters).toHaveLength(config.characterCount);

        // Il solver, senza conoscere la soluzione, deve trovare
        // ESATTAMENTE una configurazione valida dati griglia + indizi.
        const solutions = solvePuzzle(
          puzzle.gridSize,
          puzzle.characters.length,
          puzzle.gridCells,
          puzzle.constraints,
          { maxSolutions: 2 }
        );
        expect(solutions).toHaveLength(1);

        // La soluzione trovata dal solver deve coincidere con quella
        // effettivamente generata (stesso set di coppie riga/colonna).
        const found = new Set(solutions[0].map(([r, c]) => `${r},${c}`));
        const expected = new Set(
          puzzle.solution.map(([r, c]) => `${r},${c}`)
        );
        expect(found).toEqual(expected);
      }
    });
  }
});

describe("puzzleGenerator — integrità strutturale", () => {
  it("rispetta il vincolo una riga/una colonna per personaggio", () => {
    const puzzle = generatePuzzle({ difficulty: "MEDIUM", seed: 42 });
    const rows = new Set(puzzle.solution.map(([r]) => r));
    const cols = new Set(puzzle.solution.map(([, c]) => c));
    expect(rows.size).toBe(puzzle.solution.length);
    expect(cols.size).toBe(puzzle.solution.length);
  });

  it("ha esattamente una vittima e un assassino nella stessa area, soli", () => {
    const puzzle = generatePuzzle({ difficulty: "MEDIUM", seed: 43 });
    const victims = puzzle.characters.filter((c) => c.isVictim);
    const killers = puzzle.characters.filter((c) => c.isKiller);
    expect(victims).toHaveLength(1);
    expect(killers).toHaveLength(1);

    const victimCell = puzzle.gridCells.find(
      (cell) =>
        cell.row === victims[0].solutionRow &&
        cell.col === victims[0].solutionCol
    )!;
    const killerCell = puzzle.gridCells.find(
      (cell) =>
        cell.row === killers[0].solutionRow &&
        cell.col === killers[0].solutionCol
    )!;
    expect(victimCell.areaName).toBe(killerCell.areaName);

    const othersInArea = puzzle.characters.filter((c) => {
      const cell = puzzle.gridCells.find(
        (gc) => gc.row === c.solutionRow && gc.col === c.solutionCol
      )!;
      return (
        cell.areaName === victimCell.areaName &&
        !c.isVictim &&
        !c.isKiller
      );
    });
    expect(othersInArea).toHaveLength(0);
  });

  it("ogni personaggio piazzato è su una cella occupabile", () => {
    const puzzle = generatePuzzle({ difficulty: "HARD", seed: 44 });
    for (const character of puzzle.characters) {
      const cell = puzzle.gridCells.find(
        (gc) =>
          gc.row === character.solutionRow && gc.col === character.solutionCol
      )!;
      expect(cell.isOccupiable).toBe(true);
    }
  });

  it("ogni personaggio ha almeno un indizio testuale non vuoto", () => {
    const puzzle = generatePuzzle({ difficulty: "EASY", seed: 45 });
    for (const character of puzzle.characters) {
      expect(character.clueText.length).toBeGreaterThan(0);
    }
  });

  it("la griglia copre tutte le celle N×N con un'area assegnata", () => {
    const puzzle = generatePuzzle({ difficulty: "EASY", seed: 46 });
    expect(puzzle.gridCells).toHaveLength(puzzle.gridSize * puzzle.gridSize);
    expect(puzzle.gridCells.every((c) => !!c.areaName)).toBe(true);
  });
});
