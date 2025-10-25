import { Request, Response } from "express";
import { User, Group } from "../generated/prisma";
import * as GroupService from "../services/group-service";

// Authenticated request type
interface AuthenticatedRequest extends Request {
    user?: Omit<User, 'passwordHash'>;
}

// ============================================
// PUBLIC PAGES (No Authentication Required)
// ============================================

/**
 * Renders the login page
 * GET /login
 */
export const handleLogin = (req: Request, res: Response) => {
    const error = req.query.error as string || null;

    res.render('pages/login-page', { 
        pageTitle: 'Login', 
        error: error 
    });
};

/**
 * Renders the registration page
 * GET /register
 */
export const handleRegister = (req: Request, res: Response) => {
    const error = req.query.error as string || null;

    res.render('pages/register-page', { 
        pageTitle: 'Register Account', 
        error: error 
    });
};

// ============================================
// PROTECTED PAGES (Authentication Required)
// ============================================

/**
 * Renders the main dashboard page
 * GET /dashboard
 */
export const handleDashboard = async (req: AuthenticatedRequest, res: Response) => {
    // Middleware ensures req.user exists, but double-check for safety
    if (!req.user) {
        return res.redirect('/login');
    }

    let groups: Group[] = [];
    
    try {
        // Fetch all groups the user belongs to
        groups = await GroupService.getGroups(req.user as User);
    } catch (err) {
        console.error("Error fetching groups for dashboard:", err);
        // Continue rendering with empty groups array
    }

    res.render('pages/main-page', { 
        pageTitle: 'Dashboard',
        user: req.user,
        groups: groups,
    });
};

/**
 * Renders a specific group component (partial view)
 * GET /groups/:groupId
 */
export const handleGroupView = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(403).send("Forbidden");
    }

    const groupId = parseInt(req.params.groupId);

    if (isNaN(groupId)) {
        return res.status(400).send("Invalid Group ID");
    }

    try {
        // Fetch group details
        const group = await GroupService.getGroupById(groupId);
        
        if (!group) {
            return res.status(404).send("Group not found");
        }

        // Fetch group members
        const members = await GroupService.getGroupMembers(groupId);
        
        // Render just the component (no layout wrapper)
        res.render('components/group-component', {
            group: group,
            members: members,
            layout: false // Prevents wrapping in main layout
        });

    } catch (err) {
        console.error(`Error rendering group view for ID ${groupId}:`, err);
        return res.status(500).send("Server error fetching group data.");
    }
};