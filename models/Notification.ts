import mongoose, { Schema, Model } from "mongoose";

export interface INotification extends Document {
  title: string;
  userId: string;
  message: string;
  status: string;
}
const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
  },
  {
    timestamps: true,
  }
);

const Notification: Model<INotification> = mongoose.model(
  "notification",
  notificationSchema
);
export default Notification;
