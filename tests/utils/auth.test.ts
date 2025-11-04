import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  verifyToken 
} from '../../src/utils/auth';

jest.mock('bcrypt', () => ({
  hash: jest.fn((password, salt) => Promise.resolve(`hashed_${password}_${salt}`)),
  compare: jest.fn((password, hash) => Promise.resolve(password === 'correct_password')),
}));

const MOCK_VALID_DECODED_PAYLOAD = { id: 101, iat: 12345, exp: 67890 };
const MOCK_TOKEN_STRING = 'fake.jwt.token';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => MOCK_TOKEN_STRING),
  verify: jest.fn((token, secret) => {
    if (token === MOCK_TOKEN_STRING) {
      return MOCK_VALID_DECODED_PAYLOAD;
    }
    throw new Error('Invalid signature or expired token');
  }),
}));

const mockBcrypt = require('bcrypt') as jest.Mocked<typeof import('bcrypt')>;
const mockJwt = require('jsonwebtoken') as jest.Mocked<typeof import('jsonwebtoken')>;

describe('Auth Utilities (src/utils/auth.ts)', () => {
  const MOCK_SECRET = process.env.JWT_SECRET || 'super_secret';
  const SALT_ROUNDS = 10;

  describe('hashPassword', () => {
    it('should call bcrypt.hash with the correct password and salt rounds', async () => {
      const testPassword = 'myTestPassword';
      
      await hashPassword(testPassword);
      
      expect(mockBcrypt.hash).toHaveBeenCalledWith(testPassword, SALT_ROUNDS);
    });

    it('should return the mocked hashed string', async () => {
      const testPassword = 'test';
      const expectedHash = `hashed_${testPassword}_${SALT_ROUNDS}`;
      
      const result = await hashPassword(testPassword);
      
      expect(result).toBe(expectedHash);
    });
  });

  describe('verifyPassword', () => {
    const testHash = 'some_hash_from_db';

    it('should call bcrypt.compare with the password and hash', async () => {
      await verifyPassword('any_password', testHash);
      
      expect(mockBcrypt.compare).toHaveBeenCalledWith('any_password', testHash);
    });

    it('should return true for a correct password', async () => {
      const result = await verifyPassword('correct_password', testHash);
      
      expect(result).toBe(true);
    });

    it('should return false for an incorrect password', async () => {
      const result = await verifyPassword('wrong_password', testHash);
      
      expect(result).toBe(false);
    });
  });
  
  describe('generateToken', () => {
    const testUserId = 55;

    it('should call jwt.sign with the correct payload, secret, and options', () => {
      generateToken(testUserId);

      const expectedPayload = { id: testUserId };
      const expectedOptions = { expiresIn: '1d' };

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expectedPayload,
        MOCK_SECRET,
        expectedOptions
      );
    });

    it('should return the mocked token string', () => {
      const result = generateToken(testUserId);

      expect(result).toBe(MOCK_TOKEN_STRING);
    });
  });

  describe('verifyToken', () => {
    it('should call jwt.verify with the token and secret', () => {
      verifyToken(MOCK_TOKEN_STRING);
      
      expect(mockJwt.verify).toHaveBeenCalledWith(MOCK_TOKEN_STRING, MOCK_SECRET);
    });

    it('should return the decoded payload for a valid token', () => {
        const decoded = verifyToken(MOCK_TOKEN_STRING);
        
        expect(decoded).toHaveProperty('id', MOCK_VALID_DECODED_PAYLOAD.id);
        
    });

    it('should return null for an invalid or expired token', () => {
      const invalidToken = 'an.expired.or.bad.token';
      
      const result = verifyToken(invalidToken);
      
      expect(result).toBeNull();
    });
  });
});