import { Router } from "express";
import * as ExpenseController from "../controllers/expense-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

// RESTful Expense Routes

// POST /api/expenses - Create a new expense
router.post("/", authenticate, ExpenseController.handleCreate);

// GET /api/expenses/group/:groupId - Get all expenses for a group
router.get("/group/:groupId", authenticate, ExpenseController.handleGetAll);

// GET /api/expenses/:expenseId - Get a specific expense
router.get("/:expenseId", authenticate, ExpenseController.handleGetExpense);

// PUT /api/expenses/:expenseId - Update an expense
router.put("/:expenseId", authenticate, ExpenseController.handleUpdate);

// DELETE /api/expenses/:expenseId - Delete an expense
router.delete("/:expenseId", authenticate, ExpenseController.handleDelete);

export default router;