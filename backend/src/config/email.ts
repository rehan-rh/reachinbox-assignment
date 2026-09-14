import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export const emailTransporter = nodemailer.createTransport({
  host: process.env.ETHEREAL_HOST,
  port: Number(process.env.ETHEREAL_PORT),
  secure: false,
  auth: {
    user: process.env.ETHEREAL_USER,
    pass: process.env.ETHEREAL_PASSWORD,
  },
});