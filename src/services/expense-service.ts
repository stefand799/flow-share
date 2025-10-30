import { PrismaClient, Expense, Currency, RecurrenceInterval } from "../generated/prisma";

const prisma = new PrismaClient();

type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'Contributions'>;

/**
 * Create a new expense
 * @param expenseData - Expense data including title, value, currency, etc.
 * @returns Created expense, or null if creation fails
 */
export const createExpense = async (expenseData: ExpenseInput): Promise<Expense | null> => {
    try {
        const createdExpense = await prisma.expense.create({
            data: {
                title: expenseData.title,
                description: expenseData.description,
                value: expenseData.value,
                currency: expenseData.currency,
                groupId: expenseData.groupId,
                isRecurring: expenseData.isRecurring,
                due: expenseData.due,
                recurrenceInterval: expenseData.recurrenceInterval,
            },
        });

        return createdExpense;
    } catch (error) {
        console.error("Prisma Error in createExpense:", error);
        return null;
    }
};

/**
 * Update an expense's information
 * @param expenseId - The expense's ID
 * @param dataToUpdate - Partial expense data to update
 * @returns Updated expense, or null if expense doesn't exist
 */
export const updateExpense = async (
    expenseId: number, 
    dataToUpdate: Partial<ExpenseInput>
): Promise<Expense | null> => {
    try {
        const updatedExpense = await prisma.expense.update({
            where: { id: expenseId },
            data: dataToUpdate,
        });

        return updatedExpense;
    } catch (error: any) {
        // P2025 is Prisma's code for "Record to update not found"
        if (error.code === 'P2025') {
            return null;
        }
        console.error("Prisma Error in updateExpense:", error);
        return null;
    }
};

/**
 * Delete an expense by its ID
 * @param expenseId - The expense's ID
 * @returns true if deleted successfully, false if expense doesn't exist
 */
export const deleteExpense = async (expenseId: number): Promise<boolean> => {
    try {
        await prisma.expense.delete({ 
            where: { id: expenseId } 
        });

        return true;
    } catch (error: any) {
        // P2025 is Prisma's code for "Record to delete does not exist"
        if (error.code === 'P2025') {
            return false;
        }
        console.error("Prisma Error in deleteExpense:", error);
        return false;
    }
};

/**
 * Get all expenses for a specific group
 * @param groupId - The group's ID
 * @returns Array of expenses ordered by creation date (newest first)
 */
export const getAllExpenses = async (groupId: number): Promise<Expense[]> => {
    const expenses = await prisma.expense.findMany({
        where: { 
            groupId: groupId 
        },
        include: {
            Contributions: {
                include: {
                    member: {
                        include: {
                            user: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc',
        }
    });

    return expenses;
};

/**
 * Get a specific expense by ID
 * @param expenseId - The expense's ID
 * @returns Expense object, or null if not found
 */
export const getExpenseById = async (expenseId: number): Promise<Expense | null> => {
    const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
            Contributions: {
                include: {
                    member: {
                        include: {
                            user: true
                        }
                    }
                }
            }
        }
    });

    return expense;
};