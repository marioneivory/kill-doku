import { ClueConstraint, ClueType, GridCellData } from "./types";

type Placement = Array<[number, number]>;

interface CellIndex {
  areaOf: Map<string, string>;
  objectOf: Map<string, string | null>;
}

export function buildCellIndex(cells: GridCellData[]): CellIndex {
  const areaOf = new Map<string, string>();
  const objectOf = new Map<string, string | null>();
  for (const cell of cells) {
    const key = `${cell.row},${cell.col}`;
    areaOf.set(key, cell.areaName);
    objectOf.set(key, cell.objectKey);
  }
  return { areaOf, objectOf };
}

const ADJACENT_OFFSETS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * Valuta se un vincolo strutturato è soddisfatto da un dato placement.
 * Questa è la ÙNICA fonte di verità logica: sia la derivazione degli indizi
 * sia il solver di unicità usano questa stessa funzione, così non può
 * esistere disallineamento tra "indizio generato" e "indizio verificato".
 */
export function evaluateConstraint(
  constraint: ClueConstraint,
  placement: Placement,
  index: CellIndex,
  gridSize: number
): boolean {
  const [sr, sc] = placement[constraint.subjectIndex];
  const subjectArea = index.areaOf.get(`${sr},${sc}`)!;

  switch (constraint.type) {
    case "ADJACENT_TO_OBJECT": {
      return ADJACENT_OFFSETS.some(([dr, dc]) => {
        const nr = sr + dr;
        const nc = sc + dc;
        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) return false;
        return index.objectOf.get(`${nr},${nc}`) === constraint.objectKey;
      });
    }
    case "IN_AREA": {
      return subjectArea === constraint.areaName;
    }
    case "ISOLATED_IN_CORNER": {
      const isCorner =
        (sr === 0 || sr === gridSize - 1) &&
        (sc === 0 || sc === gridSize - 1);
      if (!isCorner) return false;
      // "da solo in un angolo": nessun altro personaggio nelle 8 celle attorno
      return placement.every(([r, c], idx) => {
        if (idx === constraint.subjectIndex) return true;
        return Math.abs(r - sr) > 1 || Math.abs(c - sc) > 1;
      });
    }
    case "ISOLATED_IN_AREA": {
      return placement.every(([r, c], idx) => {
        if (idx === constraint.subjectIndex) return true;
        return index.areaOf.get(`${r},${c}`) !== subjectArea;
      });
    }
    case "DIRECTIONAL_TO_CHARACTER":
    case "DIRECTIONAL_TO_VICTIM": {
      const [tr, tc] = placement[constraint.targetIndex!];
      switch (constraint.direction) {
        case "N":
          return sr < tr;
        case "S":
          return sr > tr;
        case "O": // Ovest
          return sc < tc;
        case "E":
          return sc > tc;
        default:
          return false;
      }
    }
    case "ABSOLUTE_ROW": {
      return sr === constraint.row;
    }
    case "ABSOLUTE_COLUMN": {
      return sc === constraint.col;
    }
    case "SAME_AREA_AS": {
      const [tr, tc] = placement[constraint.targetIndex!];
      return subjectArea === index.areaOf.get(`${tr},${tc}`);
    }
    case "NEVER_SAME_ROW_AS":
    case "NEVER_SAME_COLUMN_AS": {
      // Nota di design: dato che la regola base impone un solo personaggio
      // per riga/colonna nell'intera griglia, questi due vincoli sono SEMPRE
      // veri per costruzione e non trasportano informazione discriminante.
      // Vengono valutati per completezza ma esclusi dal pool di derivazione
      // (vedi generateCandidateClues) perché inutili ai fini dell'unicità.
      return true;
    }
    default:
      return false;
  }
}

/** Genera il testo italiano dell'indizio per un dato vincolo. */
export function constraintToText(
  constraint: ClueConstraint,
  names: string[],
  gridSize: number
): string {
  switch (constraint.type) {
    case "ADJACENT_TO_OBJECT":
      return `Era accanto a: ${constraint.objectKey}.`;
    case "IN_AREA":
      return `Era nella stanza: ${constraint.areaName}.`;
    case "ISOLATED_IN_CORNER":
      return "Era da solo in un angolo della villa.";
    case "ISOLATED_IN_AREA":
      return "Era da solo nella sua stanza.";
    case "DIRECTIONAL_TO_CHARACTER": {
      const dirWord = { N: "a nord", S: "a sud", E: "a est", O: "a ovest" }[
        constraint.direction!
      ];
      return `Era ${dirWord} di ${names[constraint.targetIndex!]}.`;
    }
    case "DIRECTIONAL_TO_VICTIM": {
      const dirWord = { N: "a nord", S: "a sud", E: "a est", O: "a ovest" }[
        constraint.direction!
      ];
      return `Era ${dirWord} della vittima.`;
    }
    case "ABSOLUTE_ROW":
      if (constraint.row === 0) return "Era nella prima riga della griglia.";
      if (constraint.row === gridSize - 1)
        return "Era nell'ultima riga della griglia.";
      return `Era nella riga ${constraint.row! + 1}.`;
    case "ABSOLUTE_COLUMN":
      if (constraint.col === 0)
        return "Era nella prima colonna della griglia.";
      if (constraint.col === gridSize - 1)
        return "Era nell'ultima colonna della griglia.";
      return `Era nella colonna ${constraint.col! + 1}.`;
    case "SAME_AREA_AS":
      return `Era nella stessa stanza di ${names[constraint.targetIndex!]}.`;
    default:
      return "Indizio sconosciuto.";
  }
}

