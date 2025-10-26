import { Request, Response } from "express";
import * as GroupService from "../services/group-service";
import { Group, User, GroupMember} from "@prisma/client";
import * as GroupMemberService from "../services/group-member-service";

type SafeUser = Omit<User, 'passwordHash'>;

interface AuthenticateRequest extends Request {
    user?: SafeUser;
}

export const handleCreate = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const { name, description, whatsappGroupUrl } = req.body;

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    if (!name) {
        return res.status(400).json({ 
            message: "Group name is required." 
        });
    }

    try {
        const groupToCreate: Group = {
            name,
            description: description || null,
            whatsappGroupUrl: whatsappGroupUrl || null,
        } as Group;

        const createdGroup = await GroupService.createGroup(groupToCreate);
        
        if (!createdGroup) {
            return res.status(409).json({ 
                message: "A group with this name already exists." 
            });
        }

        const creatorMember: GroupMember = {
            userId: authenticatedUserId,
            groupId: createdGroup.id,
            isAdmin: true
        } as GroupMember;

        await GroupMemberService.addMember(creatorMember);

        return res.status(201).json({ 
            message: "Group created successfully.",
            group: createdGroup 
        });
    } catch (err: any) {
        console.error("Error in handleCreate:", err);
        return res.status(500).json({ 
            message: "An error occurred while creating the group." 
        });
    }
};

export const handleGetAll = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUser = req.user;

    if (!authenticatedUser) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    try {
        const groups = await GroupService.getGroupsOfUser(authenticatedUser as User);

        return res.status(200).json({ 
            groups 
        });
    } catch (err: any) {
        console.error("Error in handleGetAll:", err);
        return res.status(500).json({ 
            message: "An error occurred while retrieving groups." 
        });
    }
};

export const handleGetGroup = async (req: AuthenticateRequest, res: Response) => {
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
        const group = await GroupService.getGroupById(groupId);

        if (!group) {
            return res.status(404).json({ 
                message: "Group not found." 
            });
        }

        return res.status(200).json({ 
            group 
        });
    } catch (err: any) {
        console.error("Error in handleGetGroup:", err);
        return res.status(500).json({ 
            message: "An error occurred while retrieving the group." 
        });
    }
};

export const handleUpdate = async (req: AuthenticateRequest, res: Response) => {
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
        const groupToUpdate: Group = {
            ...req.body,
            id: groupId
        } as Group;

        const updatedGroup = await GroupService.updateGroup(groupToUpdate);

        if (!updatedGroup) {
            return res.status(404).json({ 
                message: "Group not found." 
            });
        }

        return res.status(200).json({ 
            message: "Group updated successfully.",
            group: updatedGroup 
        });
    } catch (err: any) {
        console.error("Error in handleUpdate:", err);
        return res.status(500).json({ 
            message: "An error occurred while updating the group." 
        });
    }
};

export const handleDelete = async (req: AuthenticateRequest, res: Response) => {
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
        const groupToDelete = { id: groupId } as Group;
        const deleted = await GroupService.deleteGroup(groupToDelete);

        if (!deleted) {
            return res.status(404).json({ 
                message: "Group not found." 
            });
        }

        return res.status(200).json({ 
            message: "Group deleted successfully." 
        });
    } catch (err: any) {
        console.error("Error in handleDelete:", err);
        return res.status(500).json({ 
            message: "An error occurred while deleting the group." 
        });
    }
};