import { api } from "./api";
import type { Role } from "../types/auth";
import type { OrgUser } from "../types/user";
import type { ApiSuccess } from "../types/api";

export async function listOrgUsers(): Promise<OrgUser[]> {
  const { data } = await api.get<ApiSuccess<OrgUser[]>>("/users");
  return data.data;
}

export async function updateUserRole(id: string, role: Role): Promise<OrgUser> {
  const { data } = await api.patch<ApiSuccess<OrgUser>>(`/users/${id}/role`, { role });
  return data.data;
}
