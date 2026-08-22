import { Response } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  randomDifficultySchema,
  submitSolutionSchema,
} from "../validators/puzzleValidators";
import { generateRandomPuzzle, submitRandomPuzzle } from "../services/randomService";

export const getNewRandomPuzzle = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) throw new AppError(401, "Non autenticato.");
    const { difficulty } = randomDifficultySchema.parse(req.query);
    const puzzle = await generateRandomPuzzle(difficulty);
    res.status(200).json(puzzle);
  }
);

const submitRandomBodySchema = submitSolutionSchema.extend({
  puzzleId: z.string().min(1),
});

export const submitRandom = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) throw new AppError(401, "Non autenticato.");
    const { puzzleId, placement, elapsedSeconds } = submitRandomBodySchema.parse(
      req.body
    );
    const result = await submitRandomPuzzle(
      req.userId,
      puzzleId,
      placement,
      elapsedSeconds
    );
    res.status(200).json(result);
  }
);
