import { User } from "@prisma/client";
import { 
    createUser, 
    updateUser, 
    deleteUser, 
    findUserById, 
    findUserByUsername 
} from '../../src/services/user-service';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    User: {}, 
  };
});

const { PrismaClient } = require('@prisma/client');
const mockPrisma = new PrismaClient();
const db = mockPrisma as any;

const USER_ID = 1;
const USERNAME = 'testuser';
const EMAIL = 'test@example.com';

const MOCK_USER: User = {
    id: USER_ID,
    username: USERNAME,
    emailAddress: EMAIL,
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: null,
    passwordHash: 'hashedpassword',
    bio: null,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;

const USER_DATA_WITHOUT_ID: Omit<User, 'id'> = {
    username: USERNAME,
    emailAddress: EMAIL,
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: null,
    passwordHash: 'hashedpassword',
    bio: null,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('User Service', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    describe('createUser', () => {
        it('should create and return user without password hash', async () => {
            
            mockPrisma.user.findUnique
                .mockResolvedValueOnce(null)  
                .mockResolvedValueOnce(null); 
            mockPrisma.user.create.mockResolvedValue(MOCK_USER);
            
            const result = await createUser(USER_DATA_WITHOUT_ID, db);
            
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    username: USERNAME,
                    emailAddress: EMAIL,
                }),
            });
            expect(result).not.toHaveProperty('passwordHash');
            expect(result.username).toBe(USERNAME);
        });

        it('should throw error if username already exists', async () => {
            
            mockPrisma.user.findUnique.mockResolvedValueOnce(MOCK_USER);
            
            await expect(createUser(USER_DATA_WITHOUT_ID, db))
                .rejects.toThrow('Username already exists');
        });

        it('should throw error if email already exists', async () => {
            
            
            mockPrisma.user.findUnique
                .mockResolvedValueOnce(null)       
                .mockResolvedValueOnce(MOCK_USER); 
            
            await expect(createUser(USER_DATA_WITHOUT_ID, db))
                .rejects.toThrow('Email address already exists');
        });
    });

    describe('findUserById', () => {
        it('should return user without password hash when found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
            
            const result = await findUserById(USER_ID, db);
            
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: USER_ID },
            });
            expect(result).not.toHaveProperty('passwordHash');
            expect(result?.username).toBe(USERNAME);
        });

        it('should return null when user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            
            const result = await findUserById(USER_ID, db);
            
            expect(result).toBeNull();
        });
    });

    describe('findUserByUsername', () => {
        it('should return user without password hash when found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
            
            const result = await findUserByUsername(USERNAME, db);
            
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { username: USERNAME },
            });
            expect(result).not.toHaveProperty('passwordHash');
            expect(result?.username).toBe(USERNAME);
        });

        it('should return null when user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            
            const result = await findUserByUsername(USERNAME, db);
            
            expect(result).toBeNull();
        });
    });

    describe('updateUser', () => {
        it('should update and return user without password hash', async () => {
            const updatedUser = { ...MOCK_USER, firstName: 'Updated' };
            mockPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
            mockPrisma.user.update.mockResolvedValue(updatedUser);
            
            const result = await updateUser(updatedUser, db);
            
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: USER_ID },
                data: expect.objectContaining({
                    firstName: 'Updated',
                }),
            });
            expect(result).not.toHaveProperty('passwordHash');
            expect(result?.firstName).toBe('Updated');
        });

        it('should return null when user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            
            const result = await updateUser(MOCK_USER, db);
            
            expect(result).toBeNull();
        });
    });

    describe('deleteUser', () => {
        it('should delete user and return true', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
            mockPrisma.user.delete.mockResolvedValue(MOCK_USER);
            
            const result = await deleteUser(USER_ID, db);
            
            expect(mockPrisma.user.delete).toHaveBeenCalledWith({
                where: { id: USER_ID },
            });
            expect(result).toBe(true);
        });

        it('should return false when user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            
            const result = await deleteUser(USER_ID, db);
            
            expect(result).toBe(false);
        });
    });
});