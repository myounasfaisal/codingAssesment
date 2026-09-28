export type Role = "USER" | "MANAGER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  orgId: string;
  role: Role;
}

export interface AuthResponse {
  user: AuthUser;
}
