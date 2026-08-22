import { Response } from "express";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  chapterLevelParamsSchema,
  submitSolutionSchema,
} from "../validators/puzzleValidators";
import {
  getChaptersOverview,
  getStoryLevel,
  submitStoryLevel,
} from "../services/storyService";

export const getChapters = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) throw new AppError(401, "Non autenticato.");
  const chapters = await getChaptersOverview(req.userId);
  res.status(200).json(chapters);
});

export const getLevel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) throw new AppError(401, "Non autenticato.");
  const { chapter, level } = chapterLevelParamsSchema.parse(req.params);
  const puzzle = await getStoryLevel(req.userId, chapter, level);
  res.status(200).json(puzzle);
});

export const submitLevel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) throw new AppError(401, "Non autenticato.");
  const { chapter, level } = chapterLevelParamsSchema.parse(req.params);
  const { placement } = submitSolutionSchema.parse(req.body);
  const result = await submitStoryLevel(req.userId, chapter, level, placement);
  res.status(200).json(result);
});
