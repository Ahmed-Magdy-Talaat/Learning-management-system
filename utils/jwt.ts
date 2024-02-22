require("dotenv").config();
import { IUser } from "../models/User";
import { Response } from "express";
import redis from "./redis";

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

const accessTokenExpires = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
const refreshTokenExpires = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpires * 60 * 1000),
  maxAge: accessTokenExpires * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpires * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpires * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAcessToken();
  const refreshToken = user.SignRefreshToken();

  redis.set(user._id, JSON.stringify(user) as any);

  if (process.env.NODE_DEV == "production") accessTokenOptions.secure = true;

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
