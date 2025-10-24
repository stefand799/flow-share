import { Router } from "express";
import * as TaskController from "../controllers/task-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

router.post("/", authenticate, TaskController.handleCreate);

router.get("/group/:groupId", authenticate, TaskController.handleGetAll);

router.get("/:taskId", authenticate, TaskController.handleGetTask);

router.put("/:taskId", authenticate, TaskController.handleUpdate);

router.delete("/:taskId", authenticate, TaskController.handleDelete);

router.put("/:taskId/claim", authenticate, TaskController.handleClaim);

router.put("/:taskId/unclaim", authenticate, TaskController.handleUnclaim);

router.put("/:taskId/stage", authenticate, TaskController.handleChangeStage);

export default router;