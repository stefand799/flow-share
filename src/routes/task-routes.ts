import { Router } from "express";
import * as TaskController from "../controllers/task-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

// RESTful Task Routes

// POST /api/tasks - Create a new task
router.post("/", authenticate, TaskController.handleCreate);

// GET /api/tasks/group/:groupId - Get all tasks for a group
router.get("/group/:groupId", authenticate, TaskController.handleGetAll);

// GET /api/tasks/:taskId - Get a specific task
router.get("/:taskId", authenticate, TaskController.handleGetTask);

// PUT /api/tasks/:taskId - Update a task
router.put("/:taskId", authenticate, TaskController.handleUpdate);

// DELETE /api/tasks/:taskId - Delete a task
router.delete("/:taskId", authenticate, TaskController.handleDelete);

// PUT /api/tasks/:taskId/claim - Claim a task
router.put("/:taskId/claim", authenticate, TaskController.handleClaim);

// PUT /api/tasks/:taskId/unclaim - Unclaim a task
router.put("/:taskId/unclaim", authenticate, TaskController.handleUnclaim);

// PUT /api/tasks/:taskId/stage - Change task stage
router.put("/:taskId/stage", authenticate, TaskController.handleChangeStage);

export default router;