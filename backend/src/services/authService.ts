import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import {
  refreshTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { AppError } from "../middleware/errorHandler";

export async function registerUser(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "Esiste già un account con questa email.");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  // Inizializza le statistiche Random a zero, così /user/progress non deve
  // gestire il caso "record mancante" lato lettura.
  await prisma.randomStats.create({ data: { userId: user.id } });

  return issueSessionTokens(user.id, user.email);
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, "Credenziali non valide.");
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Credenziali non valide.");
  }
  return issueSessionTokens(user.id, user.email);
}

async function issueSessionTokens(userId: string, email: string) {
  const accessToken = signAccessToken({ userId, email });
  const refreshToken = signRefreshToken(userId);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: refreshTokenExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

export async function refreshSession(refreshToken: string) {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Refresh token non valido o scaduto.");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError(401, "Refresh token non valido o revocato.");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AppError(401, "Utente non trovato.");
  }

  // Rotazione: revoca il vecchio refresh token e ne emette uno nuovo,
  // riducendo la finestra di rischio in caso di token trafugato.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueSessionTokens(user.id, user.email);
}

export async function logoutUser(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Genera un token di reset password monouso. L'invio email reale è fuori
 * scope per l'ambiente di sviluppo: qui il token viene loggato lato server
 * (provider mock), pronto per essere sostituito da un servizio email reale
 * (es. Resend, SendGrid) in produzione senza cambiare la logica di dominio.
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Risposta identica indipendentemente dall'esistenza dell'utente, per non
  // rivelare quali email sono registrate (user enumeration).
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minuti

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  // Provider mock: in sviluppo l'email "arriva" nei log del server.
  console.log(
    `[MOCK EMAIL] Reset password per ${email}: token=${token} (valido 30 min)`
  );
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });
  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt < new Date()
  ) {
    throw new AppError(400, "Token di reset non valido o scaduto.");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    // Invalida tutte le sessioni esistenti dopo un reset password, per
    // sicurezza (se la password è stata compromessa, tutti i device devono
    // ri-autenticarsi).
    prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
