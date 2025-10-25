import { Router } from "express";
import * as NavController from "../controllers/nav-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

// --- Public Routes ---
// These are the direct links used for initial page loading
router.get("/login", NavController.handleLogin);
router.get("/register", NavController.handleRegister);


// --- Protected Routes ---
// These routes require the user to be logged in before viewing the page content
// The 'authenticate' middleware redirects unauthenticated users to /login
router.get("/nav/main-page", authenticate, NavController.handleMainPage);
// Optional: If you have a dedicated groups page view:
// router.get("/groups", authenticate, NavController.handleGroupsPage);
router.get("/component/group/:groupId", authenticate, NavController.handleGroupComponent);
//router.get("/component/kanban/:groupId", authenticate, NavController.handleKanbanComponent);
// Fallback for the root path
router.get("/", (req, res) => res.redirect("/nav/main-page"));

export default router;