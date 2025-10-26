import { PrismaClient, GroupMember, User } from "../generated/prisma";

const prisma = new PrismaClient();

type EnrichedGroupMember = GroupMember & { user: User };

/**
 * Get all members of a specific group
 * @param groupId - The group's ID
 * @returns Array of group members with user details
 */
export const getGroupMembers = async (groupId: number): Promise<EnrichedGroupMember[]> => {
    const groupMemberships = await prisma.groupMember.findMany({
        where: {
            groupId: groupId,
        },
        include: {
            user: true,
        },
    });

    return groupMemberships as EnrichedGroupMember[];
};

/**
 * Add a member to a group
 * @param member - GroupMember object with userId and groupId
 * @returns Created member, or null if user is already a member
 */
export const addMember = async (member: GroupMember): Promise<GroupMember | null> => {
    // Check if user is already a member
    const existingMember = await prisma.groupMember.findFirst({
        where: {
            userId: member.userId,
            groupId: member.groupId
        }
    });

    if (existingMember) {
        return null;
    }

    // Add the member
    const createdMember = await prisma.groupMember.create({
        data: {
            userId: member.userId,
            groupId: member.groupId,
            isAdmin: member.isAdmin || false
        }
    });

    return createdMember;
};

/**
 * Remove a member from a group
 * @param member - GroupMember object with member ID
 * @returns true if removed successfully, false if member doesn't exist
 */
export const removeMember = async (member: GroupMember): Promise<boolean> => {
    // Check if member exists
    const existingMember = await prisma.groupMember.findUnique({
        where: { id: member.id }
    });

    if (!existingMember) {
        return false;
    }

    // Remove the member
    await prisma.groupMember.delete({ 
        where: { id: member.id } 
    });

    return true;
};

/**
 * Promote a member to admin
 * @param member - GroupMember object with member ID
 * @returns Updated member, or null if member doesn't exist
 */
export const promoteAdmin = async (member: GroupMember): Promise<GroupMember | null> => {
    // Check if member exists
    const existingMember = await prisma.groupMember.findUnique({
        where: { id: member.id }
    });

    if (!existingMember) {
        return null;
    }

    // Promote to admin
    const promotedMember = await prisma.groupMember.update({
        where: { id: member.id },
        data: {
            isAdmin: true
        }
    });

    return promotedMember;
};

/**
 * Demote an admin to regular member
 * @param member - GroupMember object with member ID
 * @returns Updated member, or null if member doesn't exist
 */
export const demoteAdmin = async (member: GroupMember): Promise<GroupMember | null> => {
    // Check if member exists
    const existingMember = await prisma.groupMember.findUnique({
        where: { id: member.id }
    });

    if (!existingMember) {
        return null;
    }

    // Demote from admin
    const demotedMember = await prisma.groupMember.update({
        where: { id: member.id },
        data: {
            isAdmin: false
        }
    });

    return demotedMember;
};