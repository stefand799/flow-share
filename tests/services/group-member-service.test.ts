import { GroupMember, User } from "@prisma/client";
import { 
    getGroupMembers, 
    addMember, 
    removeMember, 
    promoteAdmin, 
    demoteAdmin 
} from '../../src/services/group-member-service';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    groupMember: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    GroupMember: {},
    User: {},
  };
});

const { PrismaClient } = require('@prisma/client');
const mockPrisma = new PrismaClient();
const db = mockPrisma as any;

const GROUP_ID = 1;
const USER_ID = 42;
const MEMBER_ID = 10;

const MOCK_GROUP_MEMBER: GroupMember = {
    id: MEMBER_ID,
    userId: USER_ID,
    groupId: GROUP_ID,
    isAdmin: false,
    createdAt: new Date(),
} as any;

const MOCK_USER: User = {
    id: USER_ID,
    username: 'testuser',
    emailAddress: 'test@example.com',
    phoneNumber: null,
    passwordHash: 'hash',
    firstName: null,
    lastName: null,
    bio: null,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;

describe('Group Member Service', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getGroupMembers', () => {
        it('should return all members of a group with user details', async () => {
            const enrichedMember = { ...MOCK_GROUP_MEMBER, user: MOCK_USER };
            mockPrisma.groupMember.findMany.mockResolvedValue([enrichedMember]);

            const result = await getGroupMembers(GROUP_ID, db);

            expect(mockPrisma.groupMember.findMany).toHaveBeenCalledWith({
                where: { groupId: GROUP_ID },
                include: { user: true },
            });
            expect(result).toHaveLength(1);
            expect(result[0].user).toEqual(MOCK_USER);
        });
    });

    describe('addMember', () => {
        it('should add member to group successfully', async () => {
            mockPrisma.groupMember.findFirst.mockResolvedValue(null);
            mockPrisma.groupMember.create.mockResolvedValue(MOCK_GROUP_MEMBER);

            const result = await addMember(MOCK_GROUP_MEMBER, db);

            expect(mockPrisma.groupMember.findFirst).toHaveBeenCalledWith({
                where: {
                    userId: USER_ID,
                    groupId: GROUP_ID,
                },
            });
            expect(mockPrisma.groupMember.create).toHaveBeenCalledWith({
                data: {
                    userId: USER_ID,
                    groupId: GROUP_ID,
                    isAdmin: false,
                },
            });
            expect(result).toEqual(MOCK_GROUP_MEMBER);
        });

        it('should return null if user is already a member', async () => {
            mockPrisma.groupMember.findFirst.mockResolvedValue(MOCK_GROUP_MEMBER);

            const result = await addMember(MOCK_GROUP_MEMBER, db);

            expect(result).toBeNull();
            expect(mockPrisma.groupMember.create).not.toHaveBeenCalled();
        });
    });

    describe('removeMember', () => {
        it('should remove member successfully', async () => {
            mockPrisma.groupMember.findUnique.mockResolvedValue(MOCK_GROUP_MEMBER);
            mockPrisma.groupMember.delete.mockResolvedValue(MOCK_GROUP_MEMBER);

            const result = await removeMember(MOCK_GROUP_MEMBER, db);

            expect(mockPrisma.groupMember.findUnique).toHaveBeenCalledWith({
                where: { id: MEMBER_ID },
            });
            expect(mockPrisma.groupMember.delete).toHaveBeenCalledWith({
                where: { id: MEMBER_ID },
            });
            expect(result).toBe(true);
        });

        it('should return false if member does not exist', async () => {
            mockPrisma.groupMember.findUnique.mockResolvedValue(null);

            const result = await removeMember(MOCK_GROUP_MEMBER, db);

            expect(result).toBe(false);
            expect(mockPrisma.groupMember.delete).not.toHaveBeenCalled();
        });
    });

    describe('promoteAdmin', () => {
        it('should promote member to admin', async () => {
            const adminMember = { ...MOCK_GROUP_MEMBER, isAdmin: true };
            mockPrisma.groupMember.findUnique.mockResolvedValue(MOCK_GROUP_MEMBER);
            mockPrisma.groupMember.update.mockResolvedValue(adminMember);

            const result = await promoteAdmin(MOCK_GROUP_MEMBER, db);

            expect(mockPrisma.groupMember.update).toHaveBeenCalledWith({
                where: { id: MEMBER_ID },
                data: { isAdmin: true },
            });
            expect(result).toEqual(adminMember);
        });

        it('should return null if member does not exist', async () => {
            mockPrisma.groupMember.findUnique.mockResolvedValue(null);

            const result = await promoteAdmin(MOCK_GROUP_MEMBER, db);

            expect(result).toBeNull();
            expect(mockPrisma.groupMember.update).not.toHaveBeenCalled();
        });
    });

    describe('demoteAdmin', () => {
        it('should demote admin to regular member', async () => {
            const regularMember = { ...MOCK_GROUP_MEMBER, isAdmin: false };
            const adminMember = { ...MOCK_GROUP_MEMBER, isAdmin: true };
            mockPrisma.groupMember.findUnique.mockResolvedValue(adminMember);
            mockPrisma.groupMember.update.mockResolvedValue(regularMember);

            const result = await demoteAdmin(adminMember, db);

            expect(mockPrisma.groupMember.update).toHaveBeenCalledWith({
                where: { id: MEMBER_ID },
                data: { isAdmin: false },
            });
            expect(result).toEqual(regularMember);
        });

        it('should return null if member does not exist', async () => {
            mockPrisma.groupMember.findUnique.mockResolvedValue(null);

            const result = await demoteAdmin(MOCK_GROUP_MEMBER, db);

            expect(result).toBeNull();
            expect(mockPrisma.groupMember.update).not.toHaveBeenCalled();
        });
    });
});