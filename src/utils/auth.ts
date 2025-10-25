import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret";
const SALT_ROUNDS = 10;

// Hash password with bcrypt
export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

// Verify password against hash
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

// Generate JWT token for user
export const generateToken = (userId: number): string => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1d" });
};

// Verify JWT token and return decoded payload
export const verifyToken = (token: string): { id: number } | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as { id: number };
    } catch (err) {
        return null;
    }
};