import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import catchAsyncError from "../middleware/catchAsyncErrors";
import cloudinary from "cloudinary";
import Layout from "../models/Layout";
// create layout
export const createLayout = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;

      const isTypeExist = await Layout.find({ type });
      console.log(isTypeExist);
      if (isTypeExist.length)
        return next(new ErrorHandler(400, "this type is already exist"));
      if (type == "Banner") {
        const { image, subtitle, title } = req.body;
        const mycloud = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });

        const banner = {
          image: {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
          },
          subtitle,
          title,
        };
        await Layout.create({ type: "banner", banner });
      }

      if (type == "FAQ") {
        const { faqs } = req.body;
        const faqsItems = await Promise.all(
          faqs.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          })
        );
        await Layout.create({ type: "FAQ", faq: faqsItems });
      }

      if (type == "Categories") {
        const { categories } = req.body;
        await Layout.create({ type: "Categories", categories });
      }
      res.status(200).json({
        success: true,
        message: "layout is created successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

export const deleteLayout = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { type } = req.body;
    try {
      const layout = await Layout.deleteOne({ type });
      res.status(201).json({
        success: true,
        message: "layout deleted successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

//Edit layout
export const editLayout = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;

      const layout = await Layout.findOne({ type });
      if (!layout)
        return next(new ErrorHandler(400, `${type} is not already exist`));
      if (type == "Banner") {
        const { image, subtitle, title } = req.body;
        if (image !== undefined)
          await cloudinary.v2.uploader.destroy(layout.banner.image?.public_id);
        const mycloud = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });

        const banner = {
          image: {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
          },
          subtitle,
          title,
        };
        await Layout.findByIdAndUpdate(layout._id, { banner });
      }

      if (type == "FAQ") {
        const { faqs } = req.body;
        const faqsItems = faqs.map((item: any) => {
          return {
            question: item.question,
            answer: item.answer,
          };
        });
        await Layout.findByIdAndUpdate(layout._id, { faq: faqsItems });
      }

      if (type == "Categories") {
        const { categories } = req.body;
        await Layout.findByIdAndUpdate(layout._id, { categories });
      }
      res.status(200).json({
        success: true,
        message: "layout is updated successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);

export const getLayout = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const layout = await Layout.findOne({ type });
      if (!layout) return next(new ErrorHandler(404, "Layout is not found"));
      res.status(200).json({
        success: true,
        layout,
      });
    } catch (err: any) {
      return next(new ErrorHandler(500, err.message));
    }
  }
);
