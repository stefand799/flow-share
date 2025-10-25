import { PrismaClient, User } from "../generated/prisma";
import { hashPassword, verifyPassword, generateToken } from "../utils/auth";

const prisma = new PrismaClient();

type SafeUser = Omit<User, 'passwordHash'>;

// Register a new user
export const registerUser = async (
    username: string, 
    emailAddress: string, 
    password: string
): Promise<{ user: SafeUser; token: string }> => {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ username }, { emailAddress }] },
    });
    
    if (existingUser) {
        throw new Error("Username or email already in use.");
    }
    
    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: { username, emailAddress, passwordHash },
    });

    // Return user without password and generate token
    const { passwordHash: _, ...safeUser } = user;
    const token = generateToken(user.id);
    
    return { user: safeUser, token };
};

// Login existing user
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
        throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
        throw new Error("Invalid password");
    }

    // Return user without password and generate token
    const { passwordHash: _, ...safeUser } = user;
    const token = generateToken(user.id);
    
    return { user: safeUser, token };
};