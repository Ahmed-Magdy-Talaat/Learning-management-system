import mongoose from "mongoose";

require("dotenv").config();
const connectDB = async () => {
  try {
    const mongoDBUrl = process.env.DB_URL;

    if (!mongoDBUrl) {
      throw new Error(
        "MongoDB URL is not defined in the environment variables."
      );
    }
    await mongoose
      .connect(mongoDBUrl)
      .then(() => console.log("DB is connected successfully"));
  } catch (err: any) {
    console.log(err.message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
