import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email non valida."),
  password: z
    .string()
    .min(8, "La password deve avere almeno 8 caratteri.")
    .max(128),
});

export const loginSchema = z.object({
  email: z.string().email("Email non valida."),
  password: z.string().min(1, "Password obbligatoria."),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken obbligatorio."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email non valida."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "La password deve avere almeno 8 caratteri."),
});

export const updateThemeSchema = z.object({
  theme: z.enum(["LIGHT", "DARK"]),
});
