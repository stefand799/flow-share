import { PrismaClient, Expense, Currency, RecurrenceInterval } from "../generated/prisma";

const prisma = new PrismaClient();

type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'Contributions'>;

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

export const updateExpense = async (expenseId: number, dataToUpdate: Partial<ExpenseInput>): Promise<Expense | null> => {
    try {
        const updatedExpense = await prisma.expense.update({
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


export const deleteExpense = async (expenseId: number): Promise<boolean> => {
    try {
        await prisma.expense.delete({ where: { id: expenseId } });
        return true;
    } catch (error: any) {
        if (error.code === 'P2025') {
            return false;
        }
        console.error("Prisma Error in deleteExpense:", error);
        return false;
    }
};

export const getAllExpenses = async (groupId: number): Promise<Expense[]> => {
    const expenses = await prisma.expense.findMany({
        where: { groupId: groupId },
        orderBy: {
            createdAt: 'desc', 
        }
    });
    return expenses;
};
