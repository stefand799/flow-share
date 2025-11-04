import { Request, Response, NextFunction } from "express";
import { authenticate, AuthenticatedRequest } from "../../src/middleware/auth-middleware";
import { User } from "@prisma/client"; 

jest.mock('../../src/utils/auth', () => ({
    verifyToken: jest.fn(),
}));
jest.mock('../../src/services/user-service', () => ({
    findUserById: jest.fn(),
}));

const mockAuth = require('../../src/utils/auth') as jest.Mocked<any>;
const mockUserService = require('../../src/services/user-service') as jest.Mocked<any>;

const TEST_USER_ID = 123;
const MOCK_TOKEN = 'valid.jwt.token';
const MOCK_DECODED_PAYLOAD = { id: TEST_USER_ID };
const MOCK_SAFE_USER: Omit<User, 'passwordHash'> = {
    id: TEST_USER_ID,
    username: 'testuser',
    emailAddress: 'test@example.com',
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
} as any; 

const mockRequest = (token?: string) => ({
    cookies: { token },
}) as unknown as AuthenticatedRequest;

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.redirect = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res as Response;
};

const mockNext = jest.fn() as NextFunction;

describe('authenticate Middleware', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.warn as jest.Mock).mockRestore();
        (console.error as jest.Mock).mockRestore();
    });

    it('should redirect to /login if no token cookie is present', async () => {
        const req = mockRequest(undefined);
        const res = mockResponse();

        await authenticate(req, res, mockNext);

        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should clear cookie and redirect if the token is invalid or expired', async () => {
        const req = mockRequest(MOCK_TOKEN);
        const res = mockResponse();

        mockAuth.verifyToken.mockReturnValue(null);

        await authenticate(req, res, mockNext);

        expect(mockAuth.verifyToken).toHaveBeenCalledWith(MOCK_TOKEN);
        expect(res.clearCookie).toHaveBeenCalledWith('token');
        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should clear cookie and redirect if user is not found for the decoded ID', async () => {
        const req = mockRequest(MOCK_TOKEN);
        const res = mockResponse();

        mockAuth.verifyToken.mockReturnValue(MOCK_DECODED_PAYLOAD);
        
        mockUserService.findUserById.mockResolvedValue(null);

        await authenticate(req, res, mockNext);

        expect(mockUserService.findUserById).toHaveBeenCalledWith(TEST_USER_ID);
        expect(res.clearCookie).toHaveBeenCalledWith('token');
        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach user to request object and call next() for a valid token', async () => {
        const req = mockRequest(MOCK_TOKEN);
        const res = mockResponse();

        mockAuth.verifyToken.mockReturnValue(MOCK_DECODED_PAYLOAD);
        
        mockUserService.findUserById.mockResolvedValue(MOCK_SAFE_USER);

        await authenticate(req, res, mockNext);
        
        expect(req.user).toEqual(MOCK_SAFE_USER);
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(res.clearCookie).not.toHaveBeenCalled();
        expect(res.redirect).not.toHaveBeenCalled();
    });

    it('should clear cookie and redirect if an unexpected error occurs during processing', async () => {
        const req = mockRequest(MOCK_TOKEN);
        const res = mockResponse();
        const mockError = new Error("Database connection failed");

        mockAuth.verifyToken.mockReturnValue(MOCK_DECODED_PAYLOAD);
        mockUserService.findUserById.mockRejectedValue(mockError);

        await authenticate(req, res, mockNext);

        expect(res.clearCookie).toHaveBeenCalledWith('token');
        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(mockNext).not.toHaveBeenCalled();
    });

});
