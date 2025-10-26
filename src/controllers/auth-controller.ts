import { Request, Response } from "express";
import * as AuthService from "../services/auth-service";

export const handleRegister = async (req: Request, res: Response) => {
    try {
        const { username, emailAddress, password } = req.body;

        if (!username || !emailAddress || !password) {
            return res.status(400).render("pages/register-page/register-page", { 
                error: "All fields are required.",
                pageTitle: "Register"
            });
        }
        
        const { token } = await AuthService.registerUser(username, emailAddress, password);
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000, 
            sameSite: "lax"
        });

        return res.redirect("/home");
    } catch (err: any) {
        console.error("Registration error:", err);
        
        return res.status(400).render("pages/register-page/register-page", { 
            error: err.message || "Registration failed. Please try again.",
            pageTitle: "Register"
        });
    }
};

export const handleLogin = async (req: Request, res: Response) => {
    try {
        const { credentials, password } = req.body;

        if (!credentials || !password) {
            return res.status(400).render("pages/login-page/login-page", { 
                error: "Username/email and password are required.",
                pageTitle: "Login",
                credentials: req.body.credentials || ""
            });
        }
        
        const { token } = await AuthService.loginUser(credentials, password);
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000, 
            sameSite: "lax"
        });

        return res.redirect("/home");
    } catch (err: any) {
        console.error("Login error:", err);
        
        return res.status(401).render("pages/login-page/login-page", { 
            error: err.message || "Login failed. Please try again.",
            pageTitle: "Login",
            credentials: req.body.credentials || "" 
        });
    }
};

export const handleLogout = (req: Request, res: Response) => {
    res.clearCookie("token");
    
    return res.redirect("/login");
};