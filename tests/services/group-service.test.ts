import { Group, User } from "@prisma/client";

const mockPrisma = {
  group: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  groupMember: {
    findMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Group: {},
  User: {},
  GroupMember: {},
}));

import {
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupsOfUser,
  getGroupById,
} from '../../src/services/group-service';

const db = mockPrisma as any; 

const MOCK_GROUP: Group = {
  id: 1,
  name: 'Test Group',
  description: 'A group for testing.',
  whatsappGroupUrl: 'https://wa.me/group-test',
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

const MOCK_USER: User = {
    id: 99,
    username: 'testuser',
    emailAddress: 'test@example.com',
    passwordHash: 'hashedpassword',
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    phoneNumber: null,
    firstName: null,
    lastName: null,
    bio: null
} as any;

describe('Group Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create a group if the name does not exist', async () => {
      mockPrisma.group.findFirst.mockResolvedValue(null);
      mockPrisma.group.create.mockResolvedValue(MOCK_GROUP);

      const result = await createGroup(MOCK_GROUP, db);

      expect(mockPrisma.group.findFirst).toHaveBeenCalledWith({
        where: { name: MOCK_GROUP.name },
      });
      expect(mockPrisma.group.create).toHaveBeenCalledWith({
        data: {
          name: MOCK_GROUP.name,
          description: MOCK_GROUP.description,
          whatsappGroupUrl: MOCK_GROUP.whatsappGroupUrl,
        },
      });
      expect(result).toEqual(MOCK_GROUP);
    });

    it('should return null if a group with the same name already exists', async () => {
      mockPrisma.group.findFirst.mockResolvedValue(MOCK_GROUP);

      const result = await createGroup(MOCK_GROUP, db);

      expect(result).toBeNull();
      expect(mockPrisma.group.create).not.toHaveBeenCalled();
    });
  });

  describe('updateGroup', () => {
    const updatedData = { ...MOCK_GROUP, name: 'Updated Name', description: 'New description' };

    it('should successfully update an existing group', async () => {
      mockPrisma.group.findUnique.mockResolvedValue(MOCK_GROUP);
      mockPrisma.group.update.mockResolvedValue(updatedData);

      const result = await updateGroup(updatedData, db);

      expect(mockPrisma.group.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_GROUP.id },
      });
      expect(mockPrisma.group.update).toHaveBeenCalledWith({
        where: { id: MOCK_GROUP.id },
        data: {
          name: updatedData.name,
          description: updatedData.description,
          whatsappGroupUrl: updatedData.whatsappGroupUrl,
        },
      });
      expect(result).toEqual(updatedData);
    });

    it('should return null if the group does not exist', async () => {
      mockPrisma.group.findUnique.mockResolvedValue(null);

      const result = await updateGroup(updatedData, db);

      expect(result).toBeNull();
      expect(mockPrisma.group.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteGroup', () => {
    it('should successfully delete an existing group and return true', async () => {
      mockPrisma.group.findUnique.mockResolvedValue(MOCK_GROUP);
      mockPrisma.group.delete.mockResolvedValue(MOCK_GROUP);

      const result = await deleteGroup(MOCK_GROUP, db);

      expect(mockPrisma.group.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_GROUP.id },
      });
      expect(mockPrisma.group.delete).toHaveBeenCalledWith({
        where: { id: MOCK_GROUP.id },
      });
      expect(result).toBe(true);
    });

    it('should return false if the group does not exist', async () => {
      mockPrisma.group.findUnique.mockResolvedValue(null);

      const result = await deleteGroup(MOCK_GROUP, db);

      expect(result).toBe(false);
      expect(mockPrisma.group.delete).not.toHaveBeenCalled();
    });
  });

  describe('getGroupsOfUser', () => {
    const MOCK_MEMBERSHIP_1 = { 
        group: { ...MOCK_GROUP, id: 1, name: 'Group A' }, 
        userId: MOCK_USER.id, 
    } as any;
    const MOCK_MEMBERSHIP_2 = { 
        group: { ...MOCK_GROUP, id: 2, name: 'Group B' }, 
        userId: MOCK_USER.id, 
    } as any;
    
    it('should return a list of groups the user is a member of', async () => {
      mockPrisma.groupMember.findMany.mockResolvedValue([
        MOCK_MEMBERSHIP_1,
        MOCK_MEMBERSHIP_2,
      ]);

      const result = await getGroupsOfUser(MOCK_USER, db);

      expect(mockPrisma.groupMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: MOCK_USER.id },
          include: expect.anything(), 
        })
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Group A');
      expect(result[1].name).toBe('Group B');
    });

    it('should return an empty array if the user has no memberships', async () => {
      mockPrisma.groupMember.findMany.mockResolvedValue([]);

      const result = await getGroupsOfUser(MOCK_USER, db);

      expect(result).toEqual([]);
    });
  });

  describe('getGroupById', () => {
    it('should return the group if found', async () => {
      mockPrisma.group.findUnique.mockResolvedValue(MOCK_GROUP);

      const result = await getGroupById(MOCK_GROUP.id, db);

      expect(mockPrisma.group.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_GROUP.id },
      });
      expect(result).toEqual(MOCK_GROUP);
    });

    it('should return null if the group is not found', async () => {
      mockPrisma.group.findUnique.mockResolvedValue(null);

      const result = await getGroupById(MOCK_GROUP.id, db);

      expect(result).toBeNull();
    });
  });
});