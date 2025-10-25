import {Request, Response} from "express";
import * as AuthService from "../services/auth-service";
import { User } from "../generated/prisma";

interface AuthenticateRequest extends Request{
    user?: User;
}

export const handleRegister = async (req: Request, res: Response) => {
    try{
        const { username, emailAddress, password } = req.body;
        // Assume AuthService.registerUser throws an error on failure (e.g., user exists)
        const { token } = await AuthService.registerUser(username, emailAddress, password);
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000, 
        });

        // SUCCESS: Redirect to the main application page
        res.redirect("/nav/main-page");
    } catch (err: any){
        // FAILURE: Render the register page again, passing the error message
        res.status(400).render("pages/register-page", { 
            error: err.message, // Pass the error message to the EJS template
            pageTitle: "Register" // Ensure pageTitle is passed if your layout needs it
        });
    }
};

export const handleLogin = async (req: Request, res: Response) => {
    try{
        const { credentials, password } = req.body;
        // Assume AuthService.loginUser throws an error on failure (e.g., bad credentials)
        const { user, token } = await AuthService.loginUser(credentials, password);
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000, 
        });
        
        // SUCCESS: Redirect to the main application page
        res.redirect("/nav/main-page");
    } catch (err: any) {
        // FAILURE: Render the login page again, passing the error message
        res.status(401).render("pages/login-page", { 
            error: err.message, // Pass the error message to the EJS template
            pageTitle: "Login", // Ensure pageTitle is passed
            credentials: req.body.credentials // Optional: Re-populate the credentials field
        });
    }
};

export const handleLogout = (req: Request, res: Response) => {
    res.clearCookie("token");
    res.redirect("/login"); 
}
