import { Router } from "express";
import * as NavController from "../controllers/nav-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

/**
 * GET /login
 * Render login page
 * If already authenticated, redirect to /home
 */
router.get("/login", NavController.handleLoginPage);

/**
 * GET /register
 * Render registration page
 * If already authenticated, redirect to /home
 */
router.get("/register", NavController.handleRegisterPage);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

/**
 * GET /home
 * Render user home page with profile and groups list
 * Requires: authenticate middleware
 */
router.get("/home", authenticate, NavController.handleHomePage);

/**
 * GET /dashboard/:groupId
 * Render group dashboard with details, members, kanban, and expenses
 * Requires: authenticate middleware
 * Validates: user is member of the group
 */
router.get("/dashboard/:groupId", authenticate, NavController.handleDashboardPage);

// ============================================
// ROOT REDIRECT
// ============================================

/**
 * GET /
 * Root path - redirects based on authentication status
 * - If authenticated: redirect to /home
 * - If not authenticated: redirect to /login
 */
router.get("/", NavController.handleRootRedirect);

export default router;