/**
 * Genera il pool di TUTTI gli indizi veri (candidati) derivabili dalla
 * soluzione per un dato personaggio. Il chiamante (puzzleGenerator) ne
 * selezionerà via via un sottoinsieme minimo sufficiente all'unicità.
 */
export function generateCandidateClues(
  subjectIndex: number,
  placement: Placement,
  cells: GridCellData[],
  index: CellIndex,
  gridSize: number,
  victimIndex: number,
  rng: () => number
): ClueConstraint[] {
  const candidates: ClueConstraint[] = [];
  const [sr, sc] = placement[subjectIndex];

  // Adiacenza a oggetto
  for (const [dr, dc] of ADJACENT_OFFSETS) {
    const nr = sr + dr;
    const nc = sc + dc;
    if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
    const obj = index.objectOf.get(`${nr},${nc}`);
    if (obj) {
      candidates.push({
        type: "ADJACENT_TO_OBJECT",
        subjectIndex,
        objectKey: obj,
      });
    }
  }

  // Area
  candidates.push({
    type: "IN_AREA",
    subjectIndex,
    areaName: index.areaOf.get(`${sr},${sc}`),
  });

  const c: ClueConstraint = { type: "ISOLATED_IN_CORNER", subjectIndex };
  if (evaluateConstraint(c, placement, index, gridSize)) candidates.push(c);

  const c2: ClueConstraint = { type: "ISOLATED_IN_AREA", subjectIndex };
  if (evaluateConstraint(c2, placement, index, gridSize)) candidates.push(c2);

  // Direzionali verso ogni altro personaggio (incluso, separatamente, la vittima)
  placement.forEach((_, targetIndex) => {
    if (targetIndex === subjectIndex) return;
    const [tr, tc] = placement[targetIndex];
    const dirs: Array<"N" | "S" | "E" | "O"> = [];
    if (sr < tr) dirs.push("N");
    if (sr > tr) dirs.push("S");
    if (sc > tc) dirs.push("E");
    if (sc < tc) dirs.push("O");
    for (const direction of dirs) {
      candidates.push({
        type:
          targetIndex === victimIndex
            ? "DIRECTIONAL_TO_VICTIM"
            : "DIRECTIONAL_TO_CHARACTER",
        subjectIndex,
        targetIndex,
        direction,
      });
    }
  });

  // Posizione assoluta
  candidates.push({ type: "ABSOLUTE_ROW", subjectIndex, row: sr });
  candidates.push({ type: "ABSOLUTE_COLUMN", subjectIndex, col: sc });

  // Stessa area di un altro personaggio
  placement.forEach((_, targetIndex) => {
    if (targetIndex === subjectIndex) return;
    const cc: ClueConstraint = {
      type: "SAME_AREA_AS",
      subjectIndex,
      targetIndex,
    };
    if (evaluateConstraint(cc, placement, index, gridSize)) candidates.push(cc);
  });

  // Shuffle per varietà tra puzzle generati con lo stesso seed pattern
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Priorità: gli indizi "a soggetto singolo" (posizione assoluta, area,
  // adiacenza a oggetto) restringono direttamente il dominio di celle
  // candidate per un personaggio e sono quindi molto più efficaci nel
  // ridurre lo spazio di ricerca rispetto a quelli relazionali (direzionali,
  // stessa area, isolamento), che dipendono dalle assegnazioni altrui.
  // Anteponendoli si arriva all'unicità con MOLTI meno indizi complessivi.
  const DOMAIN_RESTRICTING: ClueType[] = [
    "ABSOLUTE_ROW",
    "ABSOLUTE_COLUMN",
    "IN_AREA",
    "ADJACENT_TO_OBJECT",
  ];
  candidates.sort((a, b) => {
    const aPriority = DOMAIN_RESTRICTING.includes(a.type) ? 0 : 1;
    const bPriority = DOMAIN_RESTRICTING.includes(b.type) ? 0 : 1;
    return aPriority - bPriority;
  });

  return candidates;
}
