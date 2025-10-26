import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Configuration constants
const JWT_SECRET = process.env.JWT_SECRET || "super_secret";
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a plain text password against a bcrypt hash
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns True if password matches hash, false otherwise
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

/**
 * Generate a JWT token for a user
 * @param userId - User ID to encode in token
 * @returns JWT token string
 */
export const generateToken = (userId: number): string => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1d" });
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token string to verify
 * @returns Decoded payload with user ID, or null if invalid
 */
export const verifyToken = (token: string): { id: number } | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        return decoded;
    } catch (err) {
        // Token is invalid or expired
        return null;
    }
};