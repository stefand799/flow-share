import { Router } from "express";
import * as AuthController from "../controllers/auth-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

// ============================================
// PUBLIC AUTHENTICATION ROUTES
// ============================================

/**
 * POST /auth/register
 * Register a new user account
 * Body: { username, emailAddress, password }
 */
router.post("/register", AuthController.handleRegister);

/**
 * POST /auth/login
 * Login with existing credentials
 * Body: { credentials, password }
 * credentials can be username, email, or phone
 */
router.post("/login", AuthController.handleLogin);

// ============================================
// PROTECTED AUTHENTICATION ROUTES
// ============================================

/**
 * POST /auth/logout
 * Logout current user (requires authentication)
 * Clears authentication cookie
 */
router.post("/logout", authenticate, AuthController.handleLogout);

export default router;