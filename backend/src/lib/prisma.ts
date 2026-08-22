import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

// Singleton per evitare di aprire troppe connessioni in dev (hot-reload)
declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

export const prisma =
  global.__prismaClient ??
  new PrismaClient({
    log: env.isProduction ? ["error", "warn"] : ["error", "warn"],
  });

if (!env.isProduction) {
  global.__prismaClient = prisma;
}
