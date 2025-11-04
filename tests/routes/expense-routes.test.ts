import request from 'supertest';
import express, { Router, Request, Response, NextFunction } from 'express';

import expenseRouter from '../../src/routes/expense-routes'; 


const MOCK_RESPONSE_TEXT = 'EXPENSE_CONTROLLER_OK';
jest.mock('../../src/controllers/expense-controller', () => ({
    handleCreate: jest.fn((req, res) => res.status(201).send(MOCK_RESPONSE_TEXT)),
    handleGetAll: jest.fn((req, res) => res.status(200).send(MOCK_RESPONSE_TEXT)),
    handleGetExpense: jest.fn((req, res) => res.status(200).send(MOCK_RESPONSE_TEXT)),
    handleUpdate: jest.fn((req, res) => res.status(200).send(MOCK_RESPONSE_TEXT)),
    handleDelete: jest.fn((req, res) => res.status(200).send(MOCK_RESPONSE_TEXT)),
}));
const mockExpenseController = require('../../src/controllers/expense-controller');

const AUTH_DENIED_TEXT = 'ACCESS DENIED';
jest.mock('../../src/middleware/auth-middleware', () => {
    const mockAuthenticate = jest.fn((req: Request, res: Response, next: NextFunction) => next());
    return {
        authenticate: mockAuthenticate,
    };
});
const mockAuthenticate = require('../../src/middleware/auth-middleware').authenticate;


const app = express();
app.use(express.json()); 
app.use('/expenses', expenseRouter); 

const GROUP_ID = 101;
const EXPENSE_ID = 50;
const GROUP_ROUTE = `/expenses/group/${GROUP_ID}`;
const EXPENSE_ROUTE = `/expenses/${EXPENSE_ID}`;
const VALID_BODY = { title: "Test", value: 100, groupId: GROUP_ID };


describe('Expense Router', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticate.mockImplementation((req: Request, res: Response, next: NextFunction) => next()); 
    });

    const mockMiddlewareFailure = () => {
        mockAuthenticate.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
            res.status(401).send(AUTH_DENIED_TEXT);
        });
    };

    describe('POST /', () => {
        it('should route POST / through authenticate and to handleCreate on success', async () => {
            const response = await request(app).post('/expenses').send(VALID_BODY);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockExpenseController.handleCreate).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(201); 
        });

        it('should block POST / request if authenticate middleware fails', async () => {
            mockMiddlewareFailure();
            const response = await request(app).post('/expenses').send(VALID_BODY);

            expect(response.status).toBe(401);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockExpenseController.handleCreate).not.toHaveBeenCalled();
        });
    });

    describe('GET /group/:groupId', () => {
        it('should route GET /group/:groupId through authenticate and to handleGetAll on success', async () => {
            const response = await request(app).get(GROUP_ROUTE);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockExpenseController.handleGetAll).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
        });

        it('should block GET /group/:groupId request if authenticate middleware fails', async () => {
            mockMiddlewareFailure();
            const response = await request(app).get(GROUP_ROUTE);

            expect(response.status).toBe(401);
            expect(mockExpenseController.handleGetAll).not.toHaveBeenCalled();
        });
    });
    
    describe('GET /:expenseId', () => {
        it('should route GET /:expenseId through authenticate and to handleGetExpense on success', async () => {
            const response = await request(app).get(EXPENSE_ROUTE);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockExpenseController.handleGetExpense).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
        });

        it('should block GET /:expenseId request if authenticate middleware fails', async () => {
            mockMiddlewareFailure();
            const response = await request(app).get(EXPENSE_ROUTE);

            expect(response.status).toBe(401);
            expect(mockExpenseController.handleGetExpense).not.toHaveBeenCalled();
        });
    });

    describe('PUT /:expenseId', () => {
        it('should route PUT /:expenseId through authenticate and to handleUpdate on success', async () => {
            const response = await request(app).put(EXPENSE_ROUTE).send({ title: "New" });

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockExpenseController.handleUpdate).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
        });

        it('should block PUT /:expenseId request if authenticate middleware fails', async () => {
            mockMiddlewareFailure();
            const response = await request(app).put(EXPENSE_ROUTE).send({ title: "New" });

            expect(response.status).toBe(401);
            expect(mockExpenseController.handleUpdate).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /:expenseId', () => {
        it('should route DELETE /:expenseId through authenticate and to handleDelete on success', async () => {
            const response = await request(app).delete(EXPENSE_ROUTE);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockExpenseController.handleDelete).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
        });

        it('should block DELETE /:expenseId request if authenticate middleware fails', async () => {
            mockMiddlewareFailure();
            const response = await request(app).delete(EXPENSE_ROUTE);

            expect(response.status).toBe(401);
            expect(mockExpenseController.handleDelete).not.toHaveBeenCalled();
        });
    });
});
