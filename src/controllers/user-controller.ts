import { Request, Response } from "express";
import * as UserService from "../services/user-service";
import { User } from "@prisma/client";

type SafeUser = Omit<User, 'passwordHash'>;

interface AuthenticateRequest extends Request {
    user?: SafeUser;
}

export const handleGetUser = async (req: AuthenticateRequest, res: Response) => {
    const userIdToFetch = parseInt(req.params.userId);
    const authenticatedUserId = req.user?.id;

    if (isNaN(userIdToFetch)) {
        return res.status(400).json({ 
            message: "Invalid user ID format." 
        });
    }

    if (!authenticatedUserId || authenticatedUserId !== userIdToFetch) {
        return res.status(403).json({ 
            message: "Access denied. You can only view your own profile." 
        });
    }

    try {
        const user = await UserService.findUserById(userIdToFetch);

        if (!user) {
            return res.status(404).json({ 
                message: "User not found." 
            });
        }

        return res.status(200).json({ user });
    } catch (err: any) {
        console.error("Error in handleGetUser:", err);
        return res.status(500).json({ 
            message: "An error occurred while retrieving the user." 
        });
    }
};

export const handleUpdate = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const userIdToUpdate = parseInt(req.params.userId);

    if (isNaN(userIdToUpdate)) {
        return res.status(400).json({ 
            message: "Invalid user ID format." 
        });
    }

    if (!authenticatedUserId || authenticatedUserId !== userIdToUpdate) {
        return res.status(403).json({ 
            message: "Access denied. You can only update your own account." 
        });
    }

    try {
        const userToUpdate: User = { 
            ...req.body, 
            id: userIdToUpdate 
        } as User;

        const updatedUser = await UserService.updateUser(userToUpdate);

        if (!updatedUser) {
            return res.status(404).json({ 
                message: "User not found." 
            });
        }

        return res.status(200).json({ 
            message: "User updated successfully.",
            user: updatedUser 
        });
    } catch (err: any) {
        console.error("Error in handleUpdate:", err);
        return res.status(500).json({ 
            message: "An error occurred while updating the user." 
        });
    }
};

export const handleDelete = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const userIdToDelete = parseInt(req.params.userId);

    if (isNaN(userIdToDelete)) {
        return res.status(400).json({ 
            message: "Invalid user ID format." 
        });
    }

    if (!authenticatedUserId || authenticatedUserId !== userIdToDelete) {
        return res.status(403).json({ 
            message: "Access denied. You can only delete your own account." 
        });
    }

    try {
        const deletedUser = await UserService.deleteUser(userIdToDelete);

        if (!deletedUser) {
            return res.status(404).json({ 
                message: "User not found." 
            });
        }

        return res.status(200).json({ 
            message: "User account deleted successfully." 
        });
    } catch (err: any) {
        console.error("Error in handleDelete:", err);
        return res.status(500).json({ 
            message: "An error occurred while deleting the user." 
        });
    }
};