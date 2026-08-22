import {
  CharacterData,
  ClueConstraint,
  DIFFICULTY_CONFIG,
  Difficulty,
  GridCellData,
  PuzzleGenerationResult,
} from "./types";
import { generateGridCells } from "./gridGenerator";
import { assignVictimAndKiller, generateValidPlacement } from "./solutionGenerator";
import {
  buildCellIndex,
  constraintToText,
  generateCandidateClues,
} from "./clueGenerator";
import { hasUniqueSolution } from "./solver";

const NAME_POOL = [
  "Amelia Rossi",
  "Bruno Conti",
  "Chiara Neri",
  "Dario Ferri",
  "Elena Marino",
  "Fabio Greco",
  "Giulia Ricci",
  "Hugo Bianchi",
  "Irene Colombo",
  "Luca Fontana",
  "Marta Villa",
  "Nico Serra",
];

const THEME_POOL = [
  "Villa di campagna",
  "Nave da crociera",
  "Teatro",
  "Hotel di montagna",
  "Treno notturno",
  "Museo",
];

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Dato un pool di indizi CANDIDATI (tutti veri per la soluzione) per ogni
 * personaggio, seleziona incrementalmente il set minimo sufficiente a
 * rendere la soluzione unica: aggiunge un indizio alla volta (round-robin
 * tra i personaggi) e riverifica con il solver, fermandosi non appena la
 * soluzione diventa unica. Rispecchia il punto 6.3/6.4 della spec.
 */
function selectMinimalClueSet(
  gridSize: number,
  characterCount: number,
  cells: GridCellData[],
  candidatePools: ClueConstraint[][]
): ClueConstraint[] | null {
  const selected: ClueConstraint[] = [];
  const cursors = Array(characterCount).fill(0);
  let addedSomething = true;

  // Prima passata: garantisce almeno un indizio per personaggio (altrimenti
  // un sospettato senza alcun vincolo sarebbe "gratis" e ingiusto da giocare).
  for (let i = 0; i < characterCount; i++) {
    if (candidatePools[i].length === 0) return null; // impossibile, rigenera
    selected.push(candidatePools[i][cursors[i]]);
    cursors[i]++;
  }

  if (hasUniqueSolution(gridSize, characterCount, cells, selected)) {
    return selected;
  }

  while (addedSomething) {
    addedSomething = false;
    for (let i = 0; i < characterCount; i++) {
      if (cursors[i] < candidatePools[i].length) {
        selected.push(candidatePools[i][cursors[i]]);
        cursors[i]++;
        addedSomething = true;
        if (hasUniqueSolution(gridSize, characterCount, cells, selected)) {
          return minimizeClueSet(gridSize, characterCount, cells, selected);
        }
      }
    }
  }
  // Esaurito il pool di indizi candidati senza raggiungere unicità:
  // la griglia/soluzione generata non è "risolvibile in modo pulito",
  // il chiamante deve rigenerare da capo (punto 6.4 della spec).
  return null;
}

/**
 * Fase di potatura: dato un set di indizi che rende la soluzione unica,
 * prova a rimuoverne uno alla volta (in ordine da ultimo ad aggiunto,
 * mantenendo però sempre almeno un indizio per personaggio) e verifica se
 * l'unicità sopravvive. Se sì, la rimozione è definitiva. Il risultato è un
 * set "localmente minimo": nessun indizio residuo è superfluo da solo,
 * garantendo un puzzle leggibile invece di un elenco indizi eccessivo.
 */
function minimizeClueSet(
  gridSize: number,
  characterCount: number,
  cells: GridCellData[],
  clues: ClueConstraint[]
): ClueConstraint[] {
  let current = [...clues];

  for (let i = current.length - 1; i >= 0; i--) {
    const candidate = current[i];

    // Non rimuovere l'unico indizio rimasto per questo personaggio: ogni
    // sospettato deve sempre avere almeno una carta indizio in mano.
    const countForSubject = current.filter(
      (c) => c.subjectIndex === candidate.subjectIndex
    ).length;
    if (countForSubject <= 1) continue;

    const withoutCandidate = current.filter((_, idx) => idx !== i);
    if (hasUniqueSolution(gridSize, characterCount, cells, withoutCandidate)) {
      current = withoutCandidate;
    }
  }
  return current;
}

