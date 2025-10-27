import { PrismaClient, Contribution } from "@prisma/client";

const prisma = new PrismaClient();

type Prisma = typeof prisma;

type ContributionInput = {
    value: number;
    expenseId: number;
    groupMemberId: number;
}

export const getGroupMemberIdByUserIdAndGroupId = async (
    userId: number, 
    groupId: number, 
    db: Prisma = prisma
): Promise<number | null> => {
    const groupMember = await db.groupMember.findFirst({
        where: { 
            userId: userId, 
            groupId: groupId 
        },
        select: { id: true }
    });
    return groupMember?.id || null;
}

export const createContribution = async (
    data: ContributionInput, 
    db: Prisma = prisma
): Promise<Contribution | null> => {
    try {
        const createdContribution = await db.contribution.create({
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

export const updateContribution = async (
    contributionId: number, 
    value: number, 
    db: Prisma = prisma
): Promise<Contribution | null> => {
    try {
        const updatedContribution = await db.contribution.update({
            where: { id: contributionId },
            data: { value: value },
        });
        return updatedContribution;
    } catch (error: any) {
        if (error.code === 'P2025') {
            return null; 
        }
        console.error("Prisma Error in updateContribution:", error);
        return null;
    }
};

export const deleteContribution = async (
    contributionId: number, 
    db: Prisma = prisma
): Promise<boolean> => {
    try {
        await db.contribution.delete({ where: { id: contributionId } });
        return true;
    } catch (error: any) {
        if (error.code === 'P2025') {
            return false; 
        }
        console.error("Prisma Error in deleteContribution:", error);
        return false;
    }
};

export const getAllContributionsByExpense = async (
    expenseId: number, 
    db: Prisma = prisma
): Promise<Contribution[]> => {
    const contributions = await db.contribution.findMany({
        where: { expenseId: expenseId },
        include: {
            member: {
                include: {
                    user: true 
                }
            },
        },
        orderBy: {
            createdAt: 'asc',
        }
    });
    return contributions as Contribution[];
};

export const findExistingContribution = async (
    expenseId: number, 
    groupMemberId: number, 
    db: Prisma = prisma
): Promise<Contribution | null> => {
    try {
        const contribution = await db.contribution.findFirst({
            where: {
                expenseId: expenseId,
                groupMemberId: groupMemberId,
            },
        });
        return contribution;
    } catch (error) {
        console.error("Prisma Error in findExistingContribution:", error);
        return null;
    }
};
