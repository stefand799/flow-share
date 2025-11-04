import request from 'supertest';
import express, { Router, Request, Response, NextFunction } from 'express';

import userRouter from '../../src/routes/user-routes';


jest.mock('../../src/controllers/user-controller', () => ({
    handleGetUser: jest.fn((req, res) => res.status(200).send('GET_USER_OK')),
    handleUpdate: jest.fn((req, res) => res.status(200).send('UPDATE_OK')),
    handleDelete: jest.fn((req, res) => res.status(200).send('DELETE_OK')),
}));
const mockUserController = require('../../src/controllers/user-controller');


jest.mock('../../src/middleware/auth-middleware', () => {
    const mockAuthenticate = jest.fn((req: Request, res: Response, next: NextFunction) => next());

    return {
        authenticate: mockAuthenticate,
    };
});

const mockAuthenticate = require('../../src/middleware/auth-middleware').authenticate;


const app = express();
app.use(express.json()); 
app.use('/users', userRouter); 

const USER_ID = 10;
const USER_ROUTE = `/users/${USER_ID}`;
const AUTH_DENIED_TEXT = 'ACCESS DENIED';


describe('User Router (/users/:userId)', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticate.mockImplementation((req: Request, res: Response, next: NextFunction) => next()); 
    });

    const mockMiddlewareFailure = () => {
        mockAuthenticate.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
            res.status(403).send(AUTH_DENIED_TEXT);
        });
    };

    describe('GET /:userId', () => {
        it('should route GET /:userId through authenticate and to handleGetUser on success', async () => {
            const response = await request(app).get(USER_ROUTE);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockUserController.handleGetUser).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('GET_USER_OK');
        });

        it('should block GET request if authenticate middleware fails', async () => {
            mockMiddlewareFailure();
            const response = await request(app).get(USER_ROUTE);

            expect(response.status).toBe(403);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockUserController.handleGetUser).not.toHaveBeenCalled();
        });
    });

    describe('PUT /:userId', () => {
        const updateData = { firstName: "NewName", bio: "Updated bio" };

        it('should route PUT /:userId through authenticate and to handleUpdate on success', async () => {
            const response = await request(app).put(USER_ROUTE).send(updateData);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockUserController.handleUpdate).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('UPDATE_OK');
        });

        it('should block PUT request if authenticate middleware fails', async () => {
            mockMiddlewareFailure();
            const response = await request(app).put(USER_ROUTE).send(updateData);

            expect(response.status).toBe(403);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockUserController.handleUpdate).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /:userId', () => {
        it('should route DELETE /:userId through authenticate and to handleDelete on success', async () => {
            const response = await request(app).delete(USER_ROUTE);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockUserController.handleDelete).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('DELETE_OK');
        });

        it('should block DELETE request if authenticate middleware fails', async () => {
            mockMiddlewareFailure();
            const response = await request(app).delete(USER_ROUTE);

            expect(response.status).toBe(403);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockUserController.handleDelete).not.toHaveBeenCalled();
        });
    });
});
