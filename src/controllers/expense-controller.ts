import { Request, Response } from "express";
import * as ExpenseService from "../services/expense-service";
import { User, Expense, Currency, RecurrenceInterval } from "../generated/prisma";

interface AuthenticateRequest extends Request{
    user?: SafeUser;
    body: any; 
    query: any;
    params: any;
};

type SafeUser = Omit<User, 'passwordHash'>;


const validateEnums = (currency: string, recurrence: string) => {
    const validCurrency = Object.values(Currency).includes(currency as Currency) ? currency as Currency : undefined;
    const validRecurrence = Object.values(RecurrenceInterval).includes(recurrence as RecurrenceInterval) ? recurrence as RecurrenceInterval : undefined;
    
    return { validCurrency, validRecurrence };
}

export const handleCreate = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const { title, description, value, currency, groupId, isRecurring, due, recurrenceInterval } = req.body;

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});
    
    if (!title || !value || !groupId) {
        return res.status(400).json({message: "Bad Request: Title, value, and group ID are required for creating an expense."});
    }

    const valueFloat = parseFloat(value);
    if (isNaN(valueFloat) || valueFloat <= 0) {
        return res.status(400).json({message: "Bad Request: Value must be a positive number."});
    }

    const { validCurrency, validRecurrence } = validateEnums(currency, recurrenceInterval);

    try{
        const newExpenseData = {
            title,
            description,
            value: valueFloat,
            currency: validCurrency || Currency.USD, 
            groupId: parseInt(groupId),
            isRecurring: !!isRecurring, 
            due: due ? new Date(due) : null,
            recurrenceInterval: validRecurrence || RecurrenceInterval.NONE,
        };

        const createdExpense = await ExpenseService.createExpense(newExpenseData as any);

        if (!createdExpense) 
            return res.status(500).json({message: "Error creating expense: Could not save to database."});

        return res.status(200).json({expense: createdExpense, message: "Expense created successfully."});
    }catch(err: any){
        console.error("Error in handleCreate:", err);
        return res.status(500).json({message: "Error creating expense"}); 
    }
};

export const handleUpdate = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const { id, title, description, value, currency, isRecurring, due, recurrenceInterval } = req.body; 

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});
    
    const expenseId = parseInt(id);
    if (isNaN(expenseId)) {
        return res.status(400).json({message: "Bad Request: Expense ID is required for update."});
    }

    const { validCurrency, validRecurrence } = validateEnums(currency, recurrenceInterval);

    try{
        const dataToUpdate: any = {};
        if (title !== undefined) dataToUpdate.title = title;
        if (description !== undefined) dataToUpdate.description = description;
        if (value !== undefined) dataToUpdate.value = parseFloat(value);
        if (validCurrency) dataToUpdate.currency = validCurrency;
        if (isRecurring !== undefined) dataToUpdate.isRecurring = !!isRecurring;
        if (due !== undefined) dataToUpdate.due = due ? new Date(due) : null;
        if (validRecurrence) dataToUpdate.recurrenceInterval = validRecurrence;
        
        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({message: "Bad Request: No valid fields provided for update."});
        }
        
        const updatedExpense = await ExpenseService.updateExpense(expenseId, dataToUpdate);

        if (!updatedExpense)
            return res.status(404).json({message: "Error updating expense: Expense not found."});

        return res.status(200).json({expense: updatedExpense, message: "Expense updated successfully."});
    }catch(err: any){
        console.error("Error in handleUpdate:", err);
        return res.status(500).json({message: "Error updating expense"}); 
    }
};

export const handleDelete = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const expenseId = parseInt(req.body.expenseId || req.query.expenseId);

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(expenseId)) {
        return res.status(400).json({message: "Bad Request: Expense ID is required."});
    }

    try{
        const deleted = await ExpenseService.deleteExpense(expenseId);
        
        if(!deleted) 
            return res.status(404).json({message: "Error deleting expense: Expense not found."});
        
        return res.status(200).json({message: "Expense deleted successfully"});
    } catch(err: any){
        console.error("Error in handleDelete:", err);
        return res.status(500).json({message: "Error deleting expense."});
    }
}

export const handleGetAll = async(req: AuthenticateRequest, res:Response) =>{
    const authenticatedUserId = req.user?.id;
    const groupId = parseInt(req.query.groupId as string);

    if(!authenticatedUserId)
        return res.status(403).json({message: "Forbidden: You are not authenticated."});

    if (isNaN(groupId)) {
        return res.status(400).json({message: "Bad Request: Group ID is required."});
    }

    try{
        const expenses = await ExpenseService.getAllExpenses(groupId);

        return res.status(200).json({expenses: expenses});
    }catch(err: any){
        console.error("Error in handleGetAll:", err);
        return res.status(500).json({message: "Error retrieving expenses."});
    }
};
