import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  // jsonwebtoken tipizza `expiresIn` come literal union (es. "15m") più
  // stringente di `string`: il valore arriva da env validata a runtime da
  // zod, quindi il cast è sicuro (documentiamo in .env.example il formato
  // atteso, es. "15m", "1h", "30d").
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

/**
 * Il refresh token è un JWT "opaco" a fini di verifica firma/scadenza, ma la
 * sua validità reale è governata dalla tabella RefreshToken nel DB (revoca
 * per singolo device, rotazione al refresh). Questo permette il logout
 * selettivo e la mitigazione furto-token, cosa che un JWT stateless puro
 * non garantirebbe.
 */
export function signRefreshToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: `${env.JWT_REFRESH_EXPIRES_IN_DAYS}d` as SignOptions["expiresIn"],
  };
  return jwt.sign({ userId, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, options);
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
}

export function refreshTokenExpiryDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + env.JWT_REFRESH_EXPIRES_IN_DAYS);
  return d;
}
