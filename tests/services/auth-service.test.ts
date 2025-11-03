import { registerUser, loginUser } from '../../src/services/auth-service';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    User: {}, 
  };
});

jest.mock('../../src/utils/auth', () => ({
  hashPassword: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  verifyPassword: jest.fn(),
  generateToken: jest.fn((userId) => `fake_jwt_for_${userId}`),
}));

const mockAuth: any = require('../../src/utils/auth');
const { PrismaClient } = require('@prisma/client');
const mockPrisma = new PrismaClient();

const TEST_USERNAME = 'testuser';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';
const TEST_USER_ID = 1;
const TEST_HASHED_PASSWORD = `hashed_${TEST_PASSWORD}`;

const PRISMA_USER = {
  id: TEST_USER_ID,
  username: TEST_USERNAME,
  emailAddress: TEST_EMAIL,
  passwordHash: TEST_HASHED_PASSWORD,
};

describe('Auth Service (registerUser & loginUser)', () => {
  const db = mockPrisma as any; 
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {

    it('should successfully register a new user and return user and token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(PRISMA_USER);
      
      const result = await registerUser(
        TEST_USERNAME, 
        TEST_EMAIL, 
        TEST_PASSWORD,
        db 
      );

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          username: TEST_USERNAME,
          emailAddress: TEST_EMAIL,
          passwordHash: TEST_HASHED_PASSWORD,
        },
      });

      expect(result.user.username).toEqual(TEST_USERNAME);
      expect(result.token).toBe(`fake_jwt_for_${TEST_USER_ID}`);
    });

    it('should throw an error if username is already taken', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ 
        ...PRISMA_USER, 
        emailAddress: 'other@example.com' 
      });

      await expect(
        registerUser(TEST_USERNAME, 'new@example.com', TEST_PASSWORD, db) 
      ).rejects.toThrow('Username already taken.');
    });

    it('should throw an error if email is already in use', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ 
        ...PRISMA_USER, 
        username: 'othername' 
      });

      await expect(
        registerUser('newuser', TEST_EMAIL, TEST_PASSWORD, db)
      ).rejects.toThrow('Email address already in use.');
    });
  });

  describe('loginUser', () => {
    const VALID_CREDENTIALS = TEST_USERNAME;

    it('should successfully log in a user with valid credentials', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(PRISMA_USER);
      mockAuth.verifyPassword.mockResolvedValue(true);

      const result = await loginUser(VALID_CREDENTIALS, TEST_PASSWORD, db); 

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: VALID_CREDENTIALS }, 
            { emailAddress: VALID_CREDENTIALS }, 
            { phoneNumber: VALID_CREDENTIALS }
          ]
        },
      });

      expect(mockAuth.verifyPassword).toHaveBeenCalledWith(
        TEST_PASSWORD, 
        TEST_HASHED_PASSWORD
      );
    });
    
    it('should throw "Invalid username or password" if user is not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        loginUser('nonexistent', TEST_PASSWORD, db) 
      ).rejects.toThrow('Invalid username or password.');
      
      expect(mockAuth.verifyPassword).not.toHaveBeenCalled();
    });
    
    it('should throw "Invalid username or password" if password verification fails', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(PRISMA_USER);
      mockAuth.verifyPassword.mockResolvedValue(false);

      await expect(
        loginUser(VALID_CREDENTIALS, 'wrong_password', db) 
      ).rejects.toThrow('Invalid username or password.');
      
      expect(mockAuth.generateToken).not.toHaveBeenCalled();
    });
  });
});