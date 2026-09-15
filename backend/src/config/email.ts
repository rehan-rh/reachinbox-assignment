import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export const emailTransporter = nodemailer.createTransport({
  host: process.env.ETHEREAL_HOST,
  port: 465,
  secure: true,

  auth: {
    user: process.env.ETHEREAL_USER,
    pass: process.env.ETHEREAL_PASSWORD,
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});