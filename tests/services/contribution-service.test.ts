import { Contribution } from "@prisma/client";
import { 
    createContribution, 
    updateContribution, 
    deleteContribution, 
    getAllContributionsByExpense, 
    findExistingContribution,
} from '../../src/services/contribution-service';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    groupMember: {
      findFirst: jest.fn(),
    },
    contribution: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Contribution: {},
  };
});

const { PrismaClient } = require('@prisma/client');
const mockPrisma = new PrismaClient();
const db = mockPrisma as any; 

class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, code: string) {
        super(message);
        this.code = code;
    }
}

const CONTRIBUTION_ID = 42;
const EXPENSE_ID = 101;
const GROUP_MEMBER_ID = 55;
const TEST_USER_ID = 1;
const TEST_GROUP_ID = 5;

const CONTRIBUTION_INPUT = {
    value: 25.50,
    expenseId: EXPENSE_ID,
    groupMemberId: GROUP_MEMBER_ID,
};

const MOCK_CONTRIBUTION: Contribution = {
    id: CONTRIBUTION_ID,
    value: 25.50,
    expenseId: EXPENSE_ID,
    groupMemberId: GROUP_MEMBER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;


describe('Contribution Service', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mockPrisma.contribution.create.mockResolvedValue(MOCK_CONTRIBUTION);
        mockPrisma.contribution.update.mockResolvedValue(MOCK_CONTRIBUTION);
        mockPrisma.contribution.delete.mockResolvedValue(MOCK_CONTRIBUTION);
        mockPrisma.contribution.findMany.mockResolvedValue([MOCK_CONTRIBUTION]);
        mockPrisma.contribution.findFirst.mockResolvedValue(MOCK_CONTRIBUTION);
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    describe('createContribution', () => {
        it('should create and return a contribution on success', async () => {
            const result = await createContribution(CONTRIBUTION_INPUT, db);
            
            expect(mockPrisma.contribution.create).toHaveBeenCalledWith({
                data: CONTRIBUTION_INPUT,
            });
            expect(result).toEqual(MOCK_CONTRIBUTION);
        });

        it('should return null and log error if create fails', async () => {
            mockPrisma.contribution.create.mockRejectedValue(new Error('DB Error'));
            
            const result = await createContribution(CONTRIBUTION_INPUT, db);
            
            expect(console.error).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe('updateContribution', () => {
        const NEW_VALUE = 99.99;

        it('should update and return the contribution on success', async () => {
            const result = await updateContribution(CONTRIBUTION_ID, NEW_VALUE, db);
            
            expect(mockPrisma.contribution.update).toHaveBeenCalledWith({
                where: { id: CONTRIBUTION_ID },
                data: { value: NEW_VALUE },
            });
            expect(result).toEqual(MOCK_CONTRIBUTION);
        });

        it('should return null if contribution is not found (P2025)', async () => {
            const error = new PrismaClientKnownRequestError('Not found', 'P2025');
            mockPrisma.contribution.update.mockRejectedValue(error);
            
            const result = await updateContribution(CONTRIBUTION_ID, NEW_VALUE, db);
            
            expect(result).toBeNull();
        });

        it('should return null and log error for other errors', async () => {
            mockPrisma.contribution.update.mockRejectedValue(new Error('DB Error'));
            
            const result = await updateContribution(CONTRIBUTION_ID, NEW_VALUE, db);
            
            expect(console.error).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe('deleteContribution', () => {
        it('should delete the contribution and return true on success', async () => {
            const result = await deleteContribution(CONTRIBUTION_ID, db);
            
            expect(mockPrisma.contribution.delete).toHaveBeenCalledWith({
                where: { id: CONTRIBUTION_ID },
            });
            expect(result).toBe(true);
        });

        it('should return false if contribution is not found (P2025)', async () => {
            const error = new PrismaClientKnownRequestError('Not found', 'P2025');
            mockPrisma.contribution.delete.mockRejectedValue(error);
            
            const result = await deleteContribution(CONTRIBUTION_ID, db);
            
            expect(result).toBe(false);
        });

        it('should return false and log error for other errors', async () => {
            mockPrisma.contribution.delete.mockRejectedValue(new Error('DB Error'));
            
            const result = await deleteContribution(CONTRIBUTION_ID, db);
            
            expect(console.error).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });

    describe('getAllContributionsByExpense', () => {
        it('should return all contributions for an expense', async () => {
            const contributions = [MOCK_CONTRIBUTION, { ...MOCK_CONTRIBUTION, id: 43 }];
            mockPrisma.contribution.findMany.mockResolvedValue(contributions);
            
            const result = await getAllContributionsByExpense(EXPENSE_ID, db);
            
            expect(mockPrisma.contribution.findMany).toHaveBeenCalledWith({
                where: { expenseId: EXPENSE_ID },
                include: {
                    member: {
                        include: {
                            user: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
            expect(result).toEqual(contributions);
        });
    });

    describe('findExistingContribution', () => {
        it('should return the contribution if found', async () => {
            mockPrisma.contribution.findFirst.mockResolvedValue(MOCK_CONTRIBUTION);
            
            const result = await findExistingContribution(EXPENSE_ID, GROUP_MEMBER_ID, db);
            
            expect(mockPrisma.contribution.findFirst).toHaveBeenCalledWith({
                where: {
                    expenseId: EXPENSE_ID,
                    groupMemberId: GROUP_MEMBER_ID,
                },
            });
            expect(result).toEqual(MOCK_CONTRIBUTION);
        });

        it('should return null if contribution is not found', async () => {
            mockPrisma.contribution.findFirst.mockResolvedValue(null);
            
            const result = await findExistingContribution(EXPENSE_ID, GROUP_MEMBER_ID, db);
            
            expect(result).toBeNull();
        });

        it('should return null and log error if query fails', async () => {
            mockPrisma.contribution.findFirst.mockRejectedValue(new Error('DB Error'));
            
            const result = await findExistingContribution(EXPENSE_ID, GROUP_MEMBER_ID, db);
            
            expect(console.error).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });
});