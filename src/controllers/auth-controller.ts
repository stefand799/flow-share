import { Request, Response } from "express";
import * as AuthService from "../services/auth-service";

/**
 * POST /auth/register
 * Handle user registration
 */
export const handleRegister = async (req: Request, res: Response) => {
    try {
        const { username, emailAddress, password } = req.body;

        // Validate required fields
        if (!username || !emailAddress || !password) {
            return res.status(400).render("pages/register-page", { 
                error: "All fields are required.",
                pageTitle: "Register"
            });
        }
        
        // Register user through service
        const { token } = await AuthService.registerUser(username, emailAddress, password);
        
        // Set secure HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            sameSite: "lax"
        });

        // Redirect to dashboard on success
        return res.redirect("/dashboard");
    } catch (err: any) {
        console.error("Registration error:", err);
        
        // Show error on registration page
        return res.status(400).render("pages/register-page", { 
            error: err.message || "Registration failed. Please try again.",
            pageTitle: "Register"
        });
    }
};

/**
 * POST /auth/login
 * Handle user login
 */
export const handleLogin = async (req: Request, res: Response) => {
    try {
        const { credentials, password } = req.body;

        // Validate required fields
        if (!credentials || !password) {
            return res.status(400).render("pages/login-page", { 
                error: "Username/email and password are required.",
                pageTitle: "Login",
                credentials: req.body.credentials || ""
            });
        }
        
        // Login user through service
        const { token } = await AuthService.loginUser(credentials, password);
        
        // Set secure HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            sameSite: "lax"
        });

        // Redirect to dashboard on success
        return res.redirect("/dashboard");
    } catch (err: any) {
        console.error("Login error:", err);
        
        // Show error on login page
        return res.status(401).render("pages/login-page", { 
            error: err.message || "Login failed. Please try again.",
            pageTitle: "Login",
            credentials: req.body.credentials || "" // Keep username filled
        });
    }
};

/**
 * POST /auth/logout
 * Handle user logout
 */
export const handleLogout = (req: Request, res: Response) => {
    // Clear authentication cookie
    res.clearCookie("token");
    
    // Redirect to login page
    return res.redirect("/login");
};