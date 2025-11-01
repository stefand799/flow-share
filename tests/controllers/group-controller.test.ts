import { Request, Response, NextFunction } from "express";
import * as GroupController from "../../src/controllers/group-controller";

import * as GroupService from "../../src/services/group-service";
import * as GroupMemberService from "../../src/services/group-member-service";
import { User, Group } from "@prisma/client";
import { AuthenticatedRequest } from "../../src/middleware/auth-middleware";


jest.mock('../../src/services/group-service', () => ({
    createGroup: jest.fn(),
    getGroupsOfUser: jest.fn(),
    getGroupById: jest.fn(),
    updateGroup: jest.fn(),
    deleteGroup: jest.fn(),
}));

jest.mock('../../src/services/group-member-service', () => ({
    addMember: jest.fn(),
}));

const mockGroupService = GroupService as jest.Mocked<typeof GroupService>;
const mockGroupMemberService = GroupMemberService as jest.Mocked<typeof GroupMemberService>;


const AUTHENTICATED_USER_ID = 101;
const MOCK_USER: Omit<User, 'passwordHash'> = {
    id: AUTHENTICATED_USER_ID,
    username: 'testuser',
    emailAddress: 'test@example.com',
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;

const MOCK_GROUP_ID = 5;
const MOCK_GROUP: Group = {
    id: MOCK_GROUP_ID,
    name: 'Test Group',
    description: 'A new group.',
    whatsappGroupUrl: 'http://wa.me/test',
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;

const MOCK_NEW_GROUP_INPUT = {
    name: 'New Test Group',
    description: 'A description',
    whatsappGroupUrl: 'http://wa.me/new',
};


const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res as Response;
};

const createAuthenticatedRequest = (
    userId: number | undefined, 
    method: 'POST' | 'GET' | 'PUT' | 'DELETE',
    params: Record<string, any> = {}, 
    body: Record<string, any> = {},
): AuthenticatedRequest => ({
    user: userId ? MOCK_USER : undefined,
    params: params,
    body: body,
    cookies: {},
    signedCookies: {},
    get: jest.fn(),
    header: jest.fn(),
    accepts: jest.fn(),
}) as unknown as AuthenticatedRequest;


describe('Group Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    describe('handleCreate', () => {
        const reqBody = MOCK_NEW_GROUP_INPUT;

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest(undefined, 'POST', {}, reqBody);
            const res = mockResponse();

            await GroupController.handleCreate(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Authentication required." });
        });

        it('should return 400 if group name is missing', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'POST', {}, { description: 'd' });
            const res = mockResponse();

            await GroupController.handleCreate(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Group name is required." });
        });

        it('should return 409 if a group with the same name already exists', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'POST', {}, reqBody);
            const res = mockResponse();

            mockGroupService.createGroup.mockResolvedValue(null);

            await GroupController.handleCreate(req, res);

            expect(mockGroupService.createGroup).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: "A group with this name already exists." });
        });

        it('should return 201, create the group, and add the creator as admin', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'POST', {}, reqBody);
            const res = mockResponse();
            
            const createdGroup = { ...MOCK_GROUP, id: 99 };
            mockGroupService.createGroup.mockResolvedValue(createdGroup as Group);
            mockGroupMemberService.addMember.mockResolvedValue({} as any);

            await GroupController.handleCreate(req, res);

            expect(mockGroupService.createGroup).toHaveBeenCalledWith(
                expect.objectContaining({ name: reqBody.name })
            );

            expect(mockGroupMemberService.addMember).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: AUTHENTICATED_USER_ID,
                    groupId: createdGroup.id,
                    isAdmin: true,
                })
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Group created successfully.",
                group: createdGroup,
            });
        });

        it('should return 500 on unexpected service error', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'POST', {}, reqBody);
            const res = mockResponse();

            mockGroupService.createGroup.mockRejectedValue(new Error("DB failed"));

            await GroupController.handleCreate(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "An error occurred while creating the group." });
        });
    });

    describe('handleGetAll', () => {
        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest(undefined, 'GET');
            const res = mockResponse();

            await GroupController.handleGetAll(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Authentication required." });
        });

        it('should return 200 and all groups the user is a member of', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'GET');
            const res = mockResponse();
            const mockGroups = [MOCK_GROUP, { ...MOCK_GROUP, id: 6, name: 'Group B' }];

            mockGroupService.getGroupsOfUser.mockResolvedValue(mockGroups as Group[]);

            await GroupController.handleGetAll(req, res);

            expect(mockGroupService.getGroupsOfUser).toHaveBeenCalledWith(
                MOCK_USER as User, 
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ groups: mockGroups });
        });

        it('should return 500 on unexpected service error', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'GET');
            const res = mockResponse();

            mockGroupService.getGroupsOfUser.mockRejectedValue(new Error("DB failed"));

            await GroupController.handleGetAll(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "An error occurred while retrieving groups." });
        });
    });
    
    describe('handleGetGroup', () => {
        const reqParams = { groupId: MOCK_GROUP_ID.toString() };

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest(undefined, 'GET', reqParams);
            const res = mockResponse();

            await GroupController.handleGetGroup(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if groupId is not a number', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'GET', { groupId: 'abc' });
            const res = mockResponse();

            await GroupController.handleGetGroup(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid group ID format." });
        });

        it('should return 404 if group is not found', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'GET', reqParams);
            const res = mockResponse();

            mockGroupService.getGroupById.mockResolvedValue(null);

            await GroupController.handleGetGroup(req, res);

            expect(mockGroupService.getGroupById).toHaveBeenCalledWith(MOCK_GROUP_ID); 
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Group not found." });
        });

        it('should return 200 and the group data on success', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'GET', reqParams);
            const res = mockResponse();

            mockGroupService.getGroupById.mockResolvedValue(MOCK_GROUP as Group);

            await GroupController.handleGetGroup(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ group: MOCK_GROUP });
        });
    });

    describe('handleUpdate', () => {
        const reqParams = { groupId: MOCK_GROUP_ID.toString() };
        const reqBody = { name: 'New Name', description: 'New Desc' };

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest(undefined, 'PUT', reqParams, reqBody);
            const res = mockResponse();

            await GroupController.handleUpdate(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if groupId is invalid', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'PUT', { groupId: 'abc' }, reqBody);
            const res = mockResponse();

            await GroupController.handleUpdate(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if GroupService.updateGroup returns null (not found)', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'PUT', reqParams, reqBody);
            const res = mockResponse();

            mockGroupService.updateGroup.mockResolvedValue(null);

            await GroupController.handleUpdate(req, res);

            expect(mockGroupService.updateGroup).toHaveBeenCalledWith(
                expect.objectContaining({ id: MOCK_GROUP_ID, name: reqBody.name })
            );
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Group not found." });
        });

        it('should return 200 and the updated group on success', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'PUT', reqParams, reqBody);
            const res = mockResponse();
            const updatedGroup = { ...MOCK_GROUP, name: reqBody.name };

            mockGroupService.updateGroup.mockResolvedValue(updatedGroup as Group);

            await GroupController.handleUpdate(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Group updated successfully.",
                group: updatedGroup
            }));
        });
    });

    describe('handleDelete', () => {
        const reqParams = { groupId: MOCK_GROUP_ID.toString() };

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest(undefined, 'DELETE', reqParams);
            const res = mockResponse();

            await GroupController.handleDelete(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if groupId is invalid', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'DELETE', { groupId: 'abc' });
            const res = mockResponse();

            await GroupController.handleDelete(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if GroupService.deleteGroup returns false (not found)', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'DELETE', reqParams);
            const res = mockResponse();

            mockGroupService.deleteGroup.mockResolvedValue(false);

            await GroupController.handleDelete(req, res);

            expect(mockGroupService.deleteGroup).toHaveBeenCalledWith(
                expect.objectContaining({ id: MOCK_GROUP_ID })
            );
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Group not found." });
        });

        it('should return 200 on successful deletion', async () => {
            const req = createAuthenticatedRequest(AUTHENTICATED_USER_ID, 'DELETE', reqParams);
            const res = mockResponse();

            mockGroupService.deleteGroup.mockResolvedValue(true);

            await GroupController.handleDelete(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Group deleted successfully." });
        });
    });
});
