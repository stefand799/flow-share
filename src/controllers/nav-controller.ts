import { Request, Response } from "express";
import { User, Group } from "../generated/prisma"; // Import Group type
import * as GroupService from "../services/group-service"; // Import GroupService
import * as TaskService from "../services/task-service";
import * as ExpenseService from "../services/expense-service";
import * as UserService from "../services/user-service"; // For fetching profile data


// Define the shape of the request object after authentication middleware runs
interface AuthenticateRequest extends Request {
    user?: Omit<User, 'passwordHash'>;
    // Note: If you pass error messages in the URL or session, you might add them here.
};

// --- Public Pages (No Auth Required) ---

export const handleLogin = (req: Request, res: Response) => {
    // The error object might come from a redirect query parameter or session flash message
    const error = req.query.error as string || null;

    res.render('pages/login-page', { 
        pageTitle: 'Login', 
        error: error 
    });
};

export const handleRegister = (req: Request, res: Response) => {
    const error = req.query.error as string || null;

    res.render('pages/register-page', { 
        pageTitle: 'Register Account', 
        error: error 
    });
};

// --- Protected Pages (Auth Required) ---

// This handler corresponds to the redirect path "/nav/main-page" in auth-controller.ts
export const handleMainPage = async (req: AuthenticateRequest, res: Response) => {
    // The 'authenticate' middleware must run before this to ensure req.user exists.
    if (!req.user) {
        // This should theoretically not be reached if middleware is set up correctly
        return res.redirect('/login');
    }

    let groups: Group[] = [];
    try {
        // FETCH GROUPS: Use the service to get all groups the user belongs to
        // We cast req.user to User to match the service signature (SafeUser is compatible)
        groups = await GroupService.getGroups(req.user as User); 
    } catch (err) {
        console.error("Error fetching groups for main page:", err);
        // We will still render the page, but with an empty groups array
    }

    res.render('pages/main-page', { 
        pageTitle: 'Dashboard',
        user: req.user, // Pass user data to the EJS template (for profile component)
        groups: groups, // Pass the fetched groups list (for group list component)
    });
};

// Placeholder for other pages that require authentication (e.g., /groups, /tasks)
export const handleGroupsPage = (req: AuthenticateRequest, res: Response) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    // Logic to fetch group data can go here or in a dedicated group-page-service
    res.render('pages/groups-page', { // Assuming you create a views/pages/groups-page.ejs
        pageTitle: 'My Groups',
        user: req.user,
    });
};

// nav-controller.ts

// ... (Existing Imports and Interfaces)

// New Handler: Renders the group component dynamically
export const handleGroupComponent = async (req: AuthenticateRequest, res: Response) => {
    if (!req.user) {
        return res.status(403).send("Forbidden");
    }

    // Extract groupId from the route parameters
    const groupId = parseInt(req.params.groupId);

    if (isNaN(groupId)) {
        return res.status(400).send("Invalid Group ID");
    }

    try {
        // 1. Fetch the group details (using the new function)
        const group = await GroupService.getGroupById(groupId); 

        if (!group) {
            return res.status(404).send("Group not found");
        }

        // 2. Fetch the group members (which includes the user and isAdmin status)
        const members = await GroupService.getGroupMembers(groupId); 
        
        // 3. Render only the EJS component and send the HTML
        // NOTE: The path must correctly point to group-component.ejs
        res.render('components/group-component', {
            group: group,
            members: members,
            layout: false // Prevents wrapping the component in the main layout
        });

    } catch (err) {
        console.error(`Error rendering group component for ID ${groupId}:`, err);
        return res.status(500).send("Server error fetching group data.");
    }
};

// export const handleKanbanComponent = async (req: AuthenticateRequest, res: Response) => {
//     const authenticatedUserId = req.user?.id;
//     if (!authenticatedUserId) {
//         return res.status(403).send("Forbidden");
//     }

//     const groupId = parseInt(req.params.groupId);

//     if (isNaN(groupId)) {
//         return res.status(400).send("Invalid Group ID");
//     }

//     try {
//         // 1. Fetch Group Details (needed for the Kanban title)
//         const group = await GroupService.getGroupById(groupId);
//         if (!group) {
//             return res.status(404).send("Group not found");
//         }

//         // 2. Fetch all Tasks for the Group (with assigned user details included)
//         const tasks = await TaskService.getAllTasks(groupId);

//         // 3. Get the current user's GroupMember ID (required for claim/unclaim logic in EJS)
//         // NOTE: We assume TaskService.getGroupMemberId is available from task-service.ts [cite: task-service.ts]
//         const currentUserGroupMemberId = await TaskService.getGroupMemberId(authenticatedUserId, groupId);
        
//         // Check if the user is a member of this group
//         if (!currentUserGroupMemberId) {
//              return res.status(403).send("Forbidden: User is not a member of this group.");
//         }


//         // 4. Render the Kanban EJS component
//         res.render('components/kanban-component', {
//             group: group,
//             tasks: tasks,
//             // Pass the member ID for front-end claim logic/permission checks
//             currentUserGroupMember: { id: currentUserGroupMemberId }, 
//             layout: false
//         });

//     } catch (err) {
//         console.error(`Error rendering kanban component for ID ${groupId}:`, err);
//         return res.status(500).send("Server error fetching kanban data.");
//     }
// };




