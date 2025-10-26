import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

type Prisma = typeof prisma;
type SafeUser = Omit<User, 'passwordHash'>;

export const createUser = async (
    userData: Omit<User, 'id'>, 
    db: Prisma = prisma
): Promise<SafeUser> => {
    const existingUsername = await db.user.findUnique({
        where: { username: userData.username }
    });

    if (existingUsername) {
        throw new Error("Username already exists");
    }

    const existingEmail = await db.user.findUnique({
        where: { emailAddress: userData.emailAddress }
    });

    if (existingEmail) {
        throw new Error("Email address already exists");
    }

    const newUser = await db.user.create({
        data: {
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            emailAddress: userData.emailAddress,
            phoneNumber: userData.phoneNumber,
            passwordHash: userData.passwordHash,
            bio: userData.bio,
        }
    });

    const { passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};

export const findUserById = async (
    id: number, 
    db: Prisma = prisma
): Promise<SafeUser | null> => {
    const user = await db.user.findUnique({ 
        where: { id } 
    });
    
    if (!user) {
        return null;
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

export const findUserByUsername = async (
    username: string,
    db: Prisma = prisma
): Promise<SafeUser | null> => {
    const user = await db.user.findUnique({ 
        where: { username } 
    });
    
    if (!user) {
        return null;
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

export const updateUser = async (
    user: User, 
    db: Prisma = prisma
): Promise<SafeUser | null> => {
    const existingUser = await db.user.findUnique({ 
        where: { id: user.id } 
    });
    
    if (!existingUser) {
        return null;
    }

    const updatedUser = await db.user.update({
        where: { 
            id: user.id 
        },
        data: {
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddress,
            phoneNumber: user.phoneNumber,
            bio: user.bio,
        }
    });

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
};

export const deleteUser = async (
    userId: number, 
    db: Prisma = prisma
): Promise<boolean> => {
    const existingUser = await db.user.findUnique({ 
        where: { id: userId } 
    });
    
    if (!existingUser) {
        return false;
    }

    await db.user.delete({ 
        where: { id: userId } 
    });
    
    return true;
};
