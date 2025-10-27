import { Request, Response } from "express";
import * as GroupMemberService from "../services/group-member-service";
import * as UserService from "../services/user-service";
import { GroupMember, User } from "@prisma/client";

type SafeUser = Omit<User, 'passwordHash'>;

interface AuthenticateRequest extends Request {
    user?: SafeUser;
}

/**
 * GET /api/members/group/:groupId
 * Get all members of a specific group
 */
export const handleGetMembers = async (req: AuthenticateRequest, res: Response) => {
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
        const members = await GroupMemberService.getGroupMembers(groupId);

        return res.status(200).json({ 
            members: members || [] 
        });
    } catch (err: any) {
        console.error("Error in handleGetMembers:", err);
        return res.status(500).json({ 
            message: "An error occurred while retrieving group members." 
        });
    }
};

/**
 * POST /api/members
 * Add a member to a group (by userId)
 */
export const handleAddMember = async (req: AuthenticateRequest, res: Response) => {
    const { userId, groupId } = req.body;

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (!userId || !groupId) {
        return res.status(400).json({ 
            message: "User ID and Group ID are required." 
        });
    }

    try {
        const memberToAdd: GroupMember = {
            userId: parseInt(userId),
            groupId: parseInt(groupId),
            isAdmin: false
        } as GroupMember;

        const createdMember = await GroupMemberService.addMember(memberToAdd);

        if (!createdMember) {
            return res.status(409).json({ 
                message: "User is already a member of this group." 
            });
        }

        return res.status(201).json({ 
            message: "Member added successfully.",
            member: createdMember 
        });
    } catch (err: any) {
        console.error("Error in handleAddMember:", err);
        return res.status(500).json({ 
            message: "An error occurred while adding the member." 
        });
    }
};

/**
 * POST /api/members/group/:groupId/add-by-username
 * Add a member to a group by searching for their username
 */
export const handleAddMemberByUsername = async (req: AuthenticateRequest, res: Response) => {
    const groupId = parseInt(req.params.groupId);
    const { username } = req.body;

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

    if (!username || typeof username !== 'string' || username.trim() === '') {
        return res.status(400).json({ 
            message: "Username is required." 
        });
    }

    try {
        // Search for user by username
        const userToAdd = await UserService.findUserByUsername(username.trim());

        if (!userToAdd) {
            return res.status(404).json({ 
                message: `User with username "${username}" not found.` 
            });
        }

        // Check if user is already a member of the group
        const existingMembers = await GroupMemberService.getGroupMembers(groupId);
        const isAlreadyMember = existingMembers.some(member => member.userId === userToAdd.id);

        if (isAlreadyMember) {
            return res.status(409).json({ 
                message: `User "${username}" is already a member of this group.` 
            });
        }

        // Add the member to the group
        const memberToAdd: GroupMember = {
            userId: userToAdd.id,
            groupId: groupId,
            isAdmin: false
        } as GroupMember;

        const createdMember = await GroupMemberService.addMember(memberToAdd);

        if (!createdMember) {
            return res.status(500).json({ 
                message: "Failed to add member to group." 
            });
        }

        return res.status(201).json({ 
            message: `User "${username}" added successfully to the group.`,
            member: createdMember 
        });
    } catch (err: any) {
        console.error("Error in handleAddMemberByUsername:", err);
        return res.status(500).json({ 
            message: "An error occurred while adding the member." 
        });
    }
};

/**
 * DELETE /api/members/:memberId
 * Remove a member from a group
 */
export const handleRemoveMember = async (req: AuthenticateRequest, res: Response) => {
    const memberId = parseInt(req.params.memberId);

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (isNaN(memberId)) {
        return res.status(400).json({ 
            message: "Invalid member ID format." 
        });
    }

    try {
        const memberToRemove = { id: memberId } as GroupMember;
        const removed = await GroupMemberService.removeMember(memberToRemove);

        if (!removed) {
            return res.status(404).json({ 
                message: "Member not found." 
            });
        }

        return res.status(200).json({ 
            message: "Member removed successfully." 
        });
    } catch (err: any) {
        console.error("Error in handleRemoveMember:", err);
        return res.status(500).json({ 
            message: "An error occurred while removing the member." 
        });
    }
};

/**
 * PUT /api/members/:memberId/promote
 * Promote a member to admin
 */
export const handlePromoteAdmin = async (req: AuthenticateRequest, res: Response) => {
    const memberId = parseInt(req.params.memberId);

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (isNaN(memberId)) {
        return res.status(400).json({ 
            message: "Invalid member ID format." 
        });
    }

    try {
        const memberToPromote = { id: memberId } as GroupMember;
        const promotedMember = await GroupMemberService.promoteAdmin(memberToPromote);

        if (!promotedMember) {
            return res.status(404).json({ 
                message: "Member not found." 
            });
        }

        return res.status(200).json({ 
            message: "Member promoted to admin successfully.",
            member: promotedMember 
        });
    } catch (err: any) {
        console.error("Error in handlePromoteAdmin:", err);
        return res.status(500).json({ 
            message: "An error occurred while promoting the member." 
        });
    }
};

/**
 * PUT /api/members/:memberId/demote
 * Demote an admin to regular member
 */
export const handleDemoteAdmin = async (req: AuthenticateRequest, res: Response) => {
    const memberId = parseInt(req.params.memberId);

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (isNaN(memberId)) {
        return res.status(400).json({ 
            message: "Invalid member ID format." 
        });
    }

    try {
        const memberToDemote = { id: memberId } as GroupMember;
        const demotedMember = await GroupMemberService.demoteAdmin(memberToDemote);

        if (!demotedMember) {
            return res.status(404).json({ 
                message: "Member not found." 
            });
        }

        return res.status(200).json({ 
            message: "Admin demoted successfully.",
            member: demotedMember 
        });
    } catch (err: any) {
        console.error("Error in handleDemoteAdmin:", err);
        return res.status(500).json({ 
            message: "An error occurred while demoting the admin." 
        });
    }
};