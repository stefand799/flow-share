import { Request, Response } from "express";
import * as TaskService from "../services/task-service";
import { User, Task, Stage } from "@prisma/client";

type SafeUser = Omit<User, 'passwordHash'>;

interface AuthenticateRequest extends Request {
    user?: SafeUser;
}

export const handleCreate = async (req: AuthenticateRequest, res: Response) => {
    const { name, description, due, groupId } = req.body;

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (!name || !groupId) {
        return res.status(400).json({ 
            message: "Task name and group ID are required." 
        });
    }

    try {
        const newTask: Task = {
            name,
            description: description || null,
            due: due ? new Date(due) : null,
            groupId: parseInt(groupId),
            stage: Stage.TO_DO,
            groupMemberId: null,
        } as Task;

        const createdTask = await TaskService.createTask(newTask, parseInt(groupId));

        if (!createdTask) {
            return res.status(500).json({ 
                message: "Could not create task." 
            });
        }

        return res.status(201).json({ 
            message: "Task created successfully.",
            task: createdTask 
        });
    } catch (err: any) {
        console.error("Error in handleCreate:", err);
        return res.status(500).json({ 
            message: "An error occurred while creating the task." 
        });
    }
};

export const handleGetAll = async (req: AuthenticateRequest, res: Response) => {
    const groupId = parseInt(req.params.groupId);

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (isNaN(groupId)) {
        return res.status(400).json({ 
            message: "Invalid group ID format." 
        });
    }

    try {
        const tasks = await TaskService.getAllTasks(groupId);

        return res.status(200).json({ 
            tasks 
        });
    } catch (err: any) {
        console.error("Error in handleGetAll:", err);
        return res.status(500).json({ 
            message: "An error occurred while retrieving tasks." 
        });
    }
};

export const handleGetTask = async (req: AuthenticateRequest, res: Response) => {
    const taskId = parseInt(req.params.taskId);

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (isNaN(taskId)) {
        return res.status(400).json({ 
            message: "Invalid task ID format." 
        });
    }

    try {
        const task = await TaskService.getTaskById(taskId);

        if (!task) {
            return res.status(404).json({ 
                message: "Task not found." 
            });
        }

        return res.status(200).json({ 
            task 
        });
    } catch (err: any) {
        console.error("Error in handleGetTask:", err);
        return res.status(500).json({ 
            message: "An error occurred while retrieving the task." 
        });
    }
};

export const handleUpdate = async (req: AuthenticateRequest, res: Response) => {
    const taskId = parseInt(req.params.taskId);
    const { name, description, due } = req.body;

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (isNaN(taskId)) {
        return res.status(400).json({ 
            message: "Invalid task ID format." 
        });
    }

    if (!name) {
        return res.status(400).json({ 
            message: "Task name is required." 
        });
    }

    try {
        const updatedTask: Task = {
            id: taskId,
            name,
            description: description || null,
            due: due ? new Date(due) : null,
        } as Task;

        const result = await TaskService.updateTask(updatedTask);

        if (!result) {
            return res.status(404).json({ 
                message: "Task not found." 
            });
        }

        return res.status(200).json({ 
            message: "Task updated successfully.",
            task: result 
        });
    } catch (err: any) {
        console.error("Error in handleUpdate:", err);
        return res.status(500).json({ 
            message: "An error occurred while updating the task." 
        });
    }
};

export const handleDelete = async (req: AuthenticateRequest, res: Response) => {
    const taskId = parseInt(req.params.taskId);

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (isNaN(taskId)) {
        return res.status(400).json({ 
            message: "Invalid task ID format." 
        });
    }

    try {
        const deleted = await TaskService.deleteTask(taskId);

        if (!deleted) {
            return res.status(404).json({ 
                message: "Task not found." 
            });
        }

        return res.status(200).json({ 
            message: "Task deleted successfully." 
        });
    } catch (err: any) {
        console.error("Error in handleDelete:", err);
        return res.status(500).json({ 
            message: "An error occurred while deleting the task." 
        });
    }
};

export const handleClaim = async (req: AuthenticateRequest, res: Response) => {
    const taskId = parseInt(req.params.taskId);

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (isNaN(taskId)) {
        return res.status(400).json({ 
            message: "Invalid task ID format." 
        });
    }

    try {
        const claimedTask = await TaskService.claimTask(taskId, authenticatedUserId);

        if (!claimedTask) {
            return res.status(404).json({ 
                message: "Task not found or you are not a member of this group." 
            });
        }

        return res.status(200).json({ 
            message: "Task claimed successfully.",
            task: claimedTask 
        });
    } catch (err: any) {
        console.error("Error in handleClaim:", err);
        return res.status(500).json({ 
            message: "An error occurred while claiming the task." 
        });
    }
};

export const handleUnclaim = async (req: AuthenticateRequest, res: Response) => {
    const taskId = parseInt(req.params.taskId);

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (isNaN(taskId)) {
        return res.status(400).json({ 
            message: "Invalid task ID format." 
        });
    }

    try {
        const unclaimedTask = await TaskService.unclaimTask(taskId);

        if (!unclaimedTask) {
            return res.status(404).json({ 
                message: "Task not found." 
            });
        }

        return res.status(200).json({ 
            message: "Task unclaimed successfully.",
            task: unclaimedTask 
        });
    } catch (err: any) {
        console.error("Error in handleUnclaim:", err);
        return res.status(500).json({ 
            message: "An error occurred while unclaiming the task." 
        });
    }
};

export const handleChangeStage = async (req: AuthenticateRequest, res: Response) => {
    const taskId = parseInt(req.params.taskId);
    const { stage } = req.body;

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (isNaN(taskId)) {
        return res.status(400).json({ 
            message: "Invalid task ID format." 
        });
    }

    if (!stage || !Object.values(Stage).includes(stage)) {
        return res.status(400).json({ 
            message: "Valid stage is required (TO_DO, IN_PROGRESS, or DONE)." 
        });
    }

    try {
        const updatedTask = await TaskService.changeTaskStage(taskId, stage as Stage);

        if (!updatedTask) {
            return res.status(404).json({ 
                message: "Task not found." 
            });
        }

        return res.status(200).json({ 
            message: `Task stage updated to ${stage}.`,
            task: updatedTask 
        });
    } catch (err: any) {
        console.error("Error in handleChangeStage:", err);
        return res.status(500).json({ 
            message: "An error occurred while changing the task stage." 
        });
    }
};