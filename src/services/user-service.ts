import {PrismaClient, User} from "../generated/prisma";

const prisma = new PrismaClient();

type SafeUser = Omit<User, 'passwordHash'>;

export const findUserById = async (id: number): Promise<SafeUser | null> => {
    const user = await prisma.user.findUnique({where: {id}});
    if(!user) return null;
    
    const {passwordHash, ...userWithoutPassword} = user;
    return userWithoutPassword;
}

export const updateUser = async (user: User): Promise<SafeUser | null> =>{
    const existingUser = await prisma.user.findFirst({where: {id: user.id}});
    if(!existingUser) return null;

    // Perform the update
    const updatedUser = await prisma.user.update({
        where:{ 
            id: user.id,
        },
        data: {
            username : user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddress,
            phoneNumber: user.phoneNumber,
            bio: user.bio,
        }
    });
    
    // FIX: Return the actual 'updatedUser' result from Prisma, ensuring the response 
    // reflects the current database state, and strip the password hash.
    const {passwordHash:_, ...userWithoutPassword} = updatedUser;
    return userWithoutPassword;
};

export const deleteUser = async (userId: number): Promise<boolean> => {
    const existingUser = await prisma.user.findFirst({where: {id:userId}});
    if(!existingUser)
        // CORRECTION: Fixed spelling error
        throw new Error("User does not exist");
        
    await prisma.user.delete({where: {id: userId}});
    return true;
}