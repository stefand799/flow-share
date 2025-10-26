import { PrismaClient, Task, Stage } from "@prisma/client";

const prisma = new PrismaClient();

type Prisma = typeof prisma;

const getGroupMemberId = async (
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
};

export const createTask = async (task: Task, groupId: number, db: Prisma = prisma): Promise<Task | null> => {
    
    const createdTask = await db.task.create({
        data: {
            name: task.name,
            description: task.description,
            due: task.due,
            groupId: groupId,
        }
    });

    return createdTask;
};

export const updateTask = async (task: Task, db: Prisma = prisma): Promise<Task | null> => {
    const existingTask = await db.task.findUnique({ 
        where: { id: task.id } 
    });

    if (!existingTask) {
        return null;
    }

    const updatedTask = await db.task.update({
        where: { id: task.id },
        data: {
            name: task.name,
            description: task.description,
            due: task.due,
        }
    });

    return updatedTask;
};

export const deleteTask = async (taskId: number, db: Prisma = prisma): Promise<boolean> => {
    const existingTask = await db.task.findUnique({ 
        where: { id: taskId } 
    });

    if (!existingTask) {
        return false;
    }

    await db.task.delete({ 
        where: { id: taskId } 
    });

    return true;
};

export const getAllTasks = async (groupId: number, db: Prisma = prisma): Promise<any[]> => {
    const tasks = await db.task.findMany({
        where: {
            groupId: groupId
        },
        include: {
            assignedTo: {
                include: {
                    user: true
                }
            }
        }
    });

    return tasks as any[];
};

export const getTaskById = async (taskId: number, db: Prisma = prisma): Promise<Task | null> => {
    const task = await db.task.findUnique({
        where: { id: taskId },
        include: {
            assignedTo: {
                include: {
                    user: true
                }
            }
        }
    });

    return task;
};

export const claimTask = async (taskId: number, userId: number, db: Prisma = prisma): Promise<Task | null> => {
    const existingTask = await db.task.findUnique({ 
        where: { id: taskId } 
    });

    if (!existingTask) {
        return null;
    }

    const groupMemberId = await getGroupMemberId(userId, existingTask.groupId, db); 

    if (!groupMemberId) {
        return null;
    }

    const claimedTask = await db.task.update({
        where: { id: taskId },
        data: { groupMemberId: groupMemberId }
    });

    return claimedTask;
};

export const unclaimTask = async (taskId: number, db: Prisma = prisma): Promise<Task | null> => {
    const existingTask = await db.task.findUnique({ 
        where: { id: taskId } 
    });

    if (!existingTask) {
        return null;
    }

    const unclaimedTask = await db.task.update({
        where: { id: taskId },
        data: { groupMemberId: null }
    });

    return unclaimedTask;
};

export const changeTaskStage = async (taskId: number, newStage: Stage, db: Prisma = prisma): Promise<Task | null> => {
    const existingTask = await db.task.findUnique({ 
        where: { id: taskId } 
    });

    if (!existingTask) {
        return null;
    }

    const updatedTask = await db.task.update({
        where: { id: taskId },
        data: { stage: newStage }
    });

    return updatedTask;
};
