import { Router } from "express";
import * as UserController from "../controllers/user-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

// RESTful User Routes
// GET /api/users/:userId - Get a specific user
router.get("/:userId", authenticate, UserController.handleGetUser);

// PUT /api/users/:userId - Update a specific user
router.put("/:userId", authenticate, UserController.handleUpdate);

// DELETE /api/users/:userId - Delete a specific user
router.delete("/:userId", authenticate, UserController.handleDelete);

export default router;