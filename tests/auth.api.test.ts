import * as authUtils from '../src/utils/auth';
import jwt from 'jsonwebtoken';

// Mock JWT to control token behavior
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));
import bcrypt from 'bcrypt';
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('5 Simple Unit Tests for University Project', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // TEST 1: Password Hashing
    // =============================================
    test('1. Should hash a password successfully', async () => {
        const plainPassword = 'mySecurePassword123';
        const hashedPassword = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';

        mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

        const result = await authUtils.hashPassword(plainPassword);

        expect(result).toBe(hashedPassword);
        expect(mockedBcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
    });

    // =============================================
    // TEST 2: Password Verification - Correct Password
    // =============================================
    test('2. Should verify a correct password successfully', async () => {
        const plainPassword = 'mySecurePassword123';
        const hashedPassword = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';

        mockedBcrypt.compare.mockResolvedValue(true as never);

        const result = await authUtils.verifyPassword(plainPassword, hashedPassword);

        expect(result).toBe(true);
        expect(mockedBcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    // =============================================
    // TEST 3: Password Verification - Incorrect Password
    // =============================================
    test('3. Should reject an incorrect password', async () => {
        const plainPassword = 'wrongPassword';
        const hashedPassword = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';

        mockedBcrypt.compare.mockResolvedValue(false as never);

        const result = await authUtils.verifyPassword(plainPassword, hashedPassword);

        expect(result).toBe(false);
        expect(mockedBcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    // =============================================
    // TEST 4: JWT Token Generation
    // =============================================
    test('4. Should generate a valid JWT token', () => {
        const userId = 42;
        const mockToken = 'mock.jwt.token.string';

        mockedJwt.sign.mockReturnValue(mockToken as any);

        const token = authUtils.generateToken(userId);

        expect(token).toBe(mockToken);
        expect(mockedJwt.sign).toHaveBeenCalledWith(
            { id: userId },
            expect.any(String), // JWT_SECRET
            { expiresIn: '1d' }
        );
    });

    // =============================================
    // TEST 5: JWT Token Verification
    // =============================================
    test('5. Should verify and decode a valid JWT token', () => {
        const validToken = 'valid.jwt.token';
        const mockDecoded = { id: 42 };

        mockedJwt.verify.mockReturnValue(mockDecoded as any);

        const result = authUtils.verifyToken(validToken);

        expect(result).toEqual(mockDecoded);
        expect(mockedJwt.verify).toHaveBeenCalledWith(
            validToken,
            expect.any(String) // JWT_SECRET
        );
    });

    // =============================================
    // BONUS TEST: Invalid JWT Token Returns Null
    // =============================================
    test('BONUS: Should return null for invalid JWT token', () => {
        const invalidToken = 'invalid.jwt.token';

        mockedJwt.verify.mockImplementation(() => {
            throw new Error('Invalid token');
        });

        const result = authUtils.verifyToken(invalidToken);

        expect(result).toBeNull();
    });
});