import { Router } from "express";
import * as ContributionController from "../controllers/contribution-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

// RESTful Contribution Routes

// POST /api/contributions - Create a new contribution
router.post("/", authenticate, ContributionController.handleCreate);

// GET /api/contributions/expense/:expenseId - Get all contributions for an expense
router.get("/expense/:expenseId", authenticate, ContributionController.handleGetAll);

// PUT /api/contributions/:contributionId - Update a contribution
router.put("/:contributionId", authenticate, ContributionController.handleUpdate);

// DELETE /api/contributions/:contributionId - Delete a contribution
router.delete("/:contributionId", authenticate, ContributionController.handleDelete);

export default router;