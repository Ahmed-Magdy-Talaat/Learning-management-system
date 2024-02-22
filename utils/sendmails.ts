import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import ejs from "ejs";

interface emailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const transporter = nodemailer.createTransport({
  host: process.env.STMP_HOST,
  port: parseInt(process.env.STMP_PORT || "587"),
  service: process.env.STMP_SERVICE,
  auth: {
    user: process.env.STMP_MAIL,
    pass: process.env.STMP_PASS,
  },
});

const sendMail = async (mailOptions: emailOptions) => {
  const { email, template, subject, data } = mailOptions;

  const templatePath = path.join(__dirname, "../mails/", template);
  const templateContent = fs.readFileSync(templatePath, "utf-8");

  // rendering an ejs string (templateContent) with data
  const html: string = ejs.render(templateContent, data);
  console.log(html);

  await transporter.sendMail({
    from: process.env.Mail,
    to: email,
    subject,
    html,
  });
};

export default sendMail;
