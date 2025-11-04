import request from 'supertest';
import express, { Router, Request, Response, NextFunction } from 'express';

import contributionRouter from '../../src/routes/contribution-routes';

jest.mock('../../src/controllers/contribution-controller', () => ({
    handleCreate: jest.fn((req, res) => res.status(201).json({ message: 'CREATE_OK' })),
    handleGetAll: jest.fn((req, res) => res.status(200).json({ message: 'GET_ALL_OK' })),
    handleUpdate: jest.fn((req, res) => res.status(200).json({ message: 'UPDATE_OK' })),
    handleDelete: jest.fn((req, res) => res.status(200).json({ message: 'DELETE_OK' })),
}));
const mockController = require('../../src/controllers/contribution-controller');

jest.mock('../../src/middleware/auth-middleware', () => {
    const mockAuthenticate = jest.fn((req: Request, res: Response, next: NextFunction) => next());
    return {
        authenticate: mockAuthenticate,
    };
});

const mockAuthenticate = require('../../src/middleware/auth-middleware').authenticate;


const app = express();
app.use(express.json()); 
app.use('/contributions', contributionRouter);

const EXPENSE_ID = 101;
const CONTRIBUTION_ID = 42;
const AUTH_DENIED_TEXT = 'ACCESS DENIED';


describe('Contribution Router', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticate.mockImplementation((req: Request, res: Response, next: NextFunction) => next()); 
    });

    const mockMiddlewareFailure = (req: Request, res: Response, next: NextFunction) => {
        res.status(401).send(AUTH_DENIED_TEXT);
    };

    describe('POST /', () => {
        const createBody = { value: 100, expenseId: 1, groupId: 5 };
        
        it('should route POST / to handleCreate and call authenticate', async () => {
            const response = await request(app).post('/contributions').send(createBody);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockController.handleCreate).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(201);
        });

        it('should block POST request if authenticate middleware fails', async () => {
            mockAuthenticate.mockImplementationOnce(mockMiddlewareFailure);
            const response = await request(app).post('/contributions').send(createBody);

            expect(response.status).toBe(401);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockController.handleCreate).not.toHaveBeenCalled();
        });
    });

    describe('GET /expense/:expenseId', () => {
        const expenseRoute = `/contributions/expense/${EXPENSE_ID}`;
        
        it('should route GET /expense/:expenseId to handleGetAll and call authenticate', async () => {
            const response = await request(app).get(expenseRoute);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockController.handleGetAll).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
        });

        it('should block GET request if authenticate middleware fails', async () => {
            mockAuthenticate.mockImplementationOnce(mockMiddlewareFailure);
            const response = await request(app).get(expenseRoute);

            expect(response.status).toBe(401);
            expect(mockController.handleGetAll).not.toHaveBeenCalled();
        });
    });

    describe('PUT /:contributionId', () => {
        const updateRoute = `/contributions/${CONTRIBUTION_ID}`;
        const updateBody = { value: 50.00 };

        it('should route PUT /:contributionId to handleUpdate and call authenticate', async () => {
            const response = await request(app).put(updateRoute).send(updateBody);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockController.handleUpdate).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
        });

        it('should block PUT request if authenticate middleware fails', async () => {
            mockAuthenticate.mockImplementationOnce(mockMiddlewareFailure);
            const response = await request(app).put(updateRoute).send(updateBody);

            expect(response.status).toBe(401);
            expect(mockController.handleUpdate).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /:contributionId', () => {
        const deleteRoute = `/contributions/${CONTRIBUTION_ID}`;

        it('should route DELETE /:contributionId to handleDelete and call authenticate', async () => {
            const response = await request(app).delete(deleteRoute);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockController.handleDelete).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
        });

        it('should block DELETE request if authenticate middleware fails', async () => {
            mockAuthenticate.mockImplementationOnce(mockMiddlewareFailure);
            const response = await request(app).delete(deleteRoute);

            expect(response.status).toBe(401);
            expect(mockController.handleDelete).not.toHaveBeenCalled();
        });
    });
});
