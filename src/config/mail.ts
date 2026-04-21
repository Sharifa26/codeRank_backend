import nodemailer from "nodemailer";
import env from "./env";

export const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const verifyMailer = async () => {
  if (process.env.NODE_ENV === "development") return;
  await mailTransporter.verify();
};