export interface GeneratePuzzleOptions {
  difficulty: Difficulty;
  theme?: string;
  title?: string;
  introText?: string;
  seed?: number;
  maxGlobalAttempts?: number;
}

export function generatePuzzle(
  options: GeneratePuzzleOptions
): PuzzleGenerationResult {
  const config = DIFFICULTY_CONFIG[options.difficulty];
  const maxGlobalAttempts = options.maxGlobalAttempts ?? 60;
  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = mulberry32(seed);

  for (let attempt = 0; attempt < maxGlobalAttempts; attempt++) {
    // 1) Genera una soluzione "grezza" di posizioni provvisorie per stimare
    //    quali celle vanno riservate come occupabili prima di piazzare gli
    //    oggetti (evita che un mobile blocchi la cella della soluzione).
    const provisionalCells = generateGridCells(
      config.gridSize,
      config.areaCount,
      0, // nessun oggetto in questa passata preliminare
      new Set(),
      rng
    );
    const provisionalPlacement = generateValidPlacement(
      config.gridSize,
      config.characterCount,
      provisionalCells,
      rng
    );
    if (!provisionalPlacement) continue;

    const reserved = new Set(
      provisionalPlacement.map(([r, c]) => `${r},${c}`)
    );

    // 2) Rigenera la griglia definitiva con oggetti/arredi, mantenendo
    //    occupabili le celle della soluzione.
    const cells = generateGridCells(
      config.gridSize,
      config.areaCount,
      config.objectDensity,
      reserved,
      rng
    );

    const placement = generateValidPlacement(
      config.gridSize,
      config.characterCount,
      cells,
      rng
    );
    if (!placement) continue;

    const victimKiller = assignVictimAndKiller(placement, cells, rng);
    if (!victimKiller) continue;
    const { victimIndex, killerIndex } = victimKiller;

    const index = buildCellIndex(cells);
    const candidatePools = placement.map((_, subjectIndex) =>
      generateCandidateClues(
        subjectIndex,
        placement,
        cells,
        index,
        config.gridSize,
        victimIndex,
        rng
      )
    );

    const minimalClues = selectMinimalClueSet(
      config.gridSize,
      config.characterCount,
      cells,
      candidatePools
    );
    if (!minimalClues) continue;

    // Un solo indizio "primario" per personaggio viene mostrato come
    // clueText nella scheda; eventuali indizi extra necessari per
    // l'unicità restano comunque nei constraints strutturati usati dal
    // solver lato server per la validazione del tentativo utente.
    const primaryCluePerCharacter = new Map<number, ClueConstraint>();
    for (const c of minimalClues) {
      if (!primaryCluePerCharacter.has(c.subjectIndex)) {
        primaryCluePerCharacter.set(c.subjectIndex, c);
      }
    }

    const names = NAME_POOL.slice(0, config.characterCount);
    const characters: CharacterData[] = placement.map(([row, col], i) => {
      const primary = primaryCluePerCharacter.get(i)!;
      return {
        name: names[i],
        isVictim: i === victimIndex,
        isKiller: i === killerIndex,
        clueText: constraintToText(primary, names, config.gridSize),
        clueType: primary.type,
        solutionRow: row,
        solutionCol: col,
      };
    });

    const theme = options.theme ?? THEME_POOL[Math.floor(rng() * THEME_POOL.length)];

    return {
      gridSize: config.gridSize,
      theme,
      title: options.title ?? `Delitto a ${theme}`,
      introText:
        options.introText ??
        `Un omicidio è stato commesso a ${theme}. Studia gli indizi e scopri chi, tra i sospettati, si trovava nella stanza della vittima.`,
      difficulty: options.difficulty,
      gridCells: cells,
      characters,
      solution: placement,
      constraints: minimalClues,
    };
  }

  throw new Error(
    `generatePuzzle: impossibile generare un puzzle valido con soluzione unica dopo ${maxGlobalAttempts} tentativi (difficulty=${options.difficulty}). Verificare i parametri di DIFFICULTY_CONFIG.`
  );
}
