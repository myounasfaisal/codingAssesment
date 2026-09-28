import { z } from "zod";
import { Role } from "@prisma/client";

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
