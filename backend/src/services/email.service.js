import { Resend } from 'resend';
import logger from '../config/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  logger.error('RESEND_API_KEY not set');
} else {
  logger.info('Resend Email Service Ready');
}

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to,
      subject,
      html
    });

    if (response.error) {
      logger.error(`Email error: ${response.error.message}`);
      return false;
    }

    logger.info(`Email sent: ${response.data.id}`);
    return true;
  } catch (error) {
    logger.error(`Email service error: ${error.message}`);
    return false;
  }
};