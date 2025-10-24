import { Router } from "express";
import * as ContributionController from "../controllers/contribution-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

router.post("/", authenticate, ContributionController.handleCreate);

router.get("/expense/:expenseId", authenticate, ContributionController.handleGetAll);

router.put("/:contributionId", authenticate, ContributionController.handleUpdate);

router.delete("/:contributionId", authenticate, ContributionController.handleDelete);

export default router;