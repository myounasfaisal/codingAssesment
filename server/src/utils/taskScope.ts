import { Prisma, Role } from "@prisma/client";

export type ScopeUser = {
  id: string;
  orgId: string;
  role: Role;
};

type ScopedTask = {
  orgId: string;
  ownerId: string;
};

export function buildTaskScopeWhere(user: ScopeUser): Prisma.TaskWhereInput {
  switch (user.role) {
    case Role.USER:
      return { orgId: user.orgId, ownerId: user.id };
    case Role.MANAGER:
      return { orgId: user.orgId };
    case Role.ADMIN:
      return {};
    default:
      return { id: "__never__" };
  }
}

export function canAccessTask(user: ScopeUser, task: ScopedTask): boolean {
  switch (user.role) {
    case Role.USER:
      return task.orgId === user.orgId && task.ownerId === user.id;
    case Role.MANAGER:
      return task.orgId === user.orgId;
    case Role.ADMIN:
      return true;
    default:
      return false;
  }
}
