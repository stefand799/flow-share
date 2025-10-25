import { Request, Response } from "express";
import * as TaskService from "../services/task-service";
import { User, Task, Stage } from "../generated/prisma";

interface AuthenticateRequest extends Request{
    user?: SafeUser;
    body: any; 
    query: any;
    params: any;
};

type SafeUser = Omit<User, 'passwordHash'>;


export const handleCreate = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const { name, description, due, groupId } = req.body;

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});
    
    if (!name || !due || !groupId) {
        return res.status(400).json({message: "Bad Request: Task name, due date, and group ID are required."});
    }

    try{
        const newTask: Task = { name, description, due: new Date(due), id: 0, groupId: groupId, createdAt: new Date(), updatedAt: new Date(), stage: Stage.TO_DO, groupMemberId: null };

        const createdTask = await TaskService.createTask(newTask, groupId);

        if (!createdTask) 
            return res.status(500).json({message: "Error creating task: Could not save to database."});

        return res.status(200).json({task: createdTask, message: "Task created successfully."});
    }catch(err: any){
        console.error("Error in handleCreate:", err);
        return res.status(500).json({message: "Error creating task"}); 
    }
};

export const handleUpdate = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const taskToUpdate: Task = req.body; 

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});
    
    if (!taskToUpdate.id || !taskToUpdate.name || !taskToUpdate.due) {
        return res.status(400).json({message: "Bad Request: Task ID, name, and due date are required for update."});
    }

    try{
        const updatedTask = await TaskService.updateTask(taskToUpdate);

        if (!updatedTask)
            return res.status(404).json({message: "Error updating task: Task not found."});

        return res.status(200).json({task: updatedTask, message: "Task updated successfully."});
    }catch(err: any){
        console.error("Error in handleUpdate:", err);
        return res.status(500).json({message: "Error updating task"}); 
    }
};

export const handleDelete = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const taskId = parseInt(req.body.taskId || req.query.taskId);

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(taskId)) {
        return res.status(400).json({message: "Bad Request: Task ID is required."});
    }

    try{
        const deleted = await TaskService.deleteTask(taskId);
        
        if(!deleted) 
            return res.status(404).json({message: "Error deleting task: Task not found."});
        
        return res.status(200).json({message: "Task deleted successfully"});
    } catch(err: any){
        console.error("Error in handleDelete:", err);
        return res.status(500).json({message: "Error deleting task."});
    }
}


export const handleGetAll = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const groupId = parseInt(req.query.groupId as string);

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(groupId)) {
        return res.status(400).json({message: "Bad Request: Group ID is required."});
    }

    try{
        const tasks = await TaskService.getAllTasks(groupId);

        return res.status(200).json({tasks: tasks});
    }catch(err: any){
        console.error("Error in handleGetAll:", err);
        return res.status(500).json({message: "Error retrieving tasks."});
    }
};


export const handleClaim = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const taskId = parseInt(req.body.taskId);

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(taskId)) {
        return res.status(400).json({message: "Bad Request: Task ID is required."});
    }

    try{
        const claimedTask = await TaskService.claimTask(taskId, authenticatedUserId);

        if (!claimedTask)
            return res.status(404).json({message: "Error claiming task: Task or user's group membership not found."});
        
        return res.status(200).json({task: claimedTask, message: "Task claimed successfully."});
    }catch(err: any){
        console.error("Error in handleClaim:", err);
        return res.status(500).json({message: "Error claiming task."});
    }
};

export const handleUnclaim = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const taskId = parseInt(req.body.taskId);

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(taskId)) {
        return res.status(400).json({message: "Bad Request: Task ID is required."});
    }

    try{
        const unclaimedTask = await TaskService.unclaimTask(taskId);

        if (!unclaimedTask)
            return res.status(404).json({message: "Error unclaiming task: Task not found."});
        
        return res.status(200).json({task: unclaimedTask, message: "Task unclaimed successfully."});
    }catch(err: any){
        console.error("Error in handleUnclaim:", err);
        return res.status(500).json({message: "Error unclaiming task."});
    }
};

export const handleChangeStage = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const { taskId, newStage } = req.body; 
    const taskIdNum = parseInt(taskId);

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(taskIdNum) || !newStage || !Object.values(Stage).includes(newStage)) {
        return res.status(400).json({message: "Bad Request: Task ID and a valid stage (TO_DO, IN_PROGRESS, DONE) are required."});
    }

    try{
        const updatedTask = await TaskService.changeTaskStage(taskIdNum, newStage as Stage);

        if (!updatedTask)
            return res.status(404).json({message: "Error changing task stage: Task not found."});
        
        return res.status(200).json({task: updatedTask, message: `Task stage updated to ${newStage}.`});
    }catch(err: any){
        console.error("Error in handleChangeStage:", err);
        return res.status(500).json({message: "Error changing task stage."});
    }
};
