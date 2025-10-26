import { PrismaClient, User } from "../generated/prisma";
import { hashPassword, verifyPassword, generateToken } from "../utils/auth";

const prisma = new PrismaClient();

type SafeUser = Omit<User, 'passwordHash'>;

/**
 * Register a new user
 * @param username - Unique username for the user
 * @param emailAddress - Unique email address for the user
 * @param password - Plain text password (will be hashed)
 * @returns SafeUser (without password) and JWT token
 * @throws Error if username or email already exists
 */
export const registerUser = async (
    username: string, 
    emailAddress: string, 
    password: string
): Promise<{ user: SafeUser; token: string }> => {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: { 
            OR: [
                { username: username }, 
                { emailAddress: emailAddress }
            ] 
        },
    });
    
    if (existingUser) {
        if (existingUser.username === username) {
            throw new Error("Username already taken.");
        }
        if (existingUser.emailAddress === emailAddress) {
            throw new Error("Email address already in use.");
        }
    }
    
    // Hash password and create user
    const passwordHash = await hashPassword(password);
    
    const user = await prisma.user.create({
        data: { 
            username, 
            emailAddress, 
            passwordHash 
        },
    });

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user;
    const token = generateToken(user.id);
    
    return { user: safeUser, token };
};

/**
 * Login existing user
 * @param credentials - Username, email, or phone number
 * @param password - Plain text password
 * @returns SafeUser (without password) and JWT token
 * @throws Error if credentials are invalid or password is wrong
 */
export const loginUser = async (
    credentials: string, 
    password: string
): Promise<{ user: SafeUser; token: string }> => {
    // Find user by username, email, or phone
    const user = await prisma.user.findFirst({
        where: { 
            OR: [
                { username: credentials }, 
                { emailAddress: credentials }, 
                { phoneNumber: credentials }
            ] 
        },
    });
    
    if (!user) {
        throw new Error("Invalid username or password.");
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
        throw new Error("Invalid username or password.");
    }

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user;
    const token = generateToken(user.id);
    
    return { user: safeUser, token };
};