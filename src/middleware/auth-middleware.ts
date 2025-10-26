import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import { verifyToken } from "../utils/auth";
import { findUserById } from "../services/user-service";

type SafeUser = Omit<User, 'passwordHash'>;

export interface AuthenticatedRequest extends Request {
    user?: SafeUser;
}

export const authenticate = async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
): Promise<void> => {
    const token = req.cookies.token;

    if (!token) {
        res.redirect("/login");
        return;
    }

    try {
        const decoded = verifyToken(token);
        
        if (!decoded) {
            console.warn("Invalid token detected");
            res.clearCookie('token');
            res.redirect("/login");
            return;
        }

        const user = await findUserById(decoded.id);
        
        if (!user) {
            console.warn(`User not found for ID: ${decoded.id}`);
            res.clearCookie('token');
            res.redirect("/login");
            return;
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Authentication error:", err);
        res.clearCookie("token");
        res.redirect("/login");
        return;
    }
};