import { z } from "zod";
import { Priority, TaskStatus } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
  priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "title is required").optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
});

export const listTasksQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((t) => t.trim()).filter(Boolean) : undefined)),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

export const bulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "at least one id is required"),
  set: z
    .object({
      status: z.nativeEnum(TaskStatus).optional(),
      priority: z.nativeEnum(Priority).optional(),
    })
    .refine((data) => data.status !== undefined || data.priority !== undefined, {
      message: "set must include at least status or priority",
    }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
