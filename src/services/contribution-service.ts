import { PrismaClient, Contribution } from "../generated/prisma";

const prisma = new PrismaClient();

// Simplified type for contribution creation input
type ContributionInput = {
    value: number;
    expenseId: number;
    groupMemberId: number;
}

/**
 * Finds the GroupMember ID based on a User ID and a Group ID.
 * @param userId The ID of the authenticated user.
 * @param groupId The ID of the group where the user is a member.
 * @returns The GroupMember ID or null if the membership doesn't exist.
 */
export const getGroupMemberIdByUserIdAndGroupId = async (userId: number, groupId: number): Promise<number | null> => {
    const groupMember = await prisma.groupMember.findFirst({
        where: { userId: userId, groupId: groupId },
        select: { id: true }
    });
    return groupMember?.id || null;
}

/**
 * Creates a new contribution record.
 * @param data The data for the new contribution.
 * @returns The created Contribution object or null on failure.
 */
export const createContribution = async (data: ContributionInput): Promise<Contribution | null> => {
    try {
        const createdContribution = await prisma.contribution.create({
            data: {
                value: data.value,
                expenseId: data.expenseId,
                groupMemberId: data.groupMemberId,
            },
        });
        return createdContribution;
    } catch (error) {
        console.error("Prisma Error in createContribution:", error);
        return null;
    }
};

/**
 * Updates an existing contribution's value.
 * @param contributionId The ID of the contribution to update.
 * @param value The new contribution value.
 * @returns The updated Contribution object or null if not found.
 */
export const updateContribution = async (contributionId: number, value: number): Promise<Contribution | null> => {
    try {
        const updatedContribution = await prisma.contribution.update({
            where: { id: contributionId },
            data: { value: value },
        });
        return updatedContribution;
    } catch (error: any) {
        if (error.code === 'P2025') {
            return null; // Not found
        }
        console.error("Prisma Error in updateContribution:", error);
        return null;
    }
};

/**
 * Deletes a contribution record.
 * @param contributionId The ID of the contribution to delete.
 * @returns True if deleted, false if not found.
 */
export const deleteContribution = async (contributionId: number): Promise<boolean> => {
    try {
        await prisma.contribution.delete({ where: { id: contributionId } });
        return true;
    } catch (error: any) {
        if (error.code === 'P2025') {
            return false; // Not found
        }
        console.error("Prisma Error in deleteContribution:", error);
        return false;
    }
};

/**
 * Retrieves all contributions for a given expense.
 * It includes the user details for the contributing member.
 * @param expenseId The ID of the expense.
 * @returns An array of Contribution objects.
 */
export const getAllContributionsByExpense = async (expenseId: number): Promise<Contribution[]> => {
    const contributions = await prisma.contribution.findMany({
        where: { expenseId: expenseId },
        include: {
            member: {
                include: {
                    user: true // Include user details of the contributor
                }
            },
        },
        orderBy: {
            createdAt: 'asc',
        }
    });
    // Casting for better type handling in the controller
    return contributions as Contribution[];
};