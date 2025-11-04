import { Request, Response } from "express";
import { 
    handleLoginPage, 
    handleRegisterPage, 
    handleHomePage, 
    handleDashboardPage, 
    handleRootRedirect 
} from '../../src/controllers/nav-controller';
import { AuthenticatedRequest } from "../../src/middleware/auth-middleware"; 
import { User, Group } from "@prisma/client"; 

jest.mock('../../src/utils/auth', () => ({
    verifyToken: jest.fn(),
}));
const mockAuthUtils = require('../../src/utils/auth');

jest.mock('../../src/services/group-service', () => ({
    getGroupsOfUser: jest.fn(),
    getGroupById: jest.fn(),
}));
const mockGroupService = require('../../src/services/group-service');

jest.mock('../../src/services/group-member-service', () => ({
    getGroupMembers: jest.fn(),
}));
const mockGroupMemberService = require('../../src/services/group-member-service');

jest.mock('../../src/services/task-service', () => ({
    getAllTasks: jest.fn(),
}));
const mockTaskService = require('../../src/services/task-service');

jest.mock('../../src/services/expense-service', () => ({
    getAllExpenses: jest.fn(),
}));
const mockExpenseService = require('../../src/services/expense-service');


const MOCK_USER_ID = 1;
const MOCK_GROUP_ID = 10;
const MOCK_TOKEN = "valid.jwt.token";

const MOCK_SAFE_USER: Omit<User, 'passwordHash'> = {
    id: MOCK_USER_ID,
    username: 'testuser',
    emailAddress: 'test@example.com',
    isVerified: true, createdAt: new Date(), updatedAt: new Date(),
} as any; 

