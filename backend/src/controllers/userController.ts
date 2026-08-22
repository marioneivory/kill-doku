import { Response } from "express";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import { updateThemeSchema } from "../validators/authValidators";
import { getFullProgress, getUserProfile, updateUserTheme } from "../services/userService";

export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) throw new AppError(401, "Non autenticato.");
  const user = await getUserProfile(req.userId);
  res.status(200).json(user);
});

export const patchTheme = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) throw new AppError(401, "Non autenticato.");
  const { theme } = updateThemeSchema.parse(req.body);
  const updated = await updateUserTheme(req.userId, theme);
  res.status(200).json(updated);
});

export const getProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) throw new AppError(401, "Non autenticato.");
  const progress = await getFullProgress(req.userId);
  res.status(200).json(progress);
});
