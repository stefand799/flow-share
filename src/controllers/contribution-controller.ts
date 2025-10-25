import { Request, Response } from "express";
import * as ContributionService from "../services/contribution-service";
import { User, Contribution } from "../generated/prisma";

interface AuthenticateRequest extends Request{
    user?: SafeUser;
    body: any; 
    query: any;
    params: any;
};

type SafeUser = Omit<User, 'passwordHash'>;

export const handleCreate = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const { value, expenseId, groupId } = req.body; 

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});
    
    if (!value || !expenseId || !groupId) {
        return res.status(400).json({message: "Bad Request: Value, Expense ID, and Group ID are required for creating a contribution."});
    }

    const valueFloat = parseFloat(value);
    const expenseIdNum = parseInt(expenseId);
    const groupIdNum = parseInt(groupId);

    if (isNaN(valueFloat) || valueFloat <= 0) {
        return res.status(400).json({message: "Bad Request: Value must be a positive number."});
    }
    if (isNaN(expenseIdNum) || isNaN(groupIdNum)) {
        return res.status(400).json({message: "Bad Request: Expense ID and Group ID must be valid numbers."});
    }

    try{
        const groupMemberId = await ContributionService.getGroupMemberIdByUserIdAndGroupId(authenticatedUserId, groupIdNum);
        
        if (!groupMemberId) {
            return res.status(403).json({message: "Forbidden: User is not a member of the group associated with this expense."});
        }
        
        const contributionData = {
            value: valueFloat,
            expenseId: expenseIdNum,
            groupMemberId: groupMemberId,
        };

        const createdContribution = await ContributionService.createContribution(contributionData);

        if (!createdContribution) 
            return res.status(500).json({message: "Error creating contribution: Could not save to database. Expense ID may be invalid."});

        return res.status(200).json({contribution: createdContribution, message: "Contribution created successfully."});
    }catch(err: any){
        console.error("Error in handleCreate:", err);
        return res.status(500).json({message: "Error creating contribution"}); 
    }
};

export const handleUpdate = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const { id, value } = req.body; 

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});
    
    const contributionId = parseInt(id);
    const valueFloat = parseFloat(value);

    if (isNaN(contributionId) || isNaN(valueFloat) || valueFloat <= 0) {
        return res.status(400).json({message: "Bad Request: Contribution ID and a positive value are required for update."});
    }

    try{
        const updatedContribution = await ContributionService.updateContribution(contributionId, valueFloat);

        if (!updatedContribution)
            return res.status(404).json({message: "Error updating contribution: Contribution not found."});

        return res.status(200).json({contribution: updatedContribution, message: "Contribution updated successfully."});
    }catch(err: any){
        console.error("Error in handleUpdate:", err);
        return res.status(500).json({message: "Error updating contribution"}); 
    }
};

export const handleDelete = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const contributionId = parseInt(req.body.id || req.query.id);

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(contributionId)) {
        return res.status(400).json({message: "Bad Request: Contribution ID is required."});
    }

    try{
        const deleted = await ContributionService.deleteContribution(contributionId);
        
        if(!deleted) 
            return res.status(404).json({message: "Error deleting contribution: Contribution not found."});
        
        return res.status(200).json({message: "Contribution deleted successfully"});
    } catch(err: any){
        console.error("Error in handleDelete:", err);
        return res.status(500).json({message: "Error deleting contribution."});
    }
}

export const handleGetAll = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const expenseId = parseInt(req.query.expenseId as string);

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(expenseId)) {
        return res.status(400).json({message: "Bad Request: Expense ID is required."});
    }

    try{
        const contributions = await ContributionService.getAllContributionsByExpense(expenseId);

        return res.status(200).json({contributions: contributions});
    }catch(err: any){
        console.error("Error in handleGetAll:", err);
        return res.status(500).json({message: "Error retrieving contributions."});
    }
};
