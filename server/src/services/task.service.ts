import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { buildTaskScopeWhere, canAccessTask, ScopeUser } from "../utils/taskScope";
import { BulkUpdateInput, CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "../schemas/task.schema";

type Cursor = { updatedAt: string; id: string };

export class TaskService {
  private encodeCursor(cursor: Cursor): string {
    return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64");
  }

  private decodeCursor(raw: string): Cursor {
    try {
      const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
      if (typeof parsed.updatedAt !== "string" || typeof parsed.id !== "string") {
        throw new Error("malformed cursor");
      }
      return parsed;
    } catch {
      throw new AppError("Invalid cursor", 400);
    }
  }

  private async loadAccessibleTask(user: ScopeUser, taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new AppError("Task not found", 404);
    }
    if (!canAccessTask(user, task)) {
      throw new AppError("Forbidden", 403);
    }
    return task;
  }

  async listTasks(user: ScopeUser, query: ListTasksQuery) {
    const where: Prisma.TaskWhereInput = { ...buildTaskScopeWhere(user) };

    const and: Prisma.TaskWhereInput[] = [];

    if (query.status) and.push({ status: query.status });
    if (query.priority) and.push({ priority: query.priority });
    if (query.tags && query.tags.length > 0) and.push({ tags: { hasSome: query.tags } });
    if (query.q) and.push({ title: { contains: query.q, mode: "insensitive" } });

    if (query.cursor) {
      const cursor = this.decodeCursor(query.cursor);
      const cursorDate = new Date(cursor.updatedAt);
      and.push({
        OR: [
          { updatedAt: { lt: cursorDate } },
          { updatedAt: cursorDate, id: { lt: cursor.id } },
        ],
      });
    }

    if (and.length > 0) where.AND = and;

    const limit = query.limit ?? 20;

    const results = await prisma.task.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;
    const nextCursor =
      hasMore && items.length > 0
        ? this.encodeCursor({
            updatedAt: items[items.length - 1].updatedAt.toISOString(),
            id: items[items.length - 1].id,
          })
        : null;

    return { items, nextCursor };
  }

  async createTask(user: ScopeUser, data: CreateTaskInput) {
    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        tags: data.tags ?? [],
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        orgId: user.orgId,
        ownerId: user.id,
      },
    });
  }

  async updateTask(user: ScopeUser, taskId: string, data: UpdateTaskInput) {
    await this.loadAccessibleTask(user, taskId);

    return prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
      },
    });
  }

  async deleteTask(user: ScopeUser, taskId: string): Promise<void> {
    await this.loadAccessibleTask(user, taskId);
    await prisma.task.delete({ where: { id: taskId } });
  }

  async bulkUpdateTasks(user: ScopeUser, { ids, set }: BulkUpdateInput) {
    const allowedTasks = await prisma.task.findMany({
      where: { id: { in: ids }, ...buildTaskScopeWhere(user) },
      select: { id: true },
    });

    const allowedIds = allowedTasks.map((t) => t.id);
    const skippedIds = ids.filter((id) => !allowedIds.includes(id));

    if (allowedIds.length > 0) {
      await prisma.task.updateMany({
        where: { id: { in: allowedIds } },
        data: {
          ...(set.status !== undefined && { status: set.status }),
          ...(set.priority !== undefined && { priority: set.priority }),
        },
      });
    }

    return { updatedIds: allowedIds, skippedIds };
  }
}

export const taskService = new TaskService();
