import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import storyRoutes from "./routes/storyRoutes";
import randomRoutes from "./routes/randomRoutes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use(morgan(env.isProduction ? "combined" : "dev"));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "kill-doku-backend" });
  });

  app.use("/auth", authRoutes);
  app.use("/user", userRoutes);
  app.use("/story", storyRoutes);
  app.use("/random", randomRoutes);

  // 404 esplicito per rotte non definite
  app.use((req, res) => {
    res.status(404).json({ error: `Rotta non trovata: ${req.method} ${req.path}` });
  });

  app.use(errorHandler);

  return app;
}
