import request from 'supertest';
import express, { Router, Request, Response, NextFunction } from 'express';

import navRouter from '../../src/routes/nav-routes';

jest.mock('../../src/controllers/nav-controller', () => ({
    handleLoginPage: jest.fn((req, res) => res.status(200).send('LOGIN_PAGE')),
    handleRegisterPage: jest.fn((req, res) => res.status(200).send('REGISTER_PAGE')),
    handleHomePage: jest.fn((req, res) => res.status(200).send('HOME_PAGE')),
    handleDashboardPage: jest.fn((req, res) => res.status(200).send('DASHBOARD_PAGE')),
    handleRootRedirect: jest.fn((req, res) => res.status(200).send('ROOT_REDIRECT')),
}));
const mockNavController = require('../../src/controllers/nav-controller');

jest.mock('../../src/middleware/auth-middleware', () => {
    const mockAuthenticate = jest.fn((req: Request, res: Response, next: NextFunction) => next());
    return {
        authenticate: mockAuthenticate,
    };
});

const mockAuthenticate = require('../../src/middleware/auth-middleware').authenticate;


const app = express();
app.use(express.json()); 
app.use('/', navRouter);

const GROUP_ID = 10;
const AUTH_DENIED_TEXT = 'ACCESS DENIED';


describe('Nav Router (Top-level Pages)', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticate.mockImplementation((req: Request, res: Response, next: NextFunction) => next()); 
    });

    const mockMiddlewareFailure = () => {
        mockAuthenticate.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
            res.status(401).send(AUTH_DENIED_TEXT);
        });
    };

    describe('PUBLIC Routes (GET /login, /register)', () => {
        
        it('should route GET /login directly to handleLoginPage (No middleware)', async () => {
            const response = await request(app).get('/login');

            expect(mockAuthenticate).not.toHaveBeenCalled();
            expect(mockNavController.handleLoginPage).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('LOGIN_PAGE');
        });

        it('should route GET /register directly to handleRegisterPage (No middleware)', async () => {
            const response = await request(app).get('/register');

            expect(mockAuthenticate).not.toHaveBeenCalled();
            expect(mockNavController.handleRegisterPage).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('REGISTER_PAGE');
        });
    });

    describe('PROTECTED Routes (GET /home, /dashboard/:groupId)', () => {
        
        it('should route GET /home through authenticate and to handleHomePage on success', async () => {
            const response = await request(app).get('/home');

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockNavController.handleHomePage).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('HOME_PAGE');
        });

        it('should block GET /home request if authenticate middleware fails', async () => {
            mockMiddlewareFailure();
            const response = await request(app).get('/home');

            expect(response.status).toBe(401);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockNavController.handleHomePage).not.toHaveBeenCalled();
        });

        it('should route GET /dashboard/:groupId through authenticate and to handleDashboardPage on success', async () => {
            const dashboardRoute = `/dashboard/${GROUP_ID}`;
            const response = await request(app).get(dashboardRoute);

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockNavController.handleDashboardPage).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('DASHBOARD_PAGE');
        });

        it('should block GET /dashboard request if authenticate middleware fails', async () => {
            mockMiddlewareFailure();
            const dashboardRoute = `/dashboard/${GROUP_ID}`;
            const response = await request(app).get(dashboardRoute);

            expect(response.status).toBe(401);
            expect(response.text).toBe(AUTH_DENIED_TEXT);
            expect(mockNavController.handleDashboardPage).not.toHaveBeenCalled();
        });
    });
    
    describe('Root Redirect (GET /)', () => {
        it('should route GET / directly to handleRootRedirect (No middleware)', async () => {
            const response = await request(app).get('/');

            expect(mockAuthenticate).not.toHaveBeenCalled();
            expect(mockNavController.handleRootRedirect).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.text).toBe('ROOT_REDIRECT');
        });
    });
});
