import nodemailer from "nodemailer";
import { Resend } from "resend";
import logger from "../config/logger.js";

// Initialize Resend client if key is present
const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your_resend_api_key_here"
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Initialize SMTP transporter if SMTP credentials are present
const transporter = (process.env.SMTP_USER && process.env.SMTP_PASS)
  ? nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  : null;

export const sendEmail = async ({ to, subject, html }) => {
  try {
    if (resend) {
      logger.info(`Sending email via Resend HTTPS API (Port 443)...`);
      const { data, error } = await resend.emails.send({
        from: "AI Learning Platform <onboarding@resend.dev>",
        to: to,
        subject: subject,
        html: html
      });

      if (error) {
        throw new Error(error.message);
      }

      logger.info(`Email sent via Resend to ${to}: ${data.id}`);
      return true;
    } else if (transporter) {
      logger.info(`Sending email via Nodemailer SMTP...`);
      const info = await transporter.sendMail({
        from: `"AI Learning Platform" <${process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        html,
      });

      logger.info(`Email sent via SMTP to ${to}: ${info.messageId}`);
      return true;
    } else {
      throw new Error("No email service configured. Please provide RESEND_API_KEY or SMTP credentials.");
    }
  } catch (error) {
    logger.error(`Email send failure to ${to}: ${error.message}`);
    throw error;
  }
};