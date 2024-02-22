import { NextFunction } from "express";
import catchAsyncError from "../middleware/catchAsyncErrors";

export const createOrder=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    await     
})