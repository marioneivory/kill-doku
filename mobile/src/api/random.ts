import { apiClient } from "./client";
import { Difficulty, PlacementEntry, PuzzleDTO, SubmissionResultDTO } from "@/types/api";

export async function apiGetRandomPuzzle(difficulty: Difficulty): Promise<PuzzleDTO> {
  const { data } = await apiClient.get<PuzzleDTO>("/random/new", {
    params: { difficulty },
  });
  return data;
}

export async function apiSubmitRandomPuzzle(
  puzzleId: string,
  placement: PlacementEntry[],
  elapsedSeconds?: number
): Promise<SubmissionResultDTO> {
  const { data } = await apiClient.post<SubmissionResultDTO>("/random/submit", {
    puzzleId,
    placement,
    elapsedSeconds,
  });
  return data;
}
