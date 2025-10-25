import { Router } from "express";
import * as TaskController from "../controllers/task-controller";
import { authenticate } from "../middleware/auth-middleware";
const router = Router();

router.post("/create", authenticate, TaskController.handleCreate);
router.put("/update", authenticate, TaskController.handleUpdate);
router.delete("/delete", authenticate, TaskController.handleDelete);
router.get("/get-all", authenticate, TaskController.handleGetAll);
router.put("/claim", authenticate, TaskController.handleClaim);
router.put("/unclaim", authenticate, TaskController.handleUnclaim);
router.put("/change-stage", authenticate, TaskController.handleChangeStage);

export default router;