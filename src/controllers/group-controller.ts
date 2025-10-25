// File: controllers/group-controller.ts (Revised)

import { Request, Response } from "express";
import * as GroupService from "../services/group-service";
import { User, GroupMember, Group } from "../generated/prisma";

// Interface extending Express Request to include the authenticated user object
interface AuthenticateRequest extends Request{
    user?: SafeUser;
    body: any; 
    params: any; // Added for explicit parameter typing
    query: any;  // Added for explicit query typing
};

// Type definition for a user object without the sensitive passwordHash
type SafeUser = Omit<User, 'passwordHash'>;


export const handleCreate = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});
    
    try{
        const newGroupData = req.body;
        let createdGroup: Group | null;

        createdGroup = await GroupService.createGroup(newGroupData); 

        if (!createdGroup) 
            return res.status(409).json({message: "Error creating group: Group with this name already exists."});
        
        // Add creator as member
        const memberData: GroupMember = {
            userId: authenticatedUserId, 
            groupId: createdGroup.id,
        } as GroupMember; 

        const createdMember = await GroupService.addMember(memberData);

        if (!createdMember) {
            console.error("Critical Error: Failed to add creator as member.");
            return res.status(500).json({message: "Error completing group setup: Failed to add creator as member."});
        }

        // Promote creator to admin
        const adminData: GroupMember = {
            id: createdMember.id,
        } as GroupMember;

        const promotedAdmin = await GroupService.promoteAdmin(adminData);
        
        if (!promotedAdmin) {
             console.error("Warning: Could not promote creator to admin.");
        }

        return res.status(200).json({group: createdGroup});
    }catch(err: any){
        console.error("Error in handleCreate:", err);
        return res.status(500).json({message: "Error creating group"}); 
    }
};

export const handleUpdate = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    // 👈 CHANGE: Get Group ID from URL params
    const groupId = parseInt(req.params.groupId); 

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(groupId))
        return res.status(400).json({message: "Bad Request: Group ID is required."});
    
    try{
        // Construct the Group object, merging the ID from the URL with body data
        const groupToUpdate = { 
            ...req.body,
            id: groupId 
        } as Group;

        const updatedGroup = await GroupService.updateGroup(groupToUpdate);

        if (!updatedGroup)
            return res.status(404).json({message: "Error updating group: Group not found."});

        return res.status(200).json({group: updatedGroup});
    }catch(err: any){
        console.error("Error in handleUpdate:", err);
        return res.status(500).json({message: "Error updating group"}); 
    }
};

export const handleDelete = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    // 👈 CHANGE: Get Group ID from URL params
    const groupId = parseInt(req.params.groupId); 

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(groupId))
        return res.status(400).json({message: "Bad Request: Group ID is required."});

    try{
        // Construct Group object with only the ID
        const groupToDelete = { id: groupId } as Group; 
        const deletedGroup = await GroupService.deleteGroup(groupToDelete);
        
        if(!deletedGroup) return res.status(404).json({message: "Error deleting group: Group not found."});
        
        return res.status(200).json({message: "Group deleted successfully"});
    } catch(err: any){
        console.error("Error in handleDelete:", err);
        return res.status(500).json({message: "Error deleting group."});
    }
}

export const handleGetAll = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUser = req.user;

    if(!authenticatedUser)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    try{
        const groups = await GroupService.getGroups(authenticatedUser as User);

        return res.status(200).json({groups: groups});
    }catch(err: any){
        console.error("Error in handleGetAll:", err);
        return res.status(500).json({message: "Error retrieving groups."});
    }
};

export const handleGetMembers = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    // 👈 CHANGE: Get Group ID from URL params
    const groupId = parseInt(req.params.groupId as string); 

    if (isNaN(groupId)) {
        return res.status(400).json({message: "Bad Request: Group ID is required."});
    }

    try{
        const members = await GroupService.getGroupMembers(groupId); 

        if (!members) {
            return res.status(200).json({members: []});
        }

        return res.status(200).json({members: members}); 
    }catch(err: any){
        console.error("Error in handleGetMembers:", err);
        return res.status(500).json({message: "Error retrieving group members."});
    }
};

export const handleAddMember = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const memberToAdd: GroupMember = req.body;

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (!memberToAdd || !memberToAdd.userId || !memberToAdd.groupId) {
        return res.status(400).json({message: "Bad Request: User ID and Group ID are required for adding a member."});
    }

    try{
        const createdMember = await GroupService.addMember(memberToAdd);

        if (!createdMember)
            return res.status(409).json({message: "Error adding member: User is already a member of this group."});

        return res.status(200).json({member: createdMember});
    }catch(err: any){
        console.error("Error in handleAddMember:", err);
        return res.status(500).json({message: "Error adding member."});
    }
};

export const handleRemoveMember = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    // 👈 CHANGE: Get Member ID from URL params
    const memberId = parseInt(req.params.memberId); 

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(memberId)) {
        return res.status(400).json({message: "Bad Request: Group Member ID is required for removal."});
    }

    try{
        // Construct GroupMember object with only the ID
        const memberToRemove = { id: memberId } as GroupMember; 
        const removed = await GroupService.removeMember(memberToRemove);

        if (!removed)
            return res.status(404).json({message: "Error removing member: Membership record not found."});

        return res.status(200).json({message: "Member removed successfully."});
    }catch(err: any){
        console.error("Error in handleRemoveMember:", err);
        return res.status(500).json({message: "Error removing member."});
    }
};

export const handlePromoteAdmin = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    // 👈 CHANGE: Get Member ID from URL params
    const memberId = parseInt(req.params.memberId); 

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});
    
    if (isNaN(memberId)) {
        return res.status(400).json({message: "Bad Request: Group Member ID is required for promotion."});
    }

    try{
        // Construct GroupMember object with only the ID
        const memberToPromote = { id: memberId } as GroupMember; 
        const promotedMember = await GroupService.promoteAdmin(memberToPromote);

        if (!promotedMember)
            return res.status(404).json({message: "Error promoting admin: Membership record not found."});
        
        return res.status(200).json({member: promotedMember, message: "Member promoted to admin successfully."});
    }catch(err: any){
        console.error("Error in handlePromoteAdmin:", err);
        return res.status(500).json({message: "Error promoting admin."});
    }
};

export const handleDemoteAdmin = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    // 👈 CHANGE: Get Member ID from URL params
    const memberId = parseInt(req.params.memberId); 

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(memberId)) {
        return res.status(400).json({message: "Bad Request: Group Member ID is required for demotion."});
    }

    try{
        // Construct GroupMember object with only the ID
        const memberToDemote = { id: memberId } as GroupMember; 
        const demotedMember = await GroupService.demoteAdmin(memberToDemote);

        if (!demotedMember)
            return res.status(404).json({message: "Error demoting admin: Membership record not found."});

        return res.status(200).json({member: demotedMember, message: "Admin demoted successfully."});
    }catch(err: any){
        console.error("Error in handleDemoteAdmin:", err);
        return res.status(500).json({message: "Error demoting admin."});
    }
};