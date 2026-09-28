import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { validate, validateQuery } from "../middleware/validate.middleware";
import {
  bulkUpdateSchema,
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from "../schemas/task.schema";
import { taskController } from "../controllers/task.controller";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listTasksQuerySchema), taskController.listTasks);
router.post("/", validate(createTaskSchema), taskController.createTask);

router.patch(
  "/bulk",
  requireRole(Role.MANAGER, Role.ADMIN),
  validate(bulkUpdateSchema),
  taskController.bulkUpdateTasks
);

router.patch("/:id", validate(updateTaskSchema), taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

export default router;
