import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { AppError } from "./utils/AppError";
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";
import userRoutes from "./routes/user.routes";

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/users", userRoutes);

  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Not found: ${req.method} ${req.originalUrl}`, 404));
  });

  app.use(errorMiddleware);

  return app;
}
