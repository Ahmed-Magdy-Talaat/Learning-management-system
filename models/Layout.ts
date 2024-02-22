import mongoose, { Schema, model, Document } from "mongoose";

interface IFaqItem extends Document {
  question: string;
  answer: string;
}

interface ICategory extends Document {
  title: string;
}

interface IBannerImage extends Document {
  public_id: string;
  url: string;
}

interface ILayout extends Document {
  type: string;
  faq: IFaqItem[];
  categories: ICategory[];
  banner: {
    title: string;
    subtitle: string;
    image: IBannerImage;
  };
}

const faqSchema = new Schema<IFaqItem>({ question: String, answer: String });

const categorySchema = new Schema<ICategory>({ title: String });

const bannerImageSchema = new Schema<IBannerImage>({
  public_id: {
    type: String,
  },
  url: {
    type: String,
  },
});

const layoutSchema = new Schema<ILayout>({
  type: String,
  faq: [faqSchema],
  categories: [categorySchema],
  banner: {
    image: bannerImageSchema,
    title: String,
    subtitle: String,
  },
});

const Layout = model<ILayout>("layout", layoutSchema);

export default Layout;
