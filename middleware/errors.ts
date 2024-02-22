import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import express from "express";

const errorsHandling = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    const message = `Resource is not valid :${err.path}`;
    err = new ErrorHandler(400, message);
  }

  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(400, message);
  }

  if (err.name === "jsonWebTokenError") {
    const message = `token is not valid , please sign in`;
    err = new ErrorHandler(400, message);
  }

  if (err.name === "TokenExpiredError") {
    const message = "token is expired , please sign in";
    err = new ErrorHandler(400, message);
  }
  res.status(err.statusCode).json({
    status: "Error",
    success: "False",
    message: err.message,
  });
};

export default errorsHandling;
