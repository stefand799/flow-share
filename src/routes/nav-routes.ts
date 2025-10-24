import { Router } from "express";
import * as NavController from "../controllers/nav-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

router.get("/login", NavController.handleLoginPage);

router.get("/register", NavController.handleRegisterPage);

router.get("/home", authenticate, NavController.handleHomePage);

router.get("/dashboard/:groupId", authenticate, NavController.handleDashboardPage);

router.get("/", NavController.handleRootRedirect);

export default router;