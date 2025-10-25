// The routes should include a :userId parameter for consistency and targeting a specific resource.
// Example route structure: /api/users/:userId/update

import { Router } from "express";
import * as UserController from "../controllers/user-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

// 1. Get a specific user (using :userId in the path)
// Change from "/get-user" to "/:userId"
router.get("/:userId", authenticate, UserController.handleGetUser); 

// 2. Update a specific user
// Change from "/update" to "/:userId/update" or just "/:userId" (common REST practice)
router.put("/:userId", authenticate, UserController.handleUpdate);

// 3. Delete a specific user's account
// Change from "/account-delete" to "/:userId" (for a DELETE request)
router.delete("/:userId", authenticate, UserController.handleDelete); 

export default router;