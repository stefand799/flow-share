import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth-middleware";
import { verifyToken } from "../utils/auth";
import * as GroupService from "../services/group-service";
import * as GroupMemberService from "../services/group-member-service";
import * as TaskService from "../services/task-service";
import * as ExpenseService from "../services/expense-service";
import { User } from "@prisma/client";

// ============================================
// PUBLIC PAGE HANDLERS
// ============================================

/**
 * GET /login
 * Render login page
 * If already authenticated, redirect to home
 */
export const handleLoginPage = (req: Request, res: Response) => {
    // Check if user is already logged in
    const token = req.cookies.token;
    if (token && verifyToken(token)) {
        return res.redirect("/home");
    }

    // Render login page
    res.render("pages/login-page/login-page", {
        pageTitle: "Login",
        error: req.query.error || null,
        credentials: req.query.credentials || ""
    });
};

/**
 * GET /register
 * Render registration page
 * If already authenticated, redirect to home
 */
export const handleRegisterPage = (req: Request, res: Response) => {
    // Check if user is already logged in
    const token = req.cookies.token;
    if (token && verifyToken(token)) {
        return res.redirect("/home");
    }

    // Render registration page
    res.render("pages/register-page/register-page", {
        pageTitle: "Register",
        error: req.query.error || null
    });
};

// ============================================
// PROTECTED PAGE HANDLERS
// ============================================

/**
 * GET /home
 * Render user home page with profile
 * Groups will be loaded via AJAX call to GET /api/groups
 */
export const handleHomePage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user!;

        // Initially fetch groups for SSR (Server-Side Rendering)
        // This provides initial data, but frontend can refresh via API
        const groups = await GroupService.getGroupsOfUser(user as User);

        // Render home page - frontend JS will handle dynamic updates
        res.render("pages/home-page/home-page", {
            pageTitle: "Home",
            user: user,
            groups: groups  // Initial data for page load
        });
    } catch (err) {
        console.error("Error loading home page:", err);
        res.status(500).send("Error loading home page. Please try again.");
    }
};

/**
 * GET /dashboard/:groupId
 * Render group dashboard page
 * All dynamic data (members, tasks, expenses) will be loaded via AJAX
 */
export const handleDashboardPage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user!;
        const groupId = parseInt(req.params.groupId);

        // Validate group ID
        if (isNaN(groupId)) {
            return res.status(400).send("Invalid group ID format.");
        }

        // Fetch only essential initial data for SSR
        const group = await GroupService.getGroupById(groupId);

        if (!group) {
            return res.status(404).send("Group not found.");
        }

        // Check if user is a member (basic access control)
        const members = await GroupMemberService.getGroupMembers(groupId);
        const currentMember = members.find(m => m.userId === user.id);

        if (!currentMember) {
            return res.status(403).send(
                "Access denied. You are not a member of this group."
            );
        }

        // Fetch initial data for page load
        const tasks = await TaskService.getAllTasks(groupId);
        const expenses = await ExpenseService.getAllExpenses(groupId);

        // Render dashboard page with initial data
        // Frontend JS will use API routes for all CRUD operations
        res.render("pages/dashboard-page/dashboard-page", {
            pageTitle: group.name,
            user: user,
            group: group,
            members: members,
            currentMember: currentMember,
            tasks: tasks,
            expenses: expenses
        });
    } catch (err) {
        console.error("Error loading dashboard page:", err);
        res.status(500).send("Error loading group dashboard. Please try again.");
    }
};

// ============================================
// ROOT REDIRECT HANDLER
// ============================================

/**
 * GET /
 * Root path - redirect based on authentication
 */
export const handleRootRedirect = (req: Request, res: Response) => {
    // Check if user has valid token
    const token = req.cookies.token;

    if (token && verifyToken(token)) {
        // User is authenticated, redirect to home
        return res.redirect("/home");
    } else {
        // User is not authenticated, redirect to login
        return res.redirect("/login");
    }
};