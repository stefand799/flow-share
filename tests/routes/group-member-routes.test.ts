import request from 'supertest';
import express, { Router, Request, Response, NextFunction } from 'express';

import groupMemberRouter from '../../src/routes/group-member-routes'; 


jest.mock('../../src/controllers/group-member-controller', () => ({
    handleGetMembers: jest.fn((req, res) => res.status(200).send('GET_MEMBERS_OK')),
    handleAddMember: jest.fn((req, res) => res.status(201).send('ADD_MEMBER_OK')),
    handleAddMemberByUsername: jest.fn((req, res) => res.status(201).send('ADD_BY_USERNAME_OK')),
    handleRemoveMember: jest.fn((req, res) => res.status(200).send('REMOVE_MEMBER_OK')),
    handlePromoteAdmin: jest.fn((req, res) => res.status(200).send('PROMOTE_ADMIN_OK')),
    handleDemoteAdmin: jest.fn((req, res) => res.status(200).send('DEMOTE_ADMIN_OK')),
}));
const mockController = require('../../src/controllers/group-member-controller');


jest.mock('../../src/middleware/auth-middleware', () => {
    const mockAuthenticate = jest.fn((req: Request, res: Response, next: NextFunction) => next());
    return {
        authenticate: mockAuthenticate,
    };
});

const mockAuthenticate = require('../../src/middleware/auth-middleware').authenticate;


const app = express();
app.use(express.json()); 
app.use('/members', groupMemberRouter); 

const GROUP_MEMBER_ID = 25;
const GROUP_ID = 100;

const MEMBER_ROUTE = `/members/${GROUP_MEMBER_ID}`; 
const GROUP_ROUTE = `/members/group/${GROUP_ID}`;
const AUTH_DENIED_TEXT = 'ACCESS DENIED';


describe('Group Member Router (/members)', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticate.mockImplementation((req: Request, res: Response, next: NextFunction) => next()); 
    });

    const mockMiddlewareFailure = (req: Request, res: Response, next: NextFunction) => {
        res.status(401).send(AUTH_DENIED_TEXT);
    };

    describe('GET /group/:groupId', () => {
        it('should route GET request through authenticate and to handleGetMembers on success', async () => {
            const response = await request(app).get(GROUP_ROUTE);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockController.handleGetMembers).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('GET_MEMBERS_OK');
        });

        it('should block GET request if authenticate middleware fails', async () => {
            mockAuthenticate.mockImplementationOnce(mockMiddlewareFailure);
            const response = await request(app).get(GROUP_ROUTE);

            expect(response.status).toBe(401);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockController.handleGetMembers).not.toHaveBeenCalled();
        });
    });

    describe('POST /', () => {
        const bodyData = { userId: 5, groupId: 10 };
        
        it('should route POST request through authenticate and to handleAddMember on success', async () => {
            const response = await request(app).post('/members').send(bodyData);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockController.handleAddMember).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(201);
            expect(response.text).toBe('ADD_MEMBER_OK');
        });

        it('should block POST request if authenticate middleware fails', async () => {
            mockAuthenticate.mockImplementationOnce(mockMiddlewareFailure);
            const response = await request(app).post('/members').send(bodyData);

            expect(response.status).toBe(401);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockController.handleAddMember).not.toHaveBeenCalled();
        });
    });

    describe('POST /group/:groupId/add-by-username', () => {
        const bodyData = { username: 'newuser' };
        const usernameRoute = `/members/group/${GROUP_ID}/add-by-username`;

        it('should route POST request through authenticate and to handleAddMemberByUsername on success', async () => {
            const response = await request(app).post(usernameRoute).send(bodyData);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockController.handleAddMemberByUsername).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(201);
            expect(response.text).toBe('ADD_BY_USERNAME_OK');
        });

        it('should block POST request if authenticate middleware fails', async () => {
            mockAuthenticate.mockImplementationOnce(mockMiddlewareFailure);
            const response = await request(app).post(usernameRoute).send(bodyData);

            expect(response.status).toBe(401);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockController.handleAddMemberByUsername).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /:groupMemberId', () => {
        it('should route DELETE request through authenticate and to handleRemoveMember on success', async () => {
            const response = await request(app).delete(MEMBER_ROUTE);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockController.handleRemoveMember).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('REMOVE_MEMBER_OK');
        });

        it('should block DELETE request if authenticate middleware fails', async () => {
            mockAuthenticate.mockImplementationOnce(mockMiddlewareFailure);
            const response = await request(app).delete(MEMBER_ROUTE);

            expect(response.status).toBe(401);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockController.handleRemoveMember).not.toHaveBeenCalled();
        });
    });

    describe('PUT /:groupMemberId/promote', () => {
        const promoteRoute = `${MEMBER_ROUTE}/promote`;

        it('should route PUT request through authenticate and to handlePromoteAdmin on success', async () => {
            const response = await request(app).put(promoteRoute);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockController.handlePromoteAdmin).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('PROMOTE_ADMIN_OK');
        });

        it('should block PUT request if authenticate middleware fails', async () => {
            mockAuthenticate.mockImplementationOnce(mockMiddlewareFailure);
            const response = await request(app).put(promoteRoute);

            expect(response.status).toBe(401);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockController.handlePromoteAdmin).not.toHaveBeenCalled();
        });
    });

    describe('PUT /:groupMemberId/demote', () => {
        const demoteRoute = `${MEMBER_ROUTE}/demote`;

        it('should route PUT request through authenticate and to handleDemoteAdmin on success', async () => {
            const response = await request(app).put(demoteRoute);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockController.handleDemoteAdmin).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('DEMOTE_ADMIN_OK');
        });

        it('should block PUT request if authenticate middleware fails', async () => {
            mockAuthenticate.mockImplementationOnce(mockMiddlewareFailure);
            const response = await request(app).put(demoteRoute);

            expect(response.status).toBe(401);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockController.handleDemoteAdmin).not.toHaveBeenCalled();
        });
    });
});
