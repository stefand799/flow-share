import { Request, Response } from "express";
import * as TaskService from "../services/task-service";
import { User, Task, Stage } from "../generated/prisma";

interface AuthenticateRequest extends Request {
    user?: Omit<User, 'passwordHash'>;
}

/**
 * POST /api/tasks
 * Create a new task
 */
export const handleCreate = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const { name, description, due, groupId } = req.body;

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    // Validate required fields
    if (!name || !due || !groupId) {
        return res.status(400).json({ 
            message: "Task name, due date, and group ID are required." 
        });
    }

    try {
        const newTask: Task = {
            name,
            description: description || null,
            due: new Date(due),
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

/**
 * GET /api/tasks/group/:groupId
 * Get all tasks for a specific group
 */
export const handleGetAll = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const groupId = parseInt(req.params.groupId);

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

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

/**
 * GET /api/tasks/:taskId
 * Get a specific task by ID
 */
export const handleGetTask = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const taskId = parseInt(req.params.taskId);

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

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

/**
 * PUT /api/tasks/:taskId
 * Update a task
 */
export const handleUpdate = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const taskId = parseInt(req.params.taskId);

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    if (isNaN(taskId)) {
        return res.status(400).json({ 
            message: "Invalid task ID format." 
        });
    }

    try {
        const taskToUpdate: Task = {
            ...req.body,
            id: taskId,
            due: req.body.due ? new Date(req.body.due) : undefined
        } as Task;

        const updatedTask = await TaskService.updateTask(taskToUpdate);

        if (!updatedTask) {
            return res.status(404).json({ 
                message: "Task not found." 
            });
        }

        return res.status(200).json({ 
            message: "Task updated successfully.",
            task: updatedTask 
        });
    } catch (err: any) {
        console.error("Error in handleUpdate:", err);
        return res.status(500).json({ 
            message: "An error occurred while updating the task." 
        });
    }
};

/**
 * DELETE /api/tasks/:taskId
 * Delete a task
 */
export const handleDelete = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const taskId = parseInt(req.params.taskId);

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

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

/**
 * PUT /api/tasks/:taskId/claim
 * Claim a task (assign to current user)
 */
export const handleClaim = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const taskId = parseInt(req.params.taskId);

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

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

/**
 * PUT /api/tasks/:taskId/unclaim
 * Unclaim a task (remove assignment)
 */
export const handleUnclaim = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const taskId = parseInt(req.params.taskId);

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

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

/**
 * PUT /api/tasks/:taskId/stage
 * Change the stage of a task (TO_DO, IN_PROGRESS, DONE)
 */
export const handleChangeStage = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const taskId = parseInt(req.params.taskId);
    const { stage } = req.body;

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

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