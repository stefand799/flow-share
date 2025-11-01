import { Request, Response } from "express";
import * as AuthService from "../../src/services/auth-service";
import { handleRegister, handleLogin, handleLogout } from "../../src/controllers/auth-controller";

jest.mock('../../src/services/auth-service', () => ({
    registerUser: jest.fn(),
    loginUser: jest.fn(),
}));

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

const MOCK_TOKEN = 'test_jwt_token';
const MOCK_USER_DATA = {
    username: 'newuser',
    emailAddress: 'test@example.com',
    password: 'securepassword',
    credentials: 'testuser'
};

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnThis();
    res.render = jest.fn().mockReturnThis();
    res.redirect = jest.fn().mockReturnThis();
    res.cookie = jest.fn().mockReturnThis();
    res.clearCookie = jest.fn().mockReturnThis();
    return res as Response;
};

jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Auth Controller', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        (console.error as jest.Mock).mockRestore();
    });

    describe('handleRegister', () => {
        it('should successfully register user, set cookie, and redirect to /home', async () => {
            const req = { body: MOCK_USER_DATA } as Request;
            const res = mockResponse();

            mockAuthService.registerUser.mockResolvedValue({
                user: {} as any, 
                token: MOCK_TOKEN 
            });

            await handleRegister(req, res);

            expect(mockAuthService.registerUser).toHaveBeenCalledWith(
                MOCK_USER_DATA.username,
                MOCK_USER_DATA.emailAddress,
                MOCK_USER_DATA.password
            );

            expect(res.cookie).toHaveBeenCalledWith("token", MOCK_TOKEN, expect.any(Object));

            expect(res.redirect).toHaveBeenCalledWith("/home");
        });

        it('should return 400 and render error if fields are missing', async () => {
            const req = { body: { username: 'test' } } as Request; 
            const res = mockResponse();

            await handleRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.render).toHaveBeenCalledWith("pages/register-page/register-page", {
                error: "All fields are required.",
                pageTitle: "Register"
            });
            
            expect(mockAuthService.registerUser).not.toHaveBeenCalled();
        });

        it('should return 400 and render error if registration service throws an error', async () => {
            const req = { body: MOCK_USER_DATA } as Request;
            const res = mockResponse();
            const serviceError = new Error("Username already taken.");

            mockAuthService.registerUser.mockRejectedValue(serviceError);

            await handleRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.render).toHaveBeenCalledWith("pages/register-page/register-page", {
                error: serviceError.message,
                pageTitle: "Register"
            });
        });
    });

    describe('handleLogin', () => {
        const LOGIN_DATA = { credentials: MOCK_USER_DATA.credentials, password: MOCK_USER_DATA.password };

        it('should successfully log in user, set cookie, and redirect to /home', async () => {
            const req = { body: LOGIN_DATA } as Request;
            const res = mockResponse();

            mockAuthService.loginUser.mockResolvedValue({
                user: {} as any, 
                token: MOCK_TOKEN 
            });

            await handleLogin(req, res);

            expect(mockAuthService.loginUser).toHaveBeenCalledWith(
                LOGIN_DATA.credentials,
                LOGIN_DATA.password
            );

            expect(res.cookie).toHaveBeenCalledWith("token", MOCK_TOKEN, expect.any(Object));

            expect(res.redirect).toHaveBeenCalledWith("/home");
        });

        it('should return 400 and render error if fields are missing', async () => {
            const req = { body: { credentials: 'test' } } as Request; 
            const res = mockResponse();

            await handleLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.render).toHaveBeenCalledWith("pages/login-page/login-page", {
                error: "Username/email and password are required.",
                pageTitle: "Login",
                credentials: 'test'
            });
            
            expect(mockAuthService.loginUser).not.toHaveBeenCalled();
        });

        it('should return 401 and render error if login service throws an error', async () => {
            const req = { body: LOGIN_DATA } as Request;
            const res = mockResponse();
            const serviceError = new Error("Invalid username or password.");

            mockAuthService.loginUser.mockRejectedValue(serviceError);

            await handleLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(401);

            expect(res.render).toHaveBeenCalledWith("pages/login-page/login-page", {
                error: serviceError.message,
                pageTitle: "Login",
                credentials: LOGIN_DATA.credentials
            });
        });
    });

    describe('handleLogout', () => {
        it('should clear the token cookie and redirect to /login', () => {
            const req = {} as Request;
            const res = mockResponse();

            handleLogout(req, res);

            expect(res.clearCookie).toHaveBeenCalledWith("token");
            
            expect(res.redirect).toHaveBeenCalledWith("/login");
        });
    });
});
