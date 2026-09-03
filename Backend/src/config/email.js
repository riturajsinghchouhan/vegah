import nodemailer from 'nodemailer';
import env from './env.js';
import logger from '../utils/logger.js';

let transporter = null;

if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      logger.error(`SMTP Connection error: ${error}`);
    } else {
      logger.info('SMTP server is ready to take our messages');
    }
  });
} else {
  logger.info('Email configuration not provided. Email features will be disabled.');
}

export const sendEmail = async (options) => {
  if (!transporter) {
    logger.warn(`Email not sent (not configured). Would have sent to ${options.to}`);
    return { success: false, message: 'Email not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME || 'Vegah'}" <${env.EMAIL_FROM || env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    
    logger.info(`Message sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Error sending email to ${options.to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export default transporter;
