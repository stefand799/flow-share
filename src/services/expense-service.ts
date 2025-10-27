import { PrismaClient, Expense, Currency, RecurrenceInterval } from "@prisma/client";

const prisma = new PrismaClient();

type Prisma = typeof prisma;
type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'Contributions'>;

export const createExpense = async (
    expenseData: ExpenseInput,
    db: Prisma = prisma
): Promise<Expense | null> => {
    try {
        const createdExpense = await db.expense.create({
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

export const updateExpense = async (
    expenseId: number, 
    dataToUpdate: Partial<ExpenseInput>,
    db: Prisma = prisma
): Promise<Expense | null> => {
    try {
        const updatedExpense = await db.expense.update({
            where: { id: expenseId },
            data: dataToUpdate,
        });

        return updatedExpense;
    } catch (error: any) {
        if (error.code === 'P2025') {
            return null;
        }
        console.error("Prisma Error in updateExpense:", error);
        return null;
    }
};

export const deleteExpense = async (expenseId: number, db: Prisma = prisma): Promise<boolean> => {
    try {
        await db.expense.delete({ 
            where: { id: expenseId } 
        });

        return true;
    } catch (error: any) {
        if (error.code === 'P2025') {
            return false;
        }
        console.error("Prisma Error in deleteExpense:", error);
        return false;
    }
};

export const getAllExpenses = async (groupId: number, db: Prisma = prisma): Promise<Expense[]> => {
    const expenses = await db.expense.findMany({
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

export const getExpenseById = async (expenseId: number, db: Prisma = prisma): Promise<Expense | null> => {
    const expense = await db.expense.findUnique({
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
