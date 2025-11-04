import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express'; 
import { Router } from 'express';

import authRouter from '../../src/routes/auth-routes'; 


jest.mock('../../src/controllers/auth-controller', () => ({
    handleRegister: jest.fn((req, res) => res.status(200).send('REGISTER')),
    handleLogin: jest.fn((req, res) => res.status(200).send('LOGIN')),
    handleLogout: jest.fn((req, res) => res.status(200).send('LOGOUT')),
}));
const mockAuthController = require('../../src/controllers/auth-controller');


jest.mock('../../src/middleware/auth-middleware', () => {
    const mockAuthenticate = jest.fn((req: Request, res: Response, next: NextFunction) => next());

    return {
        authenticate: mockAuthenticate,
    };
});

const mockAuthenticate = require('../../src/middleware/auth-middleware').authenticate;


const app = express();
app.use(express.json()); 
app.use('/', authRouter);

describe('Auth Router', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticate.mockImplementation((req: Request, res: Response, next: NextFunction) => next()); 
    });

    it('should route POST /register to AuthController.handleRegister', async () => {
        const response = await request(app).post('/register').send({ test: 'data' });

        expect(response.status).toBe(200);
        expect(response.text).toBe('REGISTER');
        expect(mockAuthController.handleRegister).toHaveBeenCalledTimes(1);
        expect(mockAuthenticate).not.toHaveBeenCalled(); 
    });

    it('should route POST /login to AuthController.handleLogin', async () => {
        const response = await request(app).post('/login').send({ test: 'data' });

        expect(response.status).toBe(200);
        expect(response.text).toBe('LOGIN');
        expect(mockAuthController.handleLogin).toHaveBeenCalledTimes(1);
        expect(mockAuthenticate).not.toHaveBeenCalled(); 
    });
    
    it('should route POST /logout through authenticate middleware and then to AuthController.handleLogout', async () => {
        const response = await request(app).post('/logout');

        expect(response.status).toBe(200);
        expect(response.text).toBe('LOGOUT');
        
        expect(mockAuthenticate).toHaveBeenCalledTimes(1); 
        expect(mockAuthController.handleLogout).toHaveBeenCalledTimes(1);
    });
    
    it('should handle middleware failure on /logout by stopping the chain', async () => {
        mockAuthenticate.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
            res.status(403).send('ACCESS DENIED');
        });
        
        const response = await request(app).post('/logout');

        expect(response.status).toBe(403);
        expect(response.text).toBe('ACCESS DENIED');
        
        expect(mockAuthController.handleLogout).not.toHaveBeenCalled();
    });
});
