import mongoose, { Document, Schema, Model } from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

require("dotenv").config();

const emailRgx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
const passRgx =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ _id: string }>;
  comparePassword: (enteredPass: string) => Promise<boolean>;
  SignAcessToken: () => string;
  SignRefreshToken: () => string;
}

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      validate: {
        validator: function (value: string) {
          return emailRgx.test(value);
        },
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      select: false,
      min: [8, "password must be at least 8 chracters"],
      validate: {
        validator: function (value: string) {
          return passRgx.test(value);
        },
        message:
          "Password ahould contain at least one uppercase , lowercase character,number and special chracter",
      },
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        _id: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre<IUser>("save", async function (next) {
  const rounds = +process.env.rounds!;
  if (this.isModified("password")) {
    this.password = bcryptjs.hashSync(this.password || "", rounds);
  }
  next();
});

userSchema.methods.comparePassword = async function (
  enteredPass: string
): Promise<boolean> {
  console.log(this.password);
  return bcryptjs.compare(enteredPass, this.password);
};

userSchema.methods.SignAcessToken = function (): string {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN as string, {
    expiresIn: "5m",
  });
};

userSchema.methods.SignRefreshToken = function (): string {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN as string, {
    expiresIn: "3d",
  });
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
