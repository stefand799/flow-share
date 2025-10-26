import { PrismaClient, Group, GroupMember, User } from "@prisma/client";

const prisma = new PrismaClient();
type Prisma = typeof prisma;

type EnrichedGroupMember = GroupMember & { user: User };

export const createGroup = async (
    group: Group,
    db: Prisma = prisma 
): Promise<Group | null> => {
    const existingGroup = await db.group.findFirst({ 
        where: { name: group.name } 
    });

    if (existingGroup) {
        return null;
    }

    const createdGroup = await db.group.create({
        data: {
            name: group.name,
            description: group.description,
            whatsappGroupUrl: group.whatsappGroupUrl,
        },
    });

    return createdGroup;
};

export const updateGroup = async (
    group: Group,
    db: Prisma = prisma 
): Promise<Group | null> => {
    const existingGroup = await db.group.findUnique({ 
        where: { id: group.id } 
    });

    if (!existingGroup) {
        return null;
    }

    const updatedGroup = await db.group.update({
        where: { id: group.id },
        data: {
            name: group.name,
            description: group.description,
            whatsappGroupUrl: group.whatsappGroupUrl
        }
    });

    return updatedGroup;
};

export const deleteGroup = async (
    group: Group,
    db: Prisma = prisma 
): Promise<boolean> => {
    const existingGroup = await db.group.findUnique({ 
        where: { id: group.id } 
    });

    if (!existingGroup) {
        return false;
    }

    await db.group.delete({ 
        where: { id: group.id } 
    });

    return true;
};

export const getGroupsOfUser = async (
    user: User,
    db: Prisma = prisma 
): Promise<Group[]> => {
    const groupMemberships = await db.groupMember.findMany({
        where: {
            userId: user.id,
        },
        include: {
            group: {                     
                include: {               
                    _count: {            
                        select: {
                            Members: true,
                            Tasks: true,
                        }
                    }
                }
            }
        }
    });

    const groups = groupMemberships.map(membership => membership.group);
    return groups as Group[]; 
};

export const getGroupById = async (
    groupId: number,
    db: Prisma = prisma 
): Promise<Group | null> => {
    const group = await db.group.findUnique({
        where: { id: groupId },
    });

    return group;
};
