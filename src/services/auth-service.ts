import { PrismaClient, User } from "@prisma/client";
import { hashPassword, verifyPassword, generateToken } from "../utils/auth";

const prisma = new PrismaClient();

type Prisma = typeof prisma;
type SafeUser = Omit<User, 'passwordHash'>


export const registerUser = async (
    username: string, 
    emailAddress: string, 
    password: string,
    db: Prisma = prisma 
): Promise<{ user: SafeUser; token: string }> => {
    const existingUser = await db.user.findFirst({
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
    
    const passwordHash = await hashPassword(password);
    
    const user = await db.user.create({
        data: { 
            username, 
            emailAddress, 
            passwordHash 
        },
    });

    const { passwordHash: _, ...safeUser } = user;
    const token = generateToken(user.id);
    
    return { user: safeUser, token };
};

export const loginUser = async (
    credentials: string, 
    password: string,
    db: Prisma = prisma 
): Promise<{ user: SafeUser; token: string }> => {
    const user = await db.user.findFirst({
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

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
        throw new Error("Invalid username or password.");
    }

    const { passwordHash: _, ...safeUser } = user;
    const token = generateToken(user.id);
    
    return { user: safeUser, token };
};