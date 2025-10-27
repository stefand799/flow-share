import { Request, Response } from "express";
import * as ContributionService from "../services/contribution-service";
import { User } from "@prisma/client";

interface AuthenticateRequest extends Request {
    user?: SafeUser;
    body: any; 
    query: any;
    params: any;
}

type SafeUser = Omit<User, 'passwordHash'>;

export const handleCreate = async (req: AuthenticateRequest, res: Response) => {
    const { value, expenseId, groupId } = req.body; 

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;
    
    if (!value || !expenseId || !groupId) {
        return res.status(400).json({ 
            message: "Value, Expense ID, and Group ID are required." 
        });
    }

    const valueFloat = parseFloat(value);
    const expenseIdNum = parseInt(expenseId);
    const groupIdNum = parseInt(groupId);

    if (isNaN(valueFloat) || valueFloat <= 0) {
        return res.status(400).json({ 
            message: "Value must be a positive number." 
        });
    }

    if (isNaN(expenseIdNum) || isNaN(groupIdNum)) {
        return res.status(400).json({ 
            message: "Expense ID and Group ID must be valid numbers." 
        });
    }

    try {
        const groupMemberId = await ContributionService.getGroupMemberIdByUserIdAndGroupId(
            authenticatedUserId, 
            groupIdNum
        );
        
        if (!groupMemberId) {
            return res.status(403).json({ 
                message: "You are not a member of this group." 
            });
        }
        
        
        const existingContribution = await ContributionService.findExistingContribution(
            expenseIdNum,
            groupMemberId
        );

        if (existingContribution) {
            
            const updatedContribution = await ContributionService.updateContribution(
                existingContribution.id,
                valueFloat
            );

            if (!updatedContribution) {
                return res.status(500).json({ 
                    message: "Failed to update contribution." 
                });
            }

            return res.status(200).json({ 
                message: "Your contribution has been updated successfully.",
                contribution: updatedContribution,
                isUpdate: true
            });
        }

        
        const contributionData = {
            value: valueFloat,
            expenseId: expenseIdNum,
            groupMemberId: groupMemberId,
        };

        const createdContribution = await ContributionService.createContribution(contributionData);

        if (!createdContribution) {
            return res.status(500).json({ 
                message: "Failed to create contribution." 
            });
        }

        return res.status(201).json({ 
            message: "Contribution created successfully.",
            contribution: createdContribution,
            isUpdate: false
        });
    } catch (err: any) {
        console.error("Error in handleCreate:", err);
        return res.status(500).json({ 
            message: "An error occurred while creating the contribution." 
        }); 
    }
};

/**
 * GET /api/contributions/expense/:expenseId
 * Get all contributions for a specific expense
 */
export const handleGetAll = async (req: AuthenticateRequest, res: Response) => {
    const expenseId = parseInt(req.params.expenseId);

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (isNaN(expenseId)) {
        return res.status(400).json({ 
            message: "Invalid expense ID format." 
        });
    }

    try {
        const contributions = await ContributionService.getAllContributionsByExpense(expenseId);

        return res.status(200).json({ 
            contributions: contributions 
        });
    } catch (err: any) {
        console.error("Error in handleGetAll:", err);
        return res.status(500).json({ 
            message: "An error occurred while retrieving contributions." 
        });
    }
};

export const handleUpdate = async (req: AuthenticateRequest, res: Response) => {
    const contributionId = parseInt(req.params.contributionId);
    const { value } = req.body; 

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;
    
    if (isNaN(contributionId)) {
        return res.status(400).json({ 
            message: "Invalid contribution ID format." 
        });
    }

    const valueFloat = parseFloat(value);

    if (isNaN(valueFloat) || valueFloat <= 0) {
        return res.status(400).json({ 
            message: "Value must be a positive number." 
        });
    }

    try {
        const updatedContribution = await ContributionService.updateContribution(
            contributionId, 
            valueFloat
        );

        if (!updatedContribution) {
            return res.status(404).json({ 
                message: "Contribution not found." 
            });
        }

        return res.status(200).json({ 
            message: "Contribution updated successfully.",
            contribution: updatedContribution 
        });
    } catch (err: any) {
        console.error("Error in handleUpdate:", err);
        return res.status(500).json({ 
            message: "An error occurred while updating the contribution." 
        }); 
    }
};

export const handleDelete = async (req: AuthenticateRequest, res: Response) => {
    const contributionId = parseInt(req.params.contributionId);

    if (!req.user) {
        return res.status(401).json({ 
            message: "Authentication required." 
        });
    }

    const authenticatedUserId = req.user.id;

    if (isNaN(contributionId)) {
        return res.status(400).json({ 
            message: "Invalid contribution ID format." 
        });
    }

    try {
        const deleted = await ContributionService.deleteContribution(contributionId);
        
        if (!deleted) {
            return res.status(404).json({ 
                message: "Contribution not found." 
            });
        }
        
        return res.status(200).json({ 
            message: "Contribution deleted successfully." 
        });
    } catch (err: any) {
        console.error("Error in handleDelete:", err);
        return res.status(500).json({ 
            message: "An error occurred while deleting the contribution." 
        });
    }
};