import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate.middleware";
import { updateUserRoleSchema } from "../schemas/user.schema";
import { userController } from "../controllers/user.controller";

const router = Router();

router.use(authenticate, requireRole(Role.ADMIN));

router.get("/", userController.listOrgUsers);
router.patch("/:id/role", validate(updateUserRoleSchema), userController.updateUserRole);

export default router;
