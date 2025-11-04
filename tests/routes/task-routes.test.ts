import request from 'supertest';
import express, { Router, Request, Response, NextFunction } from 'express';

import taskRouter from '../../src/routes/task-routes';

jest.mock('../../src/controllers/task-controller', () => ({
    handleCreate: jest.fn((req, res) => res.status(201).send('CREATE_OK')), 
    handleGetAll: jest.fn((req, res) => res.status(200).send('GET_ALL_OK')),
    handleGetTask: jest.fn((req, res) => res.status(200).send('GET_TASK_OK')),
    handleUpdate: jest.fn((req, res) => res.status(200).send('UPDATE_OK')),
    handleDelete: jest.fn((req, res) => res.status(200).send('DELETE_OK')),
    handleClaim: jest.fn((req, res) => res.status(200).send('CLAIM_OK')),
    handleUnclaim: jest.fn((req, res) => res.status(200).send('UNCLAIM_OK')),
    handleChangeStage: jest.fn((req, res) => res.status(200).send('STAGE_OK')),
}));
const mockTaskController = require('../../src/controllers/task-controller');


jest.mock('../../src/middleware/auth-middleware', () => {
    const mockAuthenticate = jest.fn((req: Request, res: Response, next: NextFunction) => next());

    return {
        authenticate: mockAuthenticate,
    };
});
const mockAuthenticate = require('../../src/middleware/auth-middleware').authenticate;


const app = express();
app.use(express.json()); 
app.use('/tasks', taskRouter); 

const GROUP_ID = 10;
const TASK_ID = 5;
const TASK_BASE_ROUTE = '/tasks';
const TASK_ID_ROUTE = `${TASK_BASE_ROUTE}/${TASK_ID}`;
const GROUP_ID_ROUTE = `${TASK_BASE_ROUTE}/group/${GROUP_ID}`;
const AUTH_DENIED_TEXT = 'ACCESS DENIED';


describe('Task Router', () => {
    
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
        const body = { name: 'New Task', groupId: GROUP_ID };
        
        it('should route POST / through authenticate and to handleCreate on success', async () => {
            const response = await request(app).post(TASK_BASE_ROUTE).send(body);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockTaskController.handleCreate).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(201);
            expect(response.text).toBe('CREATE_OK');
        });

        it('should block POST request if authenticate middleware fails', async () => {
            mockMiddlewareFailure();
            const response = await request(app).post(TASK_BASE_ROUTE).send(body);

            expect(response.status).toBe(401);
            expect(mockTaskController.handleCreate).not.toHaveBeenCalled();
        });
    });

    describe('GET /group/:groupId', () => {
        it('should route GET /group/:groupId through authenticate and to handleGetAll on success', async () => {
            const response = await request(app).get(GROUP_ID_ROUTE);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockTaskController.handleGetAll).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('GET_ALL_OK');
        });
    });

    describe('GET /:taskId', () => {
        it('should route GET /:taskId through authenticate and to handleGetTask on success', async () => {
            const response = await request(app).get(TASK_ID_ROUTE);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockTaskController.handleGetTask).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('GET_TASK_OK');
        });
    });

    describe('PUT /:taskId', () => {
        const updateData = { name: 'New Name' };

        it('should route PUT /:taskId through authenticate and to handleUpdate on success', async () => {
            const response = await request(app).put(TASK_ID_ROUTE).send(updateData);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockTaskController.handleUpdate).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('UPDATE_OK');
        });
    });

    describe('DELETE /:taskId', () => {
        it('should route DELETE /:taskId through authenticate and to handleDelete on success', async () => {
            const response = await request(app).delete(TASK_ID_ROUTE);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockTaskController.handleDelete).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('DELETE_OK');
        });
    });

    describe('PUT /:taskId/claim', () => {
        it('should route PUT /:taskId/claim through authenticate and to handleClaim on success', async () => {
            const route = `${TASK_ID_ROUTE}/claim`;
            const response = await request(app).put(route);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockTaskController.handleClaim).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('CLAIM_OK');
        });
    });

    describe('PUT /:taskId/unclaim', () => {
        it('should route PUT /:taskId/unclaim through authenticate and to handleUnclaim on success', async () => {
            const route = `${TASK_ID_ROUTE}/unclaim`;
            const response = await request(app).put(route);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockTaskController.handleUnclaim).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('UNCLAIM_OK');
        });
    });
    
    describe('PUT /:taskId/stage', () => {
        const body = { stage: 'DONE' };
        it('should route PUT /:taskId/stage through authenticate and to handleChangeStage on success', async () => {
            const route = `${TASK_ID_ROUTE}/stage`;
            const response = await request(app).put(route).send(body);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockTaskController.handleChangeStage).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('STAGE_OK');
        });
    });
});
