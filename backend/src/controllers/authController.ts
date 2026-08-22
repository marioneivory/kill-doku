import { Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/authValidators";
import {
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  requestPasswordReset,
  resetPassword,
} from "../services/authService";

export const register = asyncHandler(async (req, res: Response) => {
  const { email, password } = registerSchema.parse(req.body);
  const tokens = await registerUser(email, password);
  res.status(201).json(tokens);
});

export const login = asyncHandler(async (req, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const tokens = await loginUser(email, password);
  res.status(200).json(tokens);
});

export const refresh = asyncHandler(async (req, res: Response) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const tokens = await refreshSession(refreshToken);
  res.status(200).json(tokens);
});

export const logout = asyncHandler(async (req, res: Response) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  await logoutUser(refreshToken);
  res.status(204).send();
});

export const forgotPassword = asyncHandler(async (req, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  await requestPasswordReset(email);
  // Risposta sempre 200 generica, per non rivelare l'esistenza dell'account.
  res.status(200).json({
    message: "Se l'email è registrata, riceverai le istruzioni per il reset.",
  });
});

export const resetPasswordHandler = asyncHandler(async (req, res: Response) => {
  const { token, newPassword } = resetPasswordSchema.parse(req.body);
  await resetPassword(token, newPassword);
  res.status(200).json({ message: "Password aggiornata con successo." });
});
