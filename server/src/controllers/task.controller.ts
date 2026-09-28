import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import { taskService } from "../services/task.service";
import { ListTasksQuery } from "../schemas/task.schema";

export class TaskController {
  listTasks = asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedQuery as ListTasksQuery;
    const result = await taskService.listTasks(req.user!, query);
    sendSuccess(res, result, 200);
  });

  createTask = asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.createTask(req.user!, req.body);
    sendSuccess(res, task, 201);
  });

  updateTask = asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.updateTask(req.user!, req.params.id, req.body);
    sendSuccess(res, task, 200);
  });

  deleteTask = asyncHandler(async (req: Request, res: Response) => {
    await taskService.deleteTask(req.user!, req.params.id);
    res.status(204).send();
  });

  bulkUpdateTasks = asyncHandler(async (req: Request, res: Response) => {
    const result = await taskService.bulkUpdateTasks(req.user!, req.body);
    sendSuccess(res, result, 200);
  });
}

export const taskController = new TaskController();
