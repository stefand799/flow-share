import { Router } from "express";
import * as GroupController from "../controllers/group-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

router.post("/", authenticate, GroupController.handleCreate);

router.get("/", authenticate, GroupController.handleGetAll);

router.get("/:groupId", authenticate, GroupController.handleGetGroup);

router.put("/:groupId", authenticate, GroupController.handleUpdate);

router.delete("/:groupId", authenticate, GroupController.handleDelete);

export default router;