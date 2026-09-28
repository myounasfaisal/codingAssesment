import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        ...(err.code ? { code: err.code } : {}),
      },
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";
  console.error(err);

  res.status(500).json({
    success: false,
    error: {
      message,
    },
  });
}
