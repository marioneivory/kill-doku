import { apiClient } from "./client";
import { FullProgressDTO, ThemeMode, UserProfile } from "@/types/api";

export async function apiGetMe(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/user/me");
  return data;
}

export async function apiSetTheme(theme: ThemeMode): Promise<{ id: string; theme: ThemeMode }> {
  const { data } = await apiClient.patch("/user/theme", { theme });
  return data;
}

export async function apiGetProgress(): Promise<FullProgressDTO> {
  const { data } = await apiClient.get<FullProgressDTO>("/user/progress");
  return data;
}
