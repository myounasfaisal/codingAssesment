import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies";
import { AppError } from "../utils/AppError";
import { authService } from "../services/auth.service";

export class AuthController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"];
    const { user, ...tokens } = await authService.login(email, password, userAgent);
    setAuthCookies(res, tokens);
    sendSuccess(res, { user }, 200);
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, orgName } = req.body;
    const userAgent = req.headers["user-agent"];
    const { user, ...tokens } = await authService.register(email, password, orgName, userAgent);
    setAuthCookies(res, tokens);
    sendSuccess(res, { user }, 201);
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new AppError("Unauthorized", 401);
    }
    const { user, ...tokens } = await authService.refresh(refreshToken);
    setAuthCookies(res, tokens);
    sendSuccess(res, { user }, 200);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    clearAuthCookies(res);
    sendSuccess(res, null, 200);
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, { user: req.user }, 200);
  });
}

export const authController = new AuthController();
