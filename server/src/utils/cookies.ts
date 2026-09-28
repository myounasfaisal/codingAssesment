import { Response } from "express";
import { env } from "../config/env";

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthCookieTokens {
  accessToken: string;
  refreshToken: string;
}

const secure = env.NODE_ENV === "production";

export function setAuthCookies(res: Response, { accessToken, refreshToken }: AuthCookieTokens): void {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("accessToken", { httpOnly: true, sameSite: "lax", secure, path: "/" });
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "lax", secure, path: "/" });
}
