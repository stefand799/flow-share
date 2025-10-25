import { Request, Response, NextFunction } from "express";
import { User } from "../generated/prisma";
import { verifyToken } from "../utils/auth";
import { findUserById } from "../services/user-service";

type SafeUser = Omit<User, 'passwordHash'>;

export interface AuthenticatedRequest extends Request {
    user?: SafeUser;
}

// Middleware to verify JWT and attach user to request
export const authenticate = async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
) => {
    const token = req.cookies.token;

    // No token - redirect to login
    if (!token) {
        return res.redirect("/login");
    }

    try {
        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            res.clearCookie('token');
            return res.redirect("/login");
        }

        // Get user from database
        const user = await findUserById(decoded.id);
        if (!user) {
            res.clearCookie('token');
            return res.redirect("/login");
        }

        // Attach user to request and continue
        req.user = user;
        next();
    } catch (err) {
        console.error("Authentication failed:", err);
        res.clearCookie("token");
        return res.redirect("/login");
    }
};