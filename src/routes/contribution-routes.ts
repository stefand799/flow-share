import { Router } from "express";
import * as ContributionController from "../controllers/contribution-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

router.post("/create", authenticate, ContributionController.handleCreate);
router.put("/update", authenticate, ContributionController.handleUpdate);
router.delete("/delete", authenticate, ContributionController.handleDelete);
router.get("/get-all", authenticate, ContributionController.handleGetAll);

export default router;