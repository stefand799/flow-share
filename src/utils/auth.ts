import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret";
const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> =>{
    return await bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> =>{
    return await bcrypt.compare(password, hash);
};

export const generateToken = (userId: number): string => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1d" });
};

export const verifyToken = (token: string): {id: number} | null =>{
    try{
        const decoded = jwt.verify(token, JWT_SECRET) as {id: number};
        return decoded;
    } catch(err){
        return null;
    }
}