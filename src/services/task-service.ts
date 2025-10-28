import { PrismaClient, Task, Stage } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * Helper function to get group member ID
 * @param userId - The user's ID
 * @param groupId - The group's ID
 * @returns Group member ID or null if not found
 */
const getGroupMemberId = async (userId: number, groupId: number): Promise<number | null> => {
    const groupMember = await prisma.groupMember.findFirst({
        where: { 
            userId: userId, 
            groupId: groupId 
        },
        select: { id: true }
    });
    
    return groupMember?.id || null;
};

/**
 * Create a new task
 * @param task - Task data including name, description, and due date
 * @param groupId - The group ID this task belongs to
 * @returns Created task
 */
export const createTask = async (task: Task, groupId: number): Promise<Task | null> => {
    const createdTask = await prisma.task.create({
        data: {
            name: task.name,
            description: task.description,
            due: task.due,
            groupId: groupId,
        }
    });

    return createdTask;
};

/**
 * Update a task's information
 * @param task - Task object with updated fields
 * @returns Updated task, or null if task doesn't exist
 */
export const updateTask = async (task: Task): Promise<Task | null> => {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({ 
        where: { id: task.id } 
    });

    if (!existingTask) {
        return null;
    }

    // Update the task
    const updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: {
            name: task.name,
            description: task.description,
            due: task.due,
        }
    });

    return updatedTask;
};

/**
 * Delete a task by its ID
 * @param taskId - The task's ID
 * @returns true if deleted successfully, false if task doesn't exist
 */
export const deleteTask = async (taskId: number): Promise<boolean> => {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({ 
        where: { id: taskId } 
    });

    if (!existingTask) {
        return false;
    }

    // Delete the task
    await prisma.task.delete({ 
        where: { id: taskId } 
    });

    return true;
};

/**
 * Get all tasks for a specific group
 * @param groupId - The group's ID
 * @returns Array of tasks with assigned member details
 */
export const getAllTasks = async (groupId: number): Promise<any[]> => {
    const tasks = await prisma.task.findMany({
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

/**
 * Get a specific task by ID
 * @param taskId - The task's ID
 * @returns Task object with assigned member details, or null if not found
 */
export const getTaskById = async (taskId: number): Promise<Task | null> => {
    const task = await prisma.task.findUnique({
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

/**
 * Claim a task (assign it to a user)
 * @param taskId - The task's ID
 * @param userId - The user's ID who is claiming the task
 * @returns Updated task, or null if task doesn't exist or user is not a group member
 */
export const claimTask = async (taskId: number, userId: number): Promise<Task | null> => {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({ 
        where: { id: taskId } 
    });

    if (!existingTask) {
        return null;
    }

    // Get the group member ID for this user in the task's group
    const groupMemberId = await getGroupMemberId(userId, existingTask.groupId);

    if (!groupMemberId) {
        return null;
    }

    // Claim the task
    const claimedTask = await prisma.task.update({
        where: { id: taskId },
        data: { groupMemberId: groupMemberId }
    });

    return claimedTask;
};

/**
 * Unclaim a task (remove assignment)
 * @param taskId - The task's ID
 * @returns Updated task, or null if task doesn't exist
 */
export const unclaimTask = async (taskId: number): Promise<Task | null> => {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({ 
        where: { id: taskId } 
    });

    if (!existingTask) {
        return null;
    }

    // Unclaim the task
    const unclaimedTask = await prisma.task.update({
        where: { id: taskId },
        data: { groupMemberId: null }
    });

    return unclaimedTask;
};

/**
 * Change the stage of a task
 * @param taskId - The task's ID
 * @param newStage - The new stage (TO_DO, IN_PROGRESS, or DONE)
 * @returns Updated task, or null if task doesn't exist
 */
export const changeTaskStage = async (taskId: number, newStage: Stage): Promise<Task | null> => {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({ 
        where: { id: taskId } 
    });

    if (!existingTask) {
        return null;
    }

    // Update the stage
    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { stage: newStage }
    });

    return updatedTask;
};