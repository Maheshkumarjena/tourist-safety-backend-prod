import nodemailer from 'nodemailer';
import { config } from '@/config/env';
import { logger } from '@/config/logger';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
}

export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

/**
 * Create email transporter
 */
const createTransporter = () => {
    if (!config.emailHost || !config.emailUser || !config.emailPass) {
        logger.warn('Email configuration not complete. Emails will not be sent.');
        return null;
    }

    return nodemailer.createTransporter({
        host: config.emailHost,
        port: config.emailPort,
        secure: config.emailPort === 465,
        auth: {
            user: config.emailUser,
            pass: config.emailPass,
        },
    });
};

/**
 * Send email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    const transporter = createTransporter();

    if (!transporter) {
        logger.warn('Email transporter not available. Skipping email send.');
        return false;
    }

    try {
        const mailOptions = {
            from: options.from || `"Tourist Safety" <${config.emailUser}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''),
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        logger.error('Email sending failed:', error);
        return false;
    }
};

/**
 * Send OTP email
 */
export const sendOTPEmail = async (email: string, otp: string, name: string = 'User'): Promise<boolean> => {
    const subject = 'Your Verification OTP - Tourist Safety';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .otp { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Tourist Safety</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Your verification code is:</p>
          <div class="otp">${otp}</div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Tourist Safety. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({ to: email, subject, html });
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
    const subject = 'Welcome to Tourist Safety!';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Tourist Safety!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Thank you for joining Tourist Safety. We're committed to keeping you safe during your travels.</p>
          <p>With our app, you can:</p>
          <ul>
            <li>Share your itinerary with trusted contacts</li>
            <li>Get real-time safety alerts</li>
            <li>Quickly send SOS messages in emergencies</li>
            <li>Access local emergency services</li>
          </ul>
          <p>Stay safe and enjoy your journey!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Tourist Safety. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({ to: email, subject, html });
};

/**
 * Send emergency alert email
 */
export const sendEmergencyAlertEmail = async (
    email: string,
    name: string,
    alertData: any
): Promise<boolean> => {
    const subject = 'EMERGENCY ALERT: Tourist Safety Alert';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .alert-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EMERGENCY ALERT</h1>
        </div>
        <div class="content">
          <h2>Emergency Alert for ${name}</h2>
          <div class="alert-info">
            <p><strong>Alert Type:</strong> ${alertData.type}</p>
            <p><strong>Time:</strong> ${new Date(alertData.timestamp).toLocaleString()}</p>
            <p><strong>Location:</strong> ${alertData.coordinates ? `${alertData.coordinates.latitude}, ${alertData.coordinates.longitude}` : 'Unknown'}</p>
            ${alertData.message ? `<p><strong>Message:</strong> ${alertData.message}</p>` : ''}
          </div>
          <p>This is an automated emergency alert from the Tourist Safety system.</p>
          <p>Please take appropriate action and contact local authorities if necessary.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Tourist Safety. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({ to: email, subject, html });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string, resetToken: string, name: string): Promise<boolean> => {
    const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request - Tourist Safety';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Tourist Safety. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({ to: email, subject, html });
};