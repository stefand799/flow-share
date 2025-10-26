import { Router } from "express";
import * as NavController from "../controllers/nav-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Login page
router.get("/login", NavController.handleLogin);

// Register page
router.get("/register", NavController.handleRegister);

// ============================================
// PROTECTED ROUTES (Require Authentication)
// ============================================

// Main dashboard (after login)
router.get("/dashboard", authenticate, NavController.handleDashboard);
router.get("/")
// View specific group (partial render for dynamic content)
router.get("/groups/:groupId", authenticate, NavController.handleGroupView);
router.get("/component/group/:groupId", authenticate, NavController.handleGroupView);
// ============================================
// REDIRECTS
// ============================================

// Root path redirects to dashboard
router.get("/", (req, res) => res.redirect("/dashboard"));

export default router;