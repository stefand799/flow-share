import { Request, Response } from "express";
import * as AuthService from "../services/auth-service";

// Handle user registration
export const handleRegister = async (req: Request, res: Response) => {
    try {
        const { username, emailAddress, password } = req.body;
        
        // Register user through service
        const { token } = await AuthService.registerUser(username, emailAddress, password);
        
        // Set cookie and redirect to dashboard
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        return res.redirect("/dashboard");
    } catch (err: any) {
        // Show error on registration page
        return res.status(400).render("pages/register-page", { 
            error: err.message,
            pageTitle: "Register"
        });
    }
};

// Handle user login
export const handleLogin = async (req: Request, res: Response) => {
    try {
        const { credentials, password } = req.body;
        
        // Login user through service
        const { token } = await AuthService.loginUser(credentials, password);
        
        // Set cookie and redirect to dashboard
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        return res.redirect("/dashboard");
    } catch (err: any) {
        // Show error on login page
        return res.status(401).render("pages/login-page", { 
            error: err.message,
            pageTitle: "Login",
            credentials: req.body.credentials // Keep filled
        });
    }
};

// Handle user logout
export const handleLogout = (req: Request, res: Response) => {
    res.clearCookie("token");
    return res.redirect("/login");
};