import mongoose, { Model, Schema } from "mongoose";
import { IUser } from "./User";
interface IComment extends Document {
  user: IUser;
  comment: string;
  commentReplies: IComment[];
}

interface IQuestion extends Document {
  user: IUser;
  question: string;
  questionReplies: IQuestion[];
}

interface IReview extends Document {
  user: IUser;
  rating: number;
  comment: string;
  commentReplies: IComment[];
}

interface ILink extends Document {
  title: string;
  url: string;
}

interface ICourseData extends Document {
  title: string;
  description: string;
  questions: IQuestion[];
  videoUrl: string;
  videoThumbnail: object;
  videoLength: number;
  videoSection: string;
  videoPlayer: string;
  link: ILink[];
  suggestion: string;
}

interface ICourse extends Document {
  instructor: string;
  name: string;
  description: string;
  thumbnail: object;
  price: number;
  estimatedPrice: number;
  tags: string;
  level: string;
  demoUrl: string;
  benfits: { title: string }[];
  prerequisites: string;
  reviews: IReview[];
  courseData: ICourseData[];
  ratings?: number;
  purchased: number;
}

const commentSchema = new Schema<IComment>({
  user: Object,
  comment: String,
  commentReplies: [
    {
      type: Object,
      default: [],
    },
  ],
});

const questionSchema = new Schema<IQuestion>({
  user: Object,
  question: String,
  questionReplies: [Object],
});
const reviewSchema = new Schema<IReview>({
  user: Object,
  rating: {
    type: Number,
    default: 0,
  },
  comment: String,
  commentReplies: [
    {
      type: Object,
      default: [],
    },
  ],
});

const linkSchema = new Schema<ILink>({
  title: { type: String, default: "" },
  url: {
    type: String,
    default: "",
  },
});

const courseDataSchema = new Schema<ICourseData>({
  title: String,
  description: String,
  questions: [questionSchema],
  videoUrl: String,
  videoThumbnail: Object,
  videoLength: Number,
  videoSection: String,
  videoPlayer: String,
  links: [linkSchema],
  suggestion: String,
});

const courseSchema = new Schema<ICourse>(
  {
    instructor: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnail: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    price: {
      type: Number,
      required: true,
    },
    estimatedPrice: Number,
    tags: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    demoUrl: {
      type: String,
      required: true,
    },
    benfits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
      type: Number,
      default: 0,
    },
    purchased: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Course: Model<ICourse> = mongoose.model("Course", courseSchema);
export default Course;
