import { Request, Response, NextFunction } from "express";
import * as GroupMemberController from '../../src/controllers/group-member-controller';
import { User, GroupMember } from "@prisma/client"; 
import { AuthenticatedRequest } from "../../src/middleware/auth-middleware"; 

jest.mock('../../src/services/group-member-service', () => ({
    getGroupMembers: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    promoteAdmin: jest.fn(),
    demoteAdmin: jest.fn(),
}));
const mockMemberService = require('../../src/services/group-member-service');

jest.mock('../../src/services/user-service', () => ({
    findUserByUsername: jest.fn(),
}));
const mockUserService = require('../../src/services/user-service');


const AUTHENTICATED_USER_ID = 1;
const TARGET_USER_ID = 5;
const MOCK_GROUP_ID = 10;
const MOCK_MEMBER_ID = 20;

const MOCK_SAFE_USER: Omit<User, 'passwordHash'> = {
    id: AUTHENTICATED_USER_ID,
    username: 'authuser',
    emailAddress: 'auth@test.com',
    isVerified: true, createdAt: new Date(), updatedAt: new Date(),
} as any; 

const MOCK_TARGET_USER: Omit<User, 'passwordHash'> = {
    id: TARGET_USER_ID,
    username: 'targetuser',
    emailAddress: 'target@test.com',
    isVerified: true, createdAt: new Date(), updatedAt: new Date(),
} as any; 

const MOCK_GROUP_MEMBER: GroupMember = {
    id: MOCK_MEMBER_ID,
    userId: TARGET_USER_ID,
    groupId: MOCK_GROUP_ID,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;



const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res as Response;
};

const createAuthenticatedRequest = (
    params: Record<string, any> = {}, 
    body: Record<string, any> = {}, 
    user: any = MOCK_SAFE_USER
): AuthenticatedRequest => {
    const req: any = {
        params,
        body,
    };
    
    if (user !== null) {
        req.user = user;
    }
    
    return req as AuthenticatedRequest;
};


