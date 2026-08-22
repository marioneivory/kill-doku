import { Prisma, PuzzleMode } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { PuzzleGenerationResult } from "../engine/types";
import { AppError } from "../middleware/errorHandler";

/** DTO restituito al client: MAI include solutionRow/solutionCol o solutionData. */
export interface PuzzleClientDTO {
  id: string;
  mode: PuzzleMode;
  chapterNumber: number | null;
  levelNumber: number | null;
  gridSize: number;
  theme: string;
  title: string;
  introText: string;
  difficulty: string;
  gridCells: Array<{
    row: number;
    col: number;
    areaName: string;
    objectKey: string | null;
    isOccupiable: boolean;
  }>;
  characters: Array<{
    id: string;
    name: string;
    clueText: string;
    clueType: string;
    // isVictim è pubblico (serve a giocare); isKiller NON viene mai esposto,
    // altrimenti il puzzle sarebbe risolto in automatico dal payload stesso.
    isVictim: boolean;
  }>;
}

/** Persiste un puzzle generato dal motore come record Prisma con relazioni. */
export async function persistGeneratedPuzzle(
  generated: PuzzleGenerationResult,
  mode: PuzzleMode,
  chapterNumber: number | null,
  levelNumber: number | null
) {
  return prisma.puzzle.create({
    data: {
      mode,
      chapterNumber,
      levelNumber,
      gridSize: generated.gridSize,
      theme: generated.theme,
      title: generated.title,
      introText: generated.introText,
      difficulty: generated.difficulty,
      // I vincoli strutturati restano lato server per eventuale
      // ri-validazione/debug: non sono mai serializzati verso il client.
      solutionData: { constraints: generated.constraints } as unknown as Prisma.InputJsonValue,
      gridCells: {
        create: generated.gridCells.map((cell) => ({
          row: cell.row,
          col: cell.col,
          areaName: cell.areaName,
          objectKey: cell.objectKey,
          isOccupiable: cell.isOccupiable,
        })),
      },
      characters: {
        create: generated.characters.map((ch) => ({
          name: ch.name,
          isVictim: ch.isVictim,
          isKiller: ch.isKiller,
          clueText: ch.clueText,
          clueType: ch.clueType,
          solutionRow: ch.solutionRow,
          solutionCol: ch.solutionCol,
        })),
      },
    },
    include: { characters: true, gridCells: true },
  });
}

type PuzzleWithRelations = Prisma.PuzzleGetPayload<{
  include: { characters: true; gridCells: true };
}>;

export function serializePuzzleForClient(
  puzzle: PuzzleWithRelations
): PuzzleClientDTO {
  return {
    id: puzzle.id,
    mode: puzzle.mode,
    chapterNumber: puzzle.chapterNumber,
    levelNumber: puzzle.levelNumber,
    gridSize: puzzle.gridSize,
    theme: puzzle.theme,
    title: puzzle.title,
    introText: puzzle.introText,
    difficulty: puzzle.difficulty,
    gridCells: puzzle.gridCells.map((c) => ({
      row: c.row,
      col: c.col,
      areaName: c.areaName,
      objectKey: c.objectKey,
      isOccupiable: c.isOccupiable,
    })),
    characters: puzzle.characters.map((c) => ({
      id: c.id,
      name: c.name,
      clueText: c.clueText,
      clueType: c.clueType,
      isVictim: c.isVictim,
    })),
  };
}

export interface SubmissionResult {
  correct: boolean;
  killerCharacterId: string | null;
  // Per ogni personaggio inviato: se la sua cella coincide con la soluzione.
  perCharacterCorrect: Record<string, boolean>;
}

/**
 * Valida un tentativo utente confrontando il placement inviato (per ID
 * personaggio) con solutionRow/solutionCol memorizzati server-side. Il
 * risultato è "corretto" solo se OGNI personaggio è nella cella esatta
 * della soluzione unica calcolata alla generazione.
 */
export async function validateSubmission(
  puzzleId: string,
  placement: Array<{ characterId: string; row: number; col: number }>
): Promise<SubmissionResult> {
  const puzzle = await prisma.puzzle.findUnique({
    where: { id: puzzleId },
    include: { characters: true },
  });

  if (!puzzle) {
    throw new AppError(404, "Puzzle non trovato.");
  }

  const submittedByCharacter = new Map(
    placement.map((p) => [p.characterId, p])
  );

  const perCharacterCorrect: Record<string, boolean> = {};
  let allCorrect = puzzle.characters.length === placement.length;

  for (const character of puzzle.characters) {
    const submitted = submittedByCharacter.get(character.id);
    const isCorrect =
      !!submitted &&
      submitted.row === character.solutionRow &&
      submitted.col === character.solutionCol;
    perCharacterCorrect[character.id] = isCorrect;
    if (!isCorrect) allCorrect = false;
  }

  const killer = puzzle.characters.find((c) => c.isKiller);

  return {
    correct: allCorrect,
    // L'identità dell'assassino viene rivelata SOLO quando il tentativo è
    // corretto: se sbagliato, il client non deve poter dedurre la risposta.
    killerCharacterId: allCorrect ? killer?.id ?? null : null,
    perCharacterCorrect,
  };
}
