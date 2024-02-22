import { IUser } from "../models/User";
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
