import nodemailer from "nodemailer";
import logger from "../config/logger.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const recipient = process.env.SMTP_USER || to;
    const info = await transporter.sendMail({
      from: `"AI Learning Platform" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject: `${subject} (Originally intended for: ${to})`,
      html,
    });

    logger.info(`Email redirected and sent to ${recipient} (originally intended for ${to}): ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Email send failure to ${to}: ${error.message}`);
    throw error;
  }
};