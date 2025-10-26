import { Request, Response, NextFunction } from "express";
import { User } from "../generated/prisma";
import { verifyToken } from "../utils/auth";
import { findUserById } from "../services/user-service";

type SafeUser = Omit<User, 'passwordHash'>;

/**
 * Extended Request interface with authenticated user
 */
export interface AuthenticatedRequest extends Request {
    user?: SafeUser;
}

/**
 * Authentication middleware
 * Verifies JWT token from cookies and attaches user to request
 * Redirects to login page if authentication fails
 */
export const authenticate = async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
): Promise<void> => {
    const token = req.cookies.token;

    // No token present - redirect to login
    if (!token) {
        res.redirect("/login");
        return;
    }

    try {
        // Verify and decode JWT token
        const decoded = verifyToken(token);
        
        if (!decoded) {
            console.warn("Invalid token detected");
            res.clearCookie('token');
            res.redirect("/login");
            return;
        }

        // Fetch user from database
        const user = await findUserById(decoded.id);
        
        if (!user) {
            console.warn(`User not found for ID: ${decoded.id}`);
            res.clearCookie('token');
            res.redirect("/login");
            return;
        }

        // Attach user to request and continue
        req.user = user;
        next();
    } catch (err) {
        console.error("Authentication error:", err);
        res.clearCookie("token");
        res.redirect("/login");
        return;
    }
};