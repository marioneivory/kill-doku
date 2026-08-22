import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL è obbligatoria"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET deve avere almeno 16 caratteri"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, "JWT_REFRESH_SECRET deve avere almeno 16 caratteri"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.string().default("30"),
  CORS_ORIGIN: z.string().default("*"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail-fast: meglio un crash immediato e leggibile all'avvio che un
  // comportamento silenzioso e inconsistente a runtime.
  console.error("❌ Variabili d'ambiente non valide:", parsed.error.flatten().fieldErrors);
  throw new Error("Configurazione ambiente non valida. Controlla il tuo .env (vedi .env.example).");
}

export const env = {
  ...parsed.data,
  PORT: parseInt(parsed.data.PORT, 10),
  JWT_REFRESH_EXPIRES_IN_DAYS: parseInt(parsed.data.JWT_REFRESH_EXPIRES_IN_DAYS, 10),
  isProduction: parsed.data.NODE_ENV === "production",
};
