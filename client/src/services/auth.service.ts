import { api } from "./api";
import type { AuthUser } from "../types/auth";
import type { ApiSuccess } from "../types/api";

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<ApiSuccess<{ user: AuthUser }>>("/auth/login", { email, password });
  return data.data.user;
}

export async function register(email: string, password: string, orgName: string): Promise<AuthUser> {
  const { data } = await api.post<ApiSuccess<{ user: AuthUser }>>("/auth/register", {
    email,
    password,
    orgName,
  });
  return data.data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // no-op
  }
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<ApiSuccess<{ user: AuthUser }>>("/auth/me");
  return data.data.user;
}
