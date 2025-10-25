import { Prisma, PrismaClient, User } from "../generated/prisma";
import {
    hashPassword,
    verifyPassword,
    generateToken,
} from "../utils/auth";

const prisma = new PrismaClient();

type SafeUser = Omit<User, 'passwordHash'>;

export const registerUser = async(username: string, emailAddress: string, password: string): Promise<{user: SafeUser, token: string }> => {
    const existingUser = await prisma.user.findFirst({
        where: {OR: [{username}, {emailAddress}]},
    });
    if(existingUser){
        throw new Error("Username or email already in use.");
    }
    
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
        data:{
            username,
            emailAddress,
            passwordHash,
        },
    });

    const { passwordHash: _, ...userWithoutPassword} = user;
    const token = generateToken(user.id);
    return {user: userWithoutPassword, token};
}

export const loginUser = async (credentials: string, password: string): Promise<{user: SafeUser, token: string}> => {
    const user = await prisma.user.findFirst({
        where: {OR: [{username: credentials}, {emailAddress: credentials}, {phoneNumber: credentials}]},
    });
    if(!user){
        throw new Error("Invalid credentials");
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if(!isValidPassword){
        throw new Error("Invalid password");
    }

    const {passwordHash: _, ...userWithoutPassword } = user;
    const token = generateToken(user.id);
    return {user: userWithoutPassword, token};
}