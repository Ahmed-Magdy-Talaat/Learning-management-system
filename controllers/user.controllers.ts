import ejs from "ejs";
import User from "../models/User";
import ErrorHandler from "../utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import catchAsyncError from "../middleware/catchAsyncErrors";
import { IUser } from "../models/User";
import jwt, { JwtPayload } from "jsonwebtoken";
import sendMail from "../utils/sendmails";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import redis from "../utils/redis";
import cloudinary from "cloudinary";

require("dotenv").config();

interface IRegisterBody {
  name: string;
  password: string;
  email: string;
  role: string;
}

interface IActivation {
  activationCode: string;
  activationToken: string;
}
export const registerUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, password, email, role } = req.body;
    const isExist = await User.findOne({ email });

    if (isExist) {
      return next(new ErrorHandler(400, "Email already Exists"));
    } else {
      const user: IRegisterBody = {
        name,
        email,
        password,
        role,
      };

      const activation = await createActivationToken(user);
      const data = {
        user: { name: user.name },
        activationCode: activation.activationCode,
      };

      try {
        await sendMail({
          email: user.email,
          template: "activation-mail.ejs",
          subject: "Activate your Email on eLearnHub",
          data,
        });
        res.status(200).json({
          success: true,
          message: `Check your email ${user.email} please , to activate your account`,
          token: activation.token,
        });
      } catch (err: any) {
        console.log(err.message);
        return next(new ErrorHandler(400, "Couldn't send Email"));
      }
    }
  }
);

const createActivationToken = async (user: IRegisterBody) => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET!,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

export const activateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { activationToken, activationCode } = req.body;

    const user: { user: IUser; activationCode: string } = jwt.verify(
      activationToken,
      process.env.ACTIVATION_SECRET!
    ) as { user: IUser; activationCode: string };
    console.log(activationCode);
    console.log(user.activationCode);
    if (user.activationCode !== activationCode) {
      return next(new ErrorHandler(400, "Invalid activation code"));
    }
    //
    else {
      const { name, password, email, role } = user.user;
      const newUser = new User({
        name,
        password,
        email,
        role,
      });

      await newUser.save();
      res.status(200).json({
        status: "success",
        message: "user registered successfully",
        user: newUser,
      });
    }
  }
);

interface ILoginRequest {
  email: string;
  password: string;
}

export const login = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as ILoginRequest;

    const user = (await User.findOne({ email }).select("+password")) as IUser;

    if (!email || !password) {
      return next(
        new ErrorHandler(400, "Please enter both Email and Password")
      );
    }
    if (!user) {
      return next(new ErrorHandler(404, "Email not found"));
    }
    const isPasswordMatch = await user.comparePassword(password as string);

    if (isPasswordMatch) {
      sendToken(user, 200, res);
    }
    //
    else {
      return next(new ErrorHandler(400, "Invalid Credintials"));
    }
  }
);

export const logout = catchAsyncError(
  (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = req.user?._id || "";

      redis.del(userId);
      res.status(200).json({
        success: true,
        message: "user signed out successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(400, err.message));
    }
  }
);

//update access token

export const updateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh_token = req.cookies.refresh_token as string;
    const decoded = jwt.verify(
      refresh_token,
      process.env.REFRESH_TOKEN!
    ) as JwtPayload;
    console.log(decoded);
    const session = (await redis.get(decoded.id)) as string;
    const user = JSON.parse(session);
    console.log("hey:", user);
    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN!, {
      expiresIn: "5m",
    });
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN!,
      {
        expiresIn: "3d",
      }
    );
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);
    res.status(200).json({
      status: true,
      accessToken,
    });
  } catch (err: any) {
    return next(new ErrorHandler(400, err.message));
  }
};

export const getUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.user?._id as string;
      console.log(id);
      const user = await User.findById(id);
      res.status(200).json({
        status: true,
        user,
      });
    } catch (err) {
      return next(new ErrorHandler(400, "Please Sign in"));
    }
  }
);

interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}

export const socialAuth = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, name, avatar } = req.body as ISocialAuthBody;
    const user = (await User.findOne({ email })) as IUser;

    if (!user) {
      const newUser = (await User.create({
        email,
        name,
        avatar,
      })) as unknown as IUser;
      sendToken(newUser, 200, res);
    } else {
      sendToken(user, 200, res);
    }
    try {
    } catch (err: any) {
      return next(new ErrorHandler(400, err.message));
    }
  }
);

interface IUserInfo {
  name?: string;
  email?: string;
}
export const updateUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email } = req.body as IUserInfo;
    const id = req.user?._id;
    try {
      const user = await User.findById(id);
      if (user) {
        if (email) {
          const isExist = await User.findOne({ email });
          if (isExist) {
            return next(new ErrorHandler(400, "Email already exists"));
          }
          //
          user.email = email;
        }

        if (name) {
          user.name = name;
        }
        await user.save();
        await redis.set(id!, JSON.stringify(user));
        res.status(200).json({
          success: true,
          user,
        });
      } else {
        return next(new ErrorHandler(404, "User not find"));
      }
    } catch (err: any) {
      return next(new ErrorHandler(400, err.message));
    }
  }
);

//update user password
interface IPassBody {
  oldPassword: string;
  newPassword: string;
}

export const updatePassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword } = req.body as IPassBody;
    const id = req.user?._id;
    try {
      const user = await User.findById(id).select("+password");
      if (user) {
        if (user.password !== undefined) {
          const isMatch = await user?.comparePassword(oldPassword);
          if (isMatch && newPassword) {
            user.password = newPassword;
            await user.save();
            await redis.set(id!, JSON.stringify(user));
            res.status(201).json({
              success: true,
              user,
              message: "Password updated successfully",
            });
          } else {
            return next(new ErrorHandler(400, "Incorrect password"));
          }
        } else {
          return next(new ErrorHandler(400, "Invalid User"));
        }
      } else {
        return next(new ErrorHandler(404, "User is not found"));
      }
    } catch (err: any) {
      return next(new ErrorHandler(400, err.message));
    }
  }
);

interface IProfilePicBody {
  avatar: string;
}
export const updateProfilePicture = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { avatar } = req.body as IProfilePicBody;
    const id = req.user?._id;
    console.log(`${id} is id`);
    try {
      const user = await User.findById(id);
      if (user) {
        if (user?.avatar?.public_id) {
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
        }

        console.log("Before uploading to Cloudinary");
        const mycloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
          width: 150,
        });
        console.log("After uploading to Cloudinary");

        user.avatar = {
          public_id: mycloud.public_id,
          url: mycloud.secure_url,
        };

        await user.save();
        await redis.set(id!, JSON.stringify(user));
        res.status(200).json({
          success: true,
          user,
        });
      } else {
        return next(new ErrorHandler(404, "user not found"));
      }
    } catch (err: any) {
      return next(new ErrorHandler(400, err.message));
    }
  }
);

export const getAllUsers = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        users,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

export const updateUserRole = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { role } = req.body;
    try {
      if (role === "admin")
        return next(
          new ErrorHandler(400, "You are not authorized to access this role")
        );
      const user = await User.findById(req.user?._id);
      if (!user) return next(new ErrorHandler(404, "User is not found"));
      user.role = role;
      await user.save();
      res.status(200).json({
        success: true,
        user,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

//delete user --- only admin

export const deleteUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const user = await User.deleteOne({ _id: id });
      if (!user) return next(new ErrorHandler(404, "User is not found"));
      res.status(201).json({
        success: true,
        message: "User is deleted Successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);