const MOCK_GROUP: Group = {
    id: MOCK_GROUP_ID,
    name: "Test Group",
    description: "A test description",
    whatsappGroupUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;

const MOCK_GROUP_MEMBER = { userId: MOCK_USER_ID, groupId: MOCK_GROUP_ID, isAdmin: true };


const mockResponse = () => {
    const res: Partial<Response> = {};
    res.render = jest.fn().mockReturnThis();
    res.redirect = jest.fn().mockReturnThis();
    res.status = jest.fn().mockReturnThis();
    res.send = jest.fn().mockReturnThis();
    return res as Response;
};

const createMockRequest = (
    options: { 
        isAuth?: boolean; 
        token?: string; 
        params?: Record<string, any>; 
        query?: Record<string, any>;
        user?: any;
    } = {}
) => ({
    cookies: { token: options.token || (options.isAuth ? MOCK_TOKEN : undefined) },
    user: options.isAuth || options.user ? MOCK_SAFE_USER : undefined,
    params: options.params || {},
    query: options.query || {},
} as unknown as Request);

const createAuthRequest = (
    options: { 
        params?: Record<string, any>; 
        user?: any;
    } = {}
) => ({
    ...createMockRequest({ isAuth: true, params: options.params }),
    user: options.user || MOCK_SAFE_USER,
} as AuthenticatedRequest);

describe('Nav Controller', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthUtils.verifyToken.mockReturnValue({ id: MOCK_USER_ID });
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        mockGroupService.getGroupsOfUser.mockResolvedValue([MOCK_GROUP]);
        mockGroupService.getGroupById.mockResolvedValue(MOCK_GROUP);
        mockGroupMemberService.getGroupMembers.mockResolvedValue([MOCK_GROUP_MEMBER]);
        mockTaskService.getAllTasks.mockResolvedValue([]);
        mockExpenseService.getAllExpenses.mockResolvedValue([]);
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    describe('handleLoginPage', () => {
        it('should redirect to /home if user has a valid token', () => {
            const req = createMockRequest({ token: MOCK_TOKEN });
            const res = mockResponse();
            
            handleLoginPage(req, res);

            expect(mockAuthUtils.verifyToken).toHaveBeenCalledWith(MOCK_TOKEN);
            expect(res.redirect).toHaveBeenCalledWith('/home');
            expect(res.render).not.toHaveBeenCalled();
        });

        it('should render login page if no token is present', () => {
            const req = createMockRequest({ token: undefined });
            const res = mockResponse();

            handleLoginPage(req, res);

            expect(res.render).toHaveBeenCalledWith("pages/login-page/login-page", expect.objectContaining({ pageTitle: "Login" }));
        });

        it('should render login page and pass query error/credentials', () => {
            const req = createMockRequest({ 
                token: undefined,
                query: { error: "Failed login", credentials: "user" }
            });
            const res = mockResponse();

            handleLoginPage(req, res);

            expect(res.render).toHaveBeenCalledWith("pages/login-page/login-page", expect.objectContaining({ 
                error: "Failed login",
                credentials: "user"
            }));
        });
    });
    
    describe('handleRegisterPage', () => {
        it('should redirect to /home if user has a valid token', () => {
            const req = createMockRequest({ token: MOCK_TOKEN });
            const res = mockResponse();
            
            handleRegisterPage(req, res);

            expect(mockAuthUtils.verifyToken).toHaveBeenCalledWith(MOCK_TOKEN);
            expect(res.redirect).toHaveBeenCalledWith('/home');
        });

        it('should render registration page and pass query error', () => {
            const req = createMockRequest({ 
                token: undefined,
                query: { error: "Failed registration" }
            });
            const res = mockResponse();

            handleRegisterPage(req, res);

            expect(res.render).toHaveBeenCalledWith("pages/register-page/register-page", expect.objectContaining({ 
                pageTitle: "Register",
                error: "Failed registration"
            }));
        });
    });

    describe('handleHomePage', () => {
        const authReq = createAuthRequest();
        
        it('should fetch groups and render home page on success', async () => {
            const res = mockResponse();

            await handleHomePage(authReq, res);

            expect(mockGroupService.getGroupsOfUser).toHaveBeenCalledWith(MOCK_SAFE_USER);
            expect(res.render).toHaveBeenCalledWith("pages/home-page/home-page", expect.objectContaining({
                user: MOCK_SAFE_USER,
                groups: [MOCK_GROUP]
            }));
        });

        it('should return 500 on internal service error', async () => {
            mockGroupService.getGroupsOfUser.mockRejectedValue(new Error("DB Connection Failed"));
            const res = mockResponse();

            await handleHomePage(authReq, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Error loading home page. Please try again.");
        });
    });
    
    describe('handleDashboardPage', () => {
        const validParams = { groupId: MOCK_GROUP_ID.toString() };
        const authReq = createAuthRequest({ params: validParams });
        
        it('should fetch all data and render dashboard page on success', async () => {
            const res = mockResponse();

            await handleDashboardPage(authReq, res);

            expect(mockGroupService.getGroupById).toHaveBeenCalledWith(MOCK_GROUP_ID);
            expect(mockGroupMemberService.getGroupMembers).toHaveBeenCalledWith(MOCK_GROUP_ID);
            expect(mockTaskService.getAllTasks).toHaveBeenCalledWith(MOCK_GROUP_ID);
            expect(mockExpenseService.getAllExpenses).toHaveBeenCalledWith(MOCK_GROUP_ID);

            expect(res.render).toHaveBeenCalledWith("pages/dashboard-page/dashboard-page", expect.objectContaining({
                pageTitle: MOCK_GROUP.name,
                group: MOCK_GROUP,
                currentMember: MOCK_GROUP_MEMBER,
                tasks: [],
                expenses: [],
            }));
        });
        
        it('should return 400 for invalid groupId format', async () => {
            const req = createAuthRequest({ params: { groupId: 'abc' } });
            const res = mockResponse();

            await handleDashboardPage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith("Invalid group ID format.");
        });

        it('should return 404 if group is not found', async () => {
            mockGroupService.getGroupById.mockResolvedValue(null);
            const res = mockResponse();

            await handleDashboardPage(authReq, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith("Group not found.");
        });

        it('should return 403 if authenticated user is NOT a member of the group', async () => {
            mockGroupMemberService.getGroupMembers.mockResolvedValue([
                { userId: 999, groupId: MOCK_GROUP_ID, isAdmin: false }
            ]);
            const res = mockResponse();

            await handleDashboardPage(authReq, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalledWith("Access denied. You are not a member of this group.");
        });
        
        it('should return 500 on internal service error', async () => {
            mockGroupService.getGroupById.mockRejectedValue(new Error("Service Failure"));
            const res = mockResponse();

            await handleDashboardPage(authReq, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Error loading group dashboard. Please try again.");
        });
    });

    describe('handleRootRedirect', () => {
        it('should redirect to /home if user has a valid token', () => {
            const req = createMockRequest({ token: MOCK_TOKEN });
            const res = mockResponse();
            
            handleRootRedirect(req, res);

            expect(mockAuthUtils.verifyToken).toHaveBeenCalledWith(MOCK_TOKEN);
            expect(res.redirect).toHaveBeenCalledWith('/home');
        });

        it('should redirect to /login if token is missing', () => {
            const req = createMockRequest({ token: undefined });
            const res = mockResponse();

            handleRootRedirect(req, res);

            expect(res.redirect).toHaveBeenCalledWith('/login');
        });
        
        it('should redirect to /login if token is present but invalid/expired', () => {
            mockAuthUtils.verifyToken.mockReturnValue(null); 
            const req = createMockRequest({ token: MOCK_TOKEN });
            const res = mockResponse();

            handleRootRedirect(req, res);

            expect(mockAuthUtils.verifyToken).toHaveBeenCalledWith(MOCK_TOKEN);
            expect(res.redirect).toHaveBeenCalledWith('/login');
        });
    });
});
