import {PrismaClient, Task, GroupMember, Stage} from "../generated/prisma";

const prisma = new PrismaClient();

const getGroupMemberId = async (userId: number, groupId: number): Promise<number | null> => {
    const groupMember = await prisma.groupMember.findFirst({
        where: { userId: userId, groupId: groupId },
        select: { id: true }
    });
    return groupMember?.id || null;
}

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
}

export const updateTask = async (task: Task): Promise<Task | null> => {
    const existingTask = await prisma.task.findFirst({where: {id: task.id}});
    if(!existingTask) return null;

    const updatedTask = await prisma.task.update({
        where: {id: task.id},
        data: {
            name: task.name,
            description: task.description,
            due: task.due,
        }
    });
    return updatedTask;
}

export const deleteTask = async (taskId: number) : Promise<boolean> => {
    const existingTask = await prisma.task.findFirst({where: {id: taskId}});
    if(!existingTask) return false;

    await prisma.task.delete({where: {id: taskId}});
    return true;
}

export const getAllTasks = async (groupId: number) : Promise<Task[]> =>{
    const tasks = await prisma.task.findMany({
        where:{
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
    return tasks;
}

export const claimTask = async (taskId: number, userId: number): Promise<Task | null> =>{
    const existingTask = await prisma.task.findFirst({where: {id: taskId}});
    if(!existingTask) return null;

    const groupMemberId = await getGroupMemberId(userId, existingTask.groupId);
    if (!groupMemberId) {
        return null;
    }

    const claimedTask = await prisma.task.update({
        where: { id: taskId },
        data: { groupMemberId: groupMemberId }
    });
    
    return claimedTask;
}

export const unclaimTask = async (taskId: number): Promise<Task | null> =>{
    const existingTask = await prisma.task.findFirst({where: {id: taskId}});
    if(!existingTask) return null;
    
    const unclaimedTask = await prisma.task.update({
        where: { id: taskId },
        data: { groupMemberId: null }
    });
    
    return unclaimedTask;
}

export const changeTaskStage = async (taskId: number, newStage: Stage): Promise<Task | null> =>{
    const existingTask = await prisma.task.findFirst({where: {id: taskId}});
    if(!existingTask) return null;

    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { stage: newStage }
    });

    return updatedTask;
}
