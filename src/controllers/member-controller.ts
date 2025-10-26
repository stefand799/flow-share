import { Request, Response } from "express";
import * as MemberService from "../services/member-service";
import { GroupMember, User } from "../generated/prisma";

interface AuthenticateRequest extends Request {
    user?: Omit<User, 'passwordHash'>;
}

/**
 * GET /api/members/group/:groupId
 * Get all members of a specific group
 */
export const handleGetMembers = async (req: AuthenticateRequest, res: Response) => {
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
        const members = await MemberService.getGroupMembers(groupId);

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
 * Add a member to a group
 */
export const handleAddMember = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const { userId, groupId } = req.body;

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

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

        const createdMember = await MemberService.addMember(memberToAdd);

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
 * DELETE /api/members/:memberId
 * Remove a member from a group
 */
export const handleRemoveMember = async (req: AuthenticateRequest, res: Response) => {
    const authenticatedUserId = req.user?.id;
    const memberId = parseInt(req.params.memberId);

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    if (isNaN(memberId)) {
        return res.status(400).json({ 
            message: "Invalid member ID format." 
        });
    }

    try {
        const memberToRemove = { id: memberId } as GroupMember;
        const removed = await MemberService.removeMember(memberToRemove);

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
    const authenticatedUserId = req.user?.id;
    const memberId = parseInt(req.params.memberId);

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    if (isNaN(memberId)) {
        return res.status(400).json({ 
            message: "Invalid member ID format." 
        });
    }

    try {
        const memberToPromote = { id: memberId } as GroupMember;
        const promotedMember = await MemberService.promoteAdmin(memberToPromote);

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
    const authenticatedUserId = req.user?.id;
    const memberId = parseInt(req.params.memberId);

    if (!authenticatedUserId) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    if (isNaN(memberId)) {
        return res.status(400).json({ 
            message: "Invalid member ID format." 
        });
    }

    try {
        const memberToDemote = { id: memberId } as GroupMember;
        const demotedMember = await MemberService.demoteAdmin(memberToDemote);

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