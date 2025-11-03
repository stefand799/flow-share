const mockPrismaInstance = {
    expense: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrismaInstance),
    Currency: {
        USD: 'USD',
        EUR: 'EUR',
        RON: 'RON',
    },
    RecurrenceInterval: {
        WEEKLY: 'WEEKLY',
        MONTHLY: 'MONTHLY',
        YEARLY: 'YEARLY',
    },
}));

import { PrismaClient, Expense, Currency, RecurrenceInterval } from "@prisma/client";
import * as ExpenseService from '../../src/services/expense-service';

const { createExpense, updateExpense, deleteExpense, getAllExpenses, getExpenseById } = ExpenseService;

const db = new PrismaClient() as any;

const EXPENSE_ID = 101;
const GROUP_ID = 5;
const EXPENSE_DATA = {
    title: "Groceries",
    description: "Weekly shop",
    value: 50.75,
    currency: 'USD' as Currency,
    groupId: GROUP_ID,
    isRecurring: false,
    due: new Date("2025-01-01T00:00:00.000Z"),
    recurrenceInterval: null,
};

const MOCK_EXPENSE: Expense = {
    id: EXPENSE_ID,
    ...EXPENSE_DATA,
    createdAt: new Date(),
    updatedAt: new Date(),
    Contributions: [], 
} as any;


describe('Expense Service', () => {

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterAll(() => {
        (console.error as jest.Mock).mockRestore();
        (console.warn as jest.Mock).mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrismaInstance.expense.create.mockResolvedValue(MOCK_EXPENSE);
        mockPrismaInstance.expense.update.mockResolvedValue(MOCK_EXPENSE);
        mockPrismaInstance.expense.findUnique.mockResolvedValue(MOCK_EXPENSE);
        mockPrismaInstance.expense.delete.mockResolvedValue(MOCK_EXPENSE); 
        mockPrismaInstance.expense.findMany.mockResolvedValue([MOCK_EXPENSE]);
    });

    describe('createExpense', () => {
        it('should call prisma.expense.create with correct data and return the created expense', async () => {
            const result = await createExpense(EXPENSE_DATA as any, db);

            expect(mockPrismaInstance.expense.create).toHaveBeenCalledWith({
                data: EXPENSE_DATA,
            });
            expect(result).toEqual(MOCK_EXPENSE);
        });

        it('should return null if prisma.create throws a generic error', async () => {
            mockPrismaInstance.expense.create.mockRejectedValue(new Error('DB connection failed'));
            
            const result = await createExpense(EXPENSE_DATA as any, db);
            
            expect(result).toBeNull();
        });
    });

    describe('updateExpense', () => {
        const update = { title: "Updated Groceries", value: 60.00 };

        it('should call prisma.expense.update and return the updated expense', async () => {
            const result = await updateExpense(EXPENSE_ID, update as any, db);

            expect(mockPrismaInstance.expense.update).toHaveBeenCalledWith({
                where: { id: EXPENSE_ID },
                data: update,
            });
            expect(result).toEqual(MOCK_EXPENSE);
        });

        it('should return null if expense is not found (Prisma P2025 error)', async () => {
            mockPrismaInstance.expense.update.mockRejectedValue({ code: 'P2025' });
            
            const result = await updateExpense(EXPENSE_ID, update as any, db);
            
            expect(result).toBeNull();
        });

        it('should return null if prisma.update throws a generic error', async () => {
            mockPrismaInstance.expense.update.mockRejectedValue(new Error('DB failure'));
            
            const result = await updateExpense(EXPENSE_ID, update as any, db);
            
            expect(result).toBeNull();
        });
    });

    describe('deleteExpense', () => {
        it('should call prisma.expense.delete and return true on success', async () => {
            const result = await deleteExpense(EXPENSE_ID, db);

            expect(mockPrismaInstance.expense.delete).toHaveBeenCalledWith({
                where: { id: EXPENSE_ID },
            });
            expect(result).toBe(true);
        });

        it('should return false if expense is not found (Prisma P2025 error)', async () => {
            mockPrismaInstance.expense.delete.mockRejectedValue({ code: 'P2025' });
            
            const result = await deleteExpense(EXPENSE_ID, db);
            
            expect(result).toBe(false);
        });

        it('should return false if prisma.delete throws a generic error', async () => {
            mockPrismaInstance.expense.delete.mockRejectedValue(new Error('DB failure'));
            
            const result = await deleteExpense(EXPENSE_ID, db);
            
            expect(result).toBe(false);
        });
    });

    describe('getAllExpenses', () => {
        it('should call prisma.expense.findMany with correct group ID and inclusion fields', async () => {
            const result = await getAllExpenses(GROUP_ID, db);

            expect(mockPrismaInstance.expense.findMany).toHaveBeenCalledTimes(1);
            expect(mockPrismaInstance.expense.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { groupId: GROUP_ID },
                    include: { Contributions: expect.any(Object) },
                    orderBy: { createdAt: 'desc' },
                })
            );
            expect(result).toEqual([MOCK_EXPENSE]);
        });
    });

    describe('getExpenseById', () => {
        it('should call prisma.expense.findUnique with correct ID and inclusion fields', async () => {
            const result = await getExpenseById(EXPENSE_ID, db);

            expect(mockPrismaInstance.expense.findUnique).toHaveBeenCalledTimes(1);
            expect(mockPrismaInstance.expense.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: EXPENSE_ID },
                    include: { Contributions: expect.any(Object) },
                })
            );
            expect(result).toEqual(MOCK_EXPENSE);
        });

        it('should return null if expense is not found', async () => {
            mockPrismaInstance.expense.findUnique.mockResolvedValue(null);
            
            const result = await getExpenseById(EXPENSE_ID, db);
            
            expect(result).toBeNull();
        });
    });
});