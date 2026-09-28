import type { Role } from "./auth";

export interface OrgUser {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}
