import { PrismaClient, Group, GroupMember, User } from "../generated/prisma";

const prisma = new PrismaClient();

type EnrichedGroupMember = GroupMember & { user: User };

/**
 * Create a new group
 * @param group - Group data including name and description
 * @returns Created group, or null if group name already exists
 */
export const createGroup = async (group: Group): Promise<Group | null> => {
    // Check if group name already exists
    const existingGroup = await prisma.group.findFirst({ 
        where: { name: group.name } 
    });

    if (existingGroup) {
        return null;
    }

    // Create the new group
    const createdGroup = await prisma.group.create({
        data: {
            name: group.name,
            description: group.description,
            whatsappGroupUrl: group.whatsappGroupUrl,
        },
    });

    return createdGroup;
};

/**
 * Update a group's information
 * @param group - Group object with updated fields
 * @returns Updated group, or null if group doesn't exist
 */
export const updateGroup = async (group: Group): Promise<Group | null> => {
    // Check if group exists
    const existingGroup = await prisma.group.findUnique({ 
        where: { id: group.id } 
    });

    if (!existingGroup) {
        return null;
    }

    // Update the group
    const updatedGroup = await prisma.group.update({
        where: { id: group.id },
        data: {
            name: group.name,
            description: group.description,
            whatsappGroupUrl: group.whatsappGroupUrl
        }
    });

    return updatedGroup;
};

/**
 * Delete a group by its ID
 * @param group - Group object with ID
 * @returns true if deleted successfully, false if group doesn't exist
 */
export const deleteGroup = async (group: Group): Promise<boolean> => {
    // Check if group exists
    const existingGroup = await prisma.group.findUnique({ 
        where: { id: group.id } 
    });

    if (!existingGroup) {
        return false;
    }

    // Delete the group
    await prisma.group.delete({ 
        where: { id: group.id } 
    });

    return true;
};

/**
 * Get all groups that a user is a member of
 * @param user - User object
 * @returns Array of groups
 */
export const getGroupsOfUser = async (user: User): Promise<Group[]> => {
    const groupMemberships = await prisma.groupMember.findMany({
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
    return groups;
};

/**
 * Get a specific group by its ID
 * @param groupId - The group's ID
 * @returns Group object, or null if not found
 */
export const getGroupById = async (groupId: number): Promise<Group | null> => {
    const group = await prisma.group.findUnique({
        where: { id: groupId },
    });

    return group;
};