describe('Group Member Controller', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        mockMemberService.getGroupMembers.mockReset();
        mockMemberService.addMember.mockReset();
        mockMemberService.removeMember.mockReset();
        mockMemberService.promoteAdmin.mockReset();
        mockMemberService.demoteAdmin.mockReset();
        mockUserService.findUserByUsername.mockReset();
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    describe('handleGetMembers', () => {
        const routeId = MOCK_GROUP_ID.toString();

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest({ groupId: routeId }, {}, null);
            const res = mockResponse();

            await GroupMemberController.handleGetMembers(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Authentication required." });
            expect(mockMemberService.getGroupMembers).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid groupId format', async () => {
            const req = createAuthenticatedRequest({ groupId: 'abc' }, {});
            const res = mockResponse();

            await GroupMemberController.handleGetMembers(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid group ID format." });
        });

        it('should return 200 and members list on success', async () => {
            const req = createAuthenticatedRequest({ groupId: routeId }, {});
            const res = mockResponse();
            
            const mockMembersList = [
                { ...MOCK_GROUP_MEMBER, user: MOCK_TARGET_USER },
            ];
            mockMemberService.getGroupMembers.mockResolvedValue(mockMembersList);

            await GroupMemberController.handleGetMembers(req, res);

            expect(mockMemberService.getGroupMembers).toHaveBeenCalledWith(MOCK_GROUP_ID);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ members: mockMembersList });
        });
        
        it('should return 500 on internal service error', async () => {
            const req = createAuthenticatedRequest({ groupId: routeId }, {});
            const res = mockResponse();
            
            mockMemberService.getGroupMembers.mockRejectedValue(new Error('DB failure'));

            await GroupMemberController.handleGetMembers(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "An error occurred while retrieving group members." });
        });
    });

    describe('handleAddMember', () => {
        const body = { userId: TARGET_USER_ID.toString(), groupId: MOCK_GROUP_ID.toString() };

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest({}, body, null);
            const res = mockResponse();

            await GroupMemberController.handleAddMember(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Authentication required." });
            expect(mockMemberService.addMember).not.toHaveBeenCalled();
        });

        it('should return 400 if userId or groupId is missing', async () => {
            const req = createAuthenticatedRequest({}, { userId: TARGET_USER_ID.toString() }); 
            const res = mockResponse();

            await GroupMemberController.handleAddMember(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "User ID and Group ID are required." });
        });
        
        it('should return 409 if user is already a member', async () => {
            const req = createAuthenticatedRequest({}, body);
            const res = mockResponse();

            mockMemberService.addMember.mockResolvedValue(null);

            await GroupMemberController.handleAddMember(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: "User is already a member of this group." });
        });

        it('should return 201 and the created member on success', async () => {
            const req = createAuthenticatedRequest({}, body);
            const res = mockResponse();

            mockMemberService.addMember.mockResolvedValue(MOCK_GROUP_MEMBER);

            await GroupMemberController.handleAddMember(req, res);

            expect(mockMemberService.addMember).toHaveBeenCalledWith(
                expect.objectContaining({ userId: TARGET_USER_ID, groupId: MOCK_GROUP_ID })
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: "Member added successfully.",
                member: MOCK_GROUP_MEMBER
            }));
        });
    });

    describe('handleAddMemberByUsername', () => {
        const routeId = MOCK_GROUP_ID.toString();
        const body = { username: MOCK_TARGET_USER.username };
        const reqSuccess = createAuthenticatedRequest({ groupId: routeId }, body);
        
        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest({ groupId: routeId }, body, null);
            const res = mockResponse();
            await GroupMemberController.handleAddMemberByUsername(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Authentication required." });
            expect(mockUserService.findUserByUsername).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid groupId format', async () => {
            const req = createAuthenticatedRequest({ groupId: 'abc' }, body);
            const res = mockResponse();
            await GroupMemberController.handleAddMemberByUsername(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if username is missing', async () => {
            const req = createAuthenticatedRequest({ groupId: routeId }, { username: '' });
            const res = mockResponse();
            await GroupMemberController.handleAddMemberByUsername(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Username is required." });
        });

        it('should return 404 if user is not found by username', async () => {
            mockUserService.findUserByUsername.mockResolvedValue(null);
            const res = mockResponse();
            await GroupMemberController.handleAddMemberByUsername(reqSuccess, res);

            expect(mockUserService.findUserByUsername).toHaveBeenCalledWith(MOCK_TARGET_USER.username);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: `User with username "${MOCK_TARGET_USER.username}" not found.` });
        });
        
        it('should return 409 if user is already a member (checked by getGroupMembers)', async () => {
            mockUserService.findUserByUsername.mockResolvedValue(MOCK_TARGET_USER);
            mockMemberService.getGroupMembers.mockResolvedValue([{ userId: TARGET_USER_ID }] as any[]); 
            
            const res = mockResponse();
            await GroupMemberController.handleAddMemberByUsername(reqSuccess, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: `User "${MOCK_TARGET_USER.username}" is already a member of this group.` });
        });

        it('should return 201 and created member on success', async () => {
            mockUserService.findUserByUsername.mockResolvedValue(MOCK_TARGET_USER);
            mockMemberService.getGroupMembers.mockResolvedValue([{ userId: 999 }] as any[]); 
            mockMemberService.addMember.mockResolvedValue(MOCK_GROUP_MEMBER);
            
            const res = mockResponse();
            await GroupMemberController.handleAddMemberByUsername(reqSuccess, res);

            expect(mockMemberService.addMember).toHaveBeenCalledWith(
                expect.objectContaining({ userId: TARGET_USER_ID, groupId: MOCK_GROUP_ID })
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: `User "${MOCK_TARGET_USER.username}" added successfully to the group.`,
                member: MOCK_GROUP_MEMBER
            }));
        });
    });

    describe('handleRemoveMember', () => {
        const routeId = MOCK_MEMBER_ID.toString();

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest({ memberId: routeId }, {}, null);
            const res = mockResponse();
            await GroupMemberController.handleRemoveMember(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Authentication required." });
            expect(mockMemberService.removeMember).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid memberId format', async () => {
            const req = createAuthenticatedRequest({ memberId: 'abc' }, {});
            const res = mockResponse();
            await GroupMemberController.handleRemoveMember(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if member is not found', async () => {
            mockMemberService.removeMember.mockResolvedValue(false);
            const req = createAuthenticatedRequest({ memberId: routeId }, {});
            const res = mockResponse();

            await GroupMemberController.handleRemoveMember(req, res);

            expect(mockMemberService.removeMember).toHaveBeenCalledWith({ id: MOCK_MEMBER_ID });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Member not found." });
        });

        it('should return 200 on successful removal', async () => {
            mockMemberService.removeMember.mockResolvedValue(true);
            const req = createAuthenticatedRequest({ memberId: routeId }, {});
            const res = mockResponse();

            await GroupMemberController.handleRemoveMember(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Member removed successfully." });
        });
    });

    describe('handlePromoteAdmin', () => {
        const routeId = MOCK_MEMBER_ID.toString();

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest({ memberId: routeId }, {}, null);
            const res = mockResponse();
            await GroupMemberController.handlePromoteAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Authentication required." });
            expect(mockMemberService.promoteAdmin).not.toHaveBeenCalled();
        });
        
        it('should return 400 for invalid memberId format', async () => {
            const req = createAuthenticatedRequest({ memberId: 'abc' }, {});
            const res = mockResponse();
            await GroupMemberController.handlePromoteAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 200 and promoted member on success', async () => {
            mockMemberService.promoteAdmin.mockResolvedValue({ ...MOCK_GROUP_MEMBER, isAdmin: true });
            const req = createAuthenticatedRequest({ memberId: routeId }, {});
            const res = mockResponse();

            await GroupMemberController.handlePromoteAdmin(req, res);

            expect(mockMemberService.promoteAdmin).toHaveBeenCalledWith({ id: MOCK_MEMBER_ID });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: "Member promoted to admin successfully.",
                member: expect.objectContaining({ isAdmin: true })
            }));
        });
    });
    
    describe('handleDemoteAdmin', () => {
        const routeId = MOCK_MEMBER_ID.toString();

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest({ memberId: routeId }, {}, null);
            const res = mockResponse();
            await GroupMemberController.handleDemoteAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Authentication required." });
            expect(mockMemberService.demoteAdmin).not.toHaveBeenCalled();
        });
        
        it('should return 400 for invalid memberId format', async () => {
            const req = createAuthenticatedRequest({ memberId: 'abc' }, {});
            const res = mockResponse();
            await GroupMemberController.handleDemoteAdmin(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 200 and demoted member on success', async () => {
            mockMemberService.demoteAdmin.mockResolvedValue({ ...MOCK_GROUP_MEMBER, isAdmin: false });
            const req = createAuthenticatedRequest({ memberId: routeId }, {});
            const res = mockResponse();

            await GroupMemberController.handleDemoteAdmin(req, res);

            expect(mockMemberService.demoteAdmin).toHaveBeenCalledWith({ id: MOCK_MEMBER_ID });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: "Admin demoted successfully.",
                member: expect.objectContaining({ isAdmin: false })
            }));
        });
    });

});