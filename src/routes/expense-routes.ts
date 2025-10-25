import { Router } from "express";
import * as ExpenseController from "../controllers/expense-controller";
import { authenticate } from "../middleware/auth-middleware";
const router = Router();

router.post("/create", authenticate, ExpenseController.handleCreate);
router.put("/update", authenticate, ExpenseController.handleUpdate);
router.delete("/delete", authenticate, ExpenseController.handleDelete);
router.get("/get-all", authenticate, ExpenseController.handleGetAll);

export default router;