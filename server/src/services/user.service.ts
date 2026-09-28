import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { ScopeUser } from "../utils/taskScope";

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export class UserService {
  async listOrgUsers(requestingUser: ScopeUser) {
    return prisma.user.findMany({
      where: { orgId: requestingUser.orgId },
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: "asc" },
    });
  }

  async updateUserRole(requestingUser: ScopeUser, targetUserId: string, newRole: Role) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw new AppError("User not found", 404);
    }

    if (target.orgId !== requestingUser.orgId) {
      throw new AppError("Forbidden", 403);
    }

    if (targetUserId === requestingUser.id) {
      throw new AppError("Cannot change your own role", 400);
    }

    return prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: SAFE_USER_SELECT,
    });
  }
}

export const userService = new UserService();
