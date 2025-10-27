import { PrismaClient, GroupMember, User } from "@prisma/client";

const prisma = new PrismaClient();
type Prisma = typeof prisma;

type EnrichedGroupMember = GroupMember & { user: User };

export const getGroupMembers = async (
    groupId: number,
    db: Prisma = prisma 
): Promise<EnrichedGroupMember[]> => {
    const groupMemberships = await db.groupMember.findMany({
        where: {
            groupId: groupId,
        },
        include: {
            user: true,
        },
    });

    return groupMemberships as EnrichedGroupMember[];
};

export const addMember = async (
    groupMember: GroupMember,
    db: Prisma = prisma 
): Promise<GroupMember | null> => {
    const existingMember = await db.groupMember.findFirst({
        where: {
            userId: groupMember.userId,
            groupId: groupMember.groupId
        }
    });

    if (existingMember) {
        return null;
    }

    const createdMember = await db.groupMember.create({
        data: {
            userId: groupMember.userId,
            groupId: groupMember.groupId,
            isAdmin: groupMember.isAdmin || false
        }
    });

    return createdMember;
};

export const removeMember = async (
    groupMember: GroupMember,
    db: Prisma = prisma 
): Promise<boolean> => {
    const existingMember = await db.groupMember.findUnique({
        where: { id: groupMember.id }
    });

    if (!existingMember) {
        return false;
    }

    await db.groupMember.delete({ 
        where: { id: groupMember.id } 
    });

    return true;
};

export const promoteAdmin = async (
    groupMember: GroupMember,
    db: Prisma = prisma 
): Promise<GroupMember | null> => {
    const existingMember = await db.groupMember.findUnique({
        where: { id: groupMember.id }
    });

    if (!existingMember) {
        return null;
    }

    const promotedMember = await db.groupMember.update({
        where: { id: groupMember.id },
        data: {
            isAdmin: true
        }
    });

    return promotedMember;
};


export const demoteAdmin = async (
    groupMember: GroupMember,
    db: Prisma = prisma 
): Promise<GroupMember | null> => {
    const existingMember = await db.groupMember.findUnique({
        where: { id: groupMember.id }
    });

    if (!existingMember) {
        return null;
    }

    const demotedMember = await db.groupMember.update({
        where: { id: groupMember.id },
        data: {
            isAdmin: false
        }
    });

    return demotedMember;
};
