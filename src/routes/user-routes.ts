import { Router } from "express";
import * as UserController from "../controllers/user-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

router.get("/:userId", authenticate, UserController.handleGetUser);

router.put("/:userId", authenticate, UserController.handleUpdate);

router.delete("/:userId", authenticate, UserController.handleDelete);

export default router;