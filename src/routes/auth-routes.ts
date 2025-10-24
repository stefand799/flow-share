import { Router } from "express";
import * as AuthController from "../controllers/auth-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

router.post("/register", AuthController.handleRegister);

router.post("/login", AuthController.handleLogin);

router.post("/logout", authenticate, AuthController.handleLogout);

export default router;