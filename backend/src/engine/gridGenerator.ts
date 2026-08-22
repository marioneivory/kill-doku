import { GridCellData, OBJECT_POOL } from "./types";

const AREA_NAME_POOL = [
  "Cucina",
  "Salotto",
  "Cantina",
  "Giardino",
  "Biblioteca",
  "Sala da pranzo",
  "Studio",
  "Camera da letto",
  "Soffitta",
  "Veranda",
  "Sala da ballo",
  "Serra",
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Divide la griglia N×N in `areaCount` aree contigue tramite un semplice
 * flood-fill/region-growing multi-seed: si scelgono K celle seme casuali e
 * si espandono a turno (BFS randomizzato) finché ogni cella appartiene a
 * un'area. Garantisce aree contigue (connesse per adiacenza ortogonale).
 */
export function generateAreaLayout(
  gridSize: number,
  areaCount: number,
  rng: () => number
): string[][] {
  const owner: number[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(-1)
  );

  const allCells: [number, number][] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) allCells.push([r, c]);
  }
  const shuffled = shuffle(allCells, rng);
  const seeds = shuffled.slice(0, areaCount);

  const frontier: [number, number][][] = seeds.map((s) => [s]);
  seeds.forEach(([r, c], idx) => {
    owner[r][c] = idx;
  });

  let remaining = gridSize * gridSize - seeds.length;
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (remaining > 0) {
    let progressed = false;
    for (let areaIdx = 0; areaIdx < areaCount; areaIdx++) {
      if (remaining <= 0) break;
      const queue = frontier[areaIdx];
      // Prova ad espandere questa area di una cella casuale del suo bordo
      const candidates: [number, number][] = [];
      for (const [r, c] of queue) {
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 &&
            nr < gridSize &&
            nc >= 0 &&
            nc < gridSize &&
            owner[nr][nc] === -1
          ) {
            candidates.push([nr, nc]);
          }
        }
      }
      if (candidates.length === 0) continue;
      const [nr, nc] = shuffle(candidates, rng)[0];
      owner[nr][nc] = areaIdx;
      frontier[areaIdx].push([nr, nc]);
      remaining--;
      progressed = true;
    }
    // Nel caso (raro) in cui alcune aree restino intrappolate senza bordo
    // libero mentre esistono ancora celle orfane, assegna le orfane
    // all'area contigua più vicina disponibile per garantire copertura totale.
    if (!progressed && remaining > 0) {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (owner[r][c] === -1) {
            for (const [dr, dc] of dirs) {
              const nr = r + dr;
              const nc = c + dc;
              if (
                nr >= 0 &&
                nr < gridSize &&
                nc >= 0 &&
                nc < gridSize &&
                owner[nr][nc] !== -1
              ) {
                owner[r][c] = owner[nr][nc];
                frontier[owner[r][c]].push([r, c]);
                remaining--;
                break;
              }
            }
          }
        }
      }
    }
  }

  const areaNames = shuffle(AREA_NAME_POOL, rng).slice(0, areaCount);
  return owner.map((row) => row.map((idx) => areaNames[idx]));
}

/**
 * Genera le celle della griglia con aree, oggetti/arredi e occupabilità.
 * `reservedCells` (le posizioni della soluzione) restano SEMPRE occupabili
 * e senza oggetto bloccante, perché lì devono poter stare i personaggi.
 */
export function generateGridCells(
  gridSize: number,
  areaCount: number,
  objectDensity: number,
  reservedCells: Set<string>,
  rng: () => number
): GridCellData[] {
  const areaMap = generateAreaLayout(gridSize, areaCount, rng);
  const cells: GridCellData[] = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const key = `${r},${c}`;
      const isReserved = reservedCells.has(key);
      const roll = rng();
      const hasObject = !isReserved && roll < objectDensity;
      // Solo una piccola quota degli oggetti rende la cella non occupabile
      // (es. uno scaffale enorme blocca il passaggio, una pianta no).
      const blocking = hasObject && rng() < 0.4;

      cells.push({
        row: r,
        col: c,
        areaName: areaMap[r][c],
        objectKey: hasObject
          ? OBJECT_POOL[Math.floor(rng() * OBJECT_POOL.length)]
          : null,
        isOccupiable: !blocking,
      });
    }
  }
  return cells;
}
