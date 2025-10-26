import { PrismaClient, User } from "../generated/prisma";

const prisma = new PrismaClient();

type SafeUser = Omit<User, 'passwordHash'>;

/**
 * Create a new user
 * @param userData - User data including username, email, and password hash
 * @returns Created user without password hash
 * @throws Error if username or email already exists
 */
export const createUser = async (userData: Omit<User, 'id'>): Promise<SafeUser> => {
    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
        where: { username: userData.username }
    });

    if (existingUsername) {
        throw new Error("Username already exists");
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
        where: { emailAddress: userData.emailAddress }
    });

    if (existingEmail) {
        throw new Error("Email address already exists");
    }

    // Create the new user
    const newUser = await prisma.user.create({
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

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};

/**
 * Find a user by their ID
 * @param id - The user's ID
 * @returns User object without password hash, or null if not found
 */
export const findUserById = async (id: number): Promise<SafeUser | null> => {
    const user = await prisma.user.findUnique({ 
        where: { id } 
    });
    
    if (!user) {
        return null;
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

/**
 * Update a user's information
 * @param user - User object with updated fields
 * @returns Updated user without password hash, or null if user doesn't exist
 */
export const updateUser = async (user: User): Promise<SafeUser | null> => {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ 
        where: { id: user.id } 
    });
    
    if (!existingUser) {
        return null;
    }

    // Perform the update with only allowed fields
    const updatedUser = await prisma.user.update({
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

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
};

/**
 * Delete a user by their ID
 * @param userId - The user's ID to delete
 * @returns true if deleted successfully
 * @throws Error if user doesn't exist
 */
export const deleteUser = async (userId: number): Promise<boolean> => {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ 
        where: { id: userId } 
    });
    
    if (!existingUser) {
        throw new Error("User does not exist");
    }

    // Delete the user
    await prisma.user.delete({ 
        where: { id: userId } 
    });
    
    return true;
};