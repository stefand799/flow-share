import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';

// =============================================
// MOCK SERVICES
// =============================================

const mockContributionService = {
    createContribution: jest.fn(),
    getAllContributionsByExpense: jest.fn(),
    getGroupMemberIdByUserIdAndGroupId: jest.fn(),
};
jest.mock('../src/services/contribution-service', () => mockContributionService);

const mockExpenseService = {
    createExpense: jest.fn(),
    getAllExpenses: jest.fn(),
};
jest.mock('../src/services/expense-service', () => mockExpenseService);

const mockUserService = {
    findUserById: jest.fn(),
};
jest.mock('../src/services/user-service', () => mockUserService);

const mockGroupService = {
    getGroupMemberIdByUserIdAndGroupId: jest.fn(),
};
jest.mock('../src/services/group-service', () => mockGroupService);

// Import routes after mocking
import ContributionRoutes from '../src/routes/contribution-routes';
import ExpenseRoutes from '../src/routes/expense-routes';

// =============================================
// TEST SETUP
// =============================================

const MOCK_USER = {
    id: 1,
    username: 'testuser',
    emailAddress: 'test@example.com',
};

const createApp = (): Express => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    
    // Mock authentication middleware
    app.use((req: any, res, next) => {
        req.user = MOCK_USER;
        next();
    });
    
    app.use('/api/contributions', ContributionRoutes);
    app.use('/api/expenses', ExpenseRoutes);
    return app;
};

let app: Express;

describe('Additional Unit Tests for University Project', () => {
    beforeAll(() => {
        app = createApp();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserService.findUserById.mockResolvedValue(MOCK_USER);
    });

    // =============================================
    // TEST 1: Contribution Creation
    // =============================================
    test('1. Should create a contribution successfully', async () => {
        const contributionData = {
            value: 50.0,
            expenseId: 1,
            groupId: 1,
        };

        const mockContribution = {
            id: 1,
            value: 50.0,
            expenseId: 1,
            groupMemberId: 1,
            createdAt: new Date(),
        };

        mockContributionService.getGroupMemberIdByUserIdAndGroupId.mockResolvedValue(1);
        mockContributionService.createContribution.mockResolvedValue(mockContribution);

        const response = await request(app)
            .post('/api/contributions')
            .send(contributionData);

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Contribution created successfully.');
        expect(response.body.contribution).toEqual(mockContribution);
        expect(mockContributionService.createContribution).toHaveBeenCalledWith({
            value: 50.0,
            expenseId: 1,
            groupMemberId: 1,
        });
    });

    // =============================================
    // TEST 2: Invalid Contribution Value
    // =============================================
    test('2. Should reject contribution with invalid value', async () => {
        const contributionData = {
            value: -10, // Invalid: negative value
            expenseId: 1,
            groupId: 1,
        };

        const response = await request(app)
            .post('/api/contributions')
            .send(contributionData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Value must be a positive number.');
        expect(mockContributionService.createContribution).not.toHaveBeenCalled();
    });

    // =============================================
    // TEST 3: Get Contributions by Expense
    // =============================================
    test('3. Should retrieve all contributions for an expense', async () => {
        const expenseId = 1;
        const mockContributions = [
            { id: 1, value: 25.0, expenseId: 1, groupMemberId: 1 },
            { id: 2, value: 30.0, expenseId: 1, groupMemberId: 2 },
        ];

        mockContributionService.getAllContributionsByExpense.mockResolvedValue(mockContributions);

        const response = await request(app)
            .get(`/api/contributions/expense/${expenseId}`);

        expect(response.status).toBe(200);
        expect(response.body.contributions).toEqual(mockContributions);
        expect(mockContributionService.getAllContributionsByExpense).toHaveBeenCalledWith(expenseId);
    });

    // =============================================
    // TEST 4: Expense Creation Validation
    // =============================================
    test('4. Should validate required fields when creating expense', async () => {
        const incompleteExpenseData = {
            title: 'Dinner',
            // Missing: value, currency, groupId
        };

        const response = await request(app)
            .post('/api/expenses')
            .send(incompleteExpenseData);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('required');
        expect(mockExpenseService.createExpense).not.toHaveBeenCalled();
    });

    // =============================================
    // TEST 5: Non-Member Cannot Create Contribution
    // =============================================
    test('5. Should reject contribution from non-group member', async () => {
        const contributionData = {
            value: 50.0,
            expenseId: 1,
            groupId: 1,
        };

        // Simulate user not being a member of the group
        mockContributionService.getGroupMemberIdByUserIdAndGroupId.mockResolvedValue(null);

        const response = await request(app)
            .post('/api/contributions')
            .send(contributionData);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('You are not a member of this group.');
        expect(mockContributionService.createContribution).not.toHaveBeenCalled();
    });
});