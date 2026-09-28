import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import { userService } from "../services/user.service";
import { UpdateUserRoleInput } from "../schemas/user.schema";

export class UserController {
  listOrgUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await userService.listOrgUsers(req.user!);
    sendSuccess(res, users, 200);
  });

  updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { role } = req.body as UpdateUserRoleInput;
    const user = await userService.updateUserRole(req.user!, req.params.id, role);
    sendSuccess(res, user, 200);
  });
}

export const userController = new UserController();
