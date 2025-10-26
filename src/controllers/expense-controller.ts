import { Request, Response } from "express";
import * as ExpenseService from "../services/expense-service";
import { User, Currency, RecurrenceInterval } from "../generated/prisma";

interface AuthenticateRequest extends Request {
    user?: Omit<User, 'passwordHash'>;
}

/**
 * Validate currency and recurrence interval enums
 */
const validateEnums = (currency: string, recurrence: string) => {
    const validCurrency = Object.values(Currency).includes(currency as Currency) 
        ? currency as Currency 
        : undefined;
    const validRecurrence = Object.values(RecurrenceInterval).includes(recurrence as RecurrenceInterval) 
        ? recurrence as RecurrenceInterval 
        : undefined;

    return { validCurrency, validRecurrence };
};

/**
 * POST /api/expenses
 * Create a new expense
 */
export const handleCreate = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const { title, description, value, currency, groupId, isRecurring, due, recurrenceInterval } = req.body;

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    // Validate required fields
    if (!title || !value || !groupId) {
        return res.status(400).json({ 
            message: "Title, value, and group ID are required." 
        });
    }

    const valueFloat = parseFloat(value);
    if (isNaN(valueFloat) || valueFloat <= 0) {
        return res.status(400).json({ 
            message: "Value must be a positive number." 
        });
    }

    const { validCurrency, validRecurrence } = validateEnums(currency, recurrenceInterval);

    try {
        const newExpenseData = {
            title,
            description: description || null,
            value: valueFloat,
            currency: validCurrency || Currency.USD,
            groupId: parseInt(groupId),
            isRecurring: !!isRecurring,
            due: due ? new Date(due) : null,
            recurrenceInterval: validRecurrence || RecurrenceInterval.NONE,
        };

        const createdExpense = await ExpenseService.createExpense(newExpenseData as any);

        if (!createdExpense) {
            return res.status(500).json({ 
                message: "Could not create expense." 
            });
        }

        return res.status(201).json({ 
            message: "Expense created successfully.",
            expense: createdExpense 
        });
    } catch (err: any) {
        console.error("Error in handleCreate:", err);
        return res.status(500).json({ 
            message: "An error occurred while creating the expense." 
        });
    }
};

/**
 * GET /api/expenses/group/:groupId
 * Get all expenses for a specific group
 */
export const handleGetAll = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const groupId = parseInt(req.params.groupId);

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    if (isNaN(groupId)) {
        return res.status(400).json({ 
            message: "Invalid group ID format." 
        });
    }

    try {
        const expenses = await ExpenseService.getAllExpenses(groupId);

        return res.status(200).json({ 
            expenses 
        });
    } catch (err: any) {
        console.error("Error in handleGetAll:", err);
        return res.status(500).json({ 
            message: "An error occurred while retrieving expenses." 
        });
    }
};

/**
 * GET /api/expenses/:expenseId
 * Get a specific expense by ID
 */
export const handleGetExpense = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const expenseId = parseInt(req.params.expenseId);

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    if (isNaN(expenseId)) {
        return res.status(400).json({ 
            message: "Invalid expense ID format." 
        });
    }

    try {
        const expense = await ExpenseService.getExpenseById(expenseId);

        if (!expense) {
            return res.status(404).json({ 
                message: "Expense not found." 
            });
        }

        return res.status(200).json({ 
            expense 
        });
    } catch (err: any) {
        console.error("Error in handleGetExpense:", err);
        return res.status(500).json({ 
            message: "An error occurred while retrieving the expense." 
        });
    }
};

/**
 * PUT /api/expenses/:expenseId
 * Update an expense
 */
export const handleUpdate = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const expenseId = parseInt(req.params.expenseId);
    const { title, description, value, currency, isRecurring, due, recurrenceInterval } = req.body;

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    if (isNaN(expenseId)) {
        return res.status(400).json({ 
            message: "Invalid expense ID format." 
        });
    }

    const { validCurrency, validRecurrence } = validateEnums(currency, recurrenceInterval);

    try {
        const dataToUpdate: any = {};
        if (title !== undefined) dataToUpdate.title = title;
        if (description !== undefined) dataToUpdate.description = description;
        if (value !== undefined) {
            const valueFloat = parseFloat(value);
            if (isNaN(valueFloat) || valueFloat <= 0) {
                return res.status(400).json({ 
                    message: "Value must be a positive number." 
                });
            }
            dataToUpdate.value = valueFloat;
        }
        if (validCurrency) dataToUpdate.currency = validCurrency;
        if (isRecurring !== undefined) dataToUpdate.isRecurring = !!isRecurring;
        if (due !== undefined) dataToUpdate.due = due ? new Date(due) : null;
        if (validRecurrence) dataToUpdate.recurrenceInterval = validRecurrence;

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ 
                message: "No valid fields provided for update." 
            });
        }

        const updatedExpense = await ExpenseService.updateExpense(expenseId, dataToUpdate);

        if (!updatedExpense) {
            return res.status(404).json({ 
                message: "Expense not found." 
            });
        }

        return res.status(200).json({ 
            message: "Expense updated successfully.",
            expense: updatedExpense 
        });
    } catch (err: any) {
        console.error("Error in handleUpdate:", err);
        return res.status(500).json({ 
            message: "An error occurred while updating the expense." 
        });
    }
};

/**
 * DELETE /api/expenses/:expenseId
 * Delete an expense
 */
export const handleDelete = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const expenseId = parseInt(req.params.expenseId);

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    if (isNaN(expenseId)) {
        return res.status(400).json({ 
            message: "Invalid expense ID format." 
        });
    }

    try {
        const deleted = await ExpenseService.deleteExpense(expenseId);

        if (!deleted) {
            return res.status(404).json({ 
                message: "Expense not found." 
            });
        }

        return res.status(200).json({ 
            message: "Expense deleted successfully." 
        });
    } catch (err: any) {
        console.error("Error in handleDelete:", err);
        return res.status(500).json({ 
            message: "An error occurred while deleting the expense." 
        });
    }
};