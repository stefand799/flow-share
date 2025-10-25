import { Request, Response } from "express";
import * as UserService from "../services/user-service";
import { User } from "../generated/prisma";

interface AuthenticateRequest extends Request{
    user?: SafeUser;
};

type SafeUser = Omit<User, 'passwordHash'>;

export const handleGetUser = async (req: AuthenticateRequest, res: Response) =>{
    // The user ID to fetch is typically passed in the route parameters (e.g., /users/:userId)
    const userIdToFetch = parseInt(req.query.id as string || req.params.userId); 
    const authenticatedUserId = req.user?.id;

    if (isNaN(userIdToFetch)) {
        return res.status(400).json({ message: "Bad Request: User ID is required." });
    }

    // Security Check: Users can only fetch their own profile or if they are an admin.
    // Assuming for now, they can only fetch their own if the ID matches the authenticated user's ID.
    if (!authenticatedUserId || authenticatedUserId !== userIdToFetch)
        return res.status(403).json({ message: "Forbidden: You can only view your own account." });

    try{
        const user = await UserService.findUserById(userIdToFetch);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json({ user });
    } catch(err: any){
        console.error("Error in handleGetUser:", err);
        return res.status(500).json({ message: "Error retrieving user." });
    }
};

export const handleUpdate = async(req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;

    // Assuming the user ID to update is passed in the URL, e.g., PUT /users/:userId
    const userIdToUpdate = parseInt(req.params.userId);

    // Security Check: Only allow a user to update their own account
    if(!authenticatedUserId || authenticatedUserId !== userIdToUpdate)
        return res.status(403).json({message: "Forbidden: You can only update your own account."});

    try{
        // Must ensure the ID from the URL is correctly placed in the body object for the service layer
        const userToUpdate: User = { ...req.body, id: userIdToUpdate } as User;

        const updatedUser = await UserService.updateUser(userToUpdate);
        
        if(!updatedUser)
            return res.status(404).json({message: "User not found or nothing to update."});
            
        // Corrected: Return the 'updatedUser' from the service, not the unverified 'userToUpdate' from the body
        return res.status(200).json({user: updatedUser});
    } catch (err: any){
        console.error("Error in handleUpdate:", err);
        return res.status(500).json({message: "Error updating user."});
    }
};

export const handleDelete = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;

    // Assuming the user ID to delete is passed in the URL, e.g., DELETE /users/:userId
    const userIdToDelete = parseInt(req.params.userId);

    // Security Check: Only allow a user to delete their own account
    if(!authenticatedUserId || authenticatedUserId !== userIdToDelete)
        return res.status(403).json({message: "Forbidden: You can only delete your own account."});

    try{
        // We use userIdToDelete from params as the authenticated ID may not be available if auth is fully revoked on delete.
        // However, sticking to the original's logic of using authenticatedUserId:
        // const deletedUser = await UserService.deleteUser(authenticatedUserId);
        const deletedUser = await UserService.deleteUser(userIdToDelete);
        
        if(!deletedUser) return res.status(404).json({message: "Error deleting user: User not found."});
        
        // Corrected: The original code used res.render which is for server-side rendering. 
        // Changed to a standard JSON response for API consistency.
        return res.status(200).json({message: "User deleted successfully. Please redirect to login."});
    } catch(err: any){
        console.error("Error in handleDelete:", err);
        // The service layer throws an error for "User does not exist", but we catch it as a 500 here.
        // For simplicity, we keep the 500, but a 404 might be more precise if the error message is checked.
        return res.status(500).json({message: "Error deleting user."});
    }
}