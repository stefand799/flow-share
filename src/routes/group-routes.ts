import { Router } from "express";
import * as GroupController from "../controllers/group-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

// RESTful Group Routes

// POST /api/groups - Create a new group
router.post("/", authenticate, GroupController.handleCreate);

// GET /api/groups - Get all groups for authenticated user
router.get("/", authenticate, GroupController.handleGetAll);

// GET /api/groups/:groupId - Get a specific group
router.get("/:groupId", authenticate, GroupController.handleGetGroup);

// PUT /api/groups/:groupId - Update a specific group
router.put("/:groupId", authenticate, GroupController.handleUpdate);

// DELETE /api/groups/:groupId - Delete a specific group
router.delete("/:groupId", authenticate, GroupController.handleDelete);

export default router;