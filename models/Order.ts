import mongoose, { Model, Schema } from "mongoose";

interface IOrder extends Document {
  userId: string;
  courseId: string;
  instructorId: string;
  payment_info: object;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: String,
      required: true,
    },
    instructorId: {
      type: String,
      required: true,
    },
    courseId: {
      type: String,
      required: true,
    },
    payment_info: {
      type: Object,
      // required:true,
    },
  },
  {
    timestamps: true,
  }
);

const Order: Model<IOrder> = mongoose.model("order", OrderSchema);
export default Order;
