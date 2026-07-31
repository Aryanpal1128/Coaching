import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || 'mock_user',
    pass: process.env.SMTP_PASS || 'mock_pass'
  }
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"AI Learning Platform" <noreply@ailearning.com>',
      to,
      subject,
      html
    };

    if (process.env.NODE_ENV === 'development' && process.env.SMTP_USER === 'mock_user') {
      logger.info(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Email send failure to ${to}: ${error.message}`);
    return false;
  }
};
