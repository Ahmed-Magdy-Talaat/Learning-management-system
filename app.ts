import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
const app = express();
import cookieParser from "cookie-parser";
import errorsHandling from "./middleware/errors";

app.use(express.json({ limit: "30mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.origins,
  })
);

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    message: "success",
  });
});
export default app;
