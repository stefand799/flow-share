import { Router } from "express";
import * as ExpenseController from "../controllers/expense-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

router.post("/", authenticate, ExpenseController.handleCreate);

router.get("/group/:groupId", authenticate, ExpenseController.handleGetAll);

router.get("/:expenseId", authenticate, ExpenseController.handleGetExpense);

router.put("/:expenseId", authenticate, ExpenseController.handleUpdate);

router.delete("/:expenseId", authenticate, ExpenseController.handleDelete);

export default router;