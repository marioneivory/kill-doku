import { apiClient } from "./client";
import {
  ChapterOverviewDTO,
  PlacementEntry,
  PuzzleDTO,
  StoryLevelSubmissionResultDTO,
} from "@/types/api";

export async function apiGetChapters(): Promise<ChapterOverviewDTO[]> {
  const { data } = await apiClient.get<ChapterOverviewDTO[]>("/story/chapters");
  return data;
}

export async function apiGetStoryLevel(
  chapter: number,
  level: number
): Promise<PuzzleDTO> {
  const { data } = await apiClient.get<PuzzleDTO>(`/story/level/${chapter}/${level}`);
  return data;
}

export async function apiSubmitStoryLevel(
  chapter: number,
  level: number,
  placement: PlacementEntry[]
): Promise<StoryLevelSubmissionResultDTO> {
  const { data } = await apiClient.post<StoryLevelSubmissionResultDTO>(
    `/story/level/${chapter}/${level}/submit`,
    { placement }
  );
  return data;
}
