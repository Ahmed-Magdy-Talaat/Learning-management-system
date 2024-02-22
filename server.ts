import app from "./app";
import connectDB from "./utils/db";
import userRouter from "./routes/user.routes";
import courseRouter from "./routes/course.routes";
import orderRouter from "./routes/order.routes";
import notificationRouter from "./routes/notification.routes";
import analyticsRouter from "./routes/analytics.routes";
import layoutRouter from "./routes/layout.routes";

import { v2 as cloudinary } from "cloudinary";
require("dotenv").config();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});
const Port = process.env.PORT || 6000;

app.use("/api/v1/", userRouter);
app.use("/api/v1/", courseRouter);
app.use("/api/v1/", orderRouter);
app.use("/api/v1/", notificationRouter);
app.use("/api/v1/", analyticsRouter);
app.use("/api/v1/", layoutRouter);

//
app.listen(Port, () => {
  connectDB();
  console.log(`listening on port ${Port}`);
});
