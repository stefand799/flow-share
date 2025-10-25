import { Request, Response, NextFunction } from "express";
import {User} from "../generated/prisma";
import jwt from "jsonwebtoken";
import { findUserById } from "../services/user-service";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret"

type SafeUser = Omit<User, 'passwordHash'>;

interface AuthenticateRequest extends Request{
    user?: SafeUser;
}

export const authenticate = async (req: AuthenticateRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if(!token){
        // FIX: Redirect to the root-relative path for the login page: /login
        return res.redirect("/login"); 
    }

    try{
        const decoded = jwt.verify(token, JWT_SECRET) as {id: number};
        const user = await findUserById(decoded.id);

        if(!user){
            res.clearCookie('token');
            // FIX: Redirect to the root-relative path for the login page: /login
            return res.redirect("/login");
        }

        req.user = user;
        next();
    } catch(err){
        console.error("JWT Verification failed:", err); // Add logging
        res.clearCookie("token");
        // FIX: Redirect to the root-relative path for the login page: /login
        return res.redirect("/login");
    }
};