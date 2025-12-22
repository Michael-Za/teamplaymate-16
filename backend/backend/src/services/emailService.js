import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.templatesDir = join(__dirname, '../templates/emails');
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html || await this.renderTemplate(options.template, options.context),
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async renderTemplate(templateName, context = {}) {
    try {
      const templatePath = join(this.templatesDir, `${templateName}.html`);
      let template = await fs.promises.readFile(templatePath, 'utf8');

      // Simple template rendering (replace {{variable}} with context values)
      Object.keys(context).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, context[key] || '');
      });

      return template;
    } catch (error) {
      console.error('Error rendering template:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(to, context) {
    return await this.sendEmail({
      to,
      subject: 'Welcome to TeamPlayMate!',
      template: 'welcome',
      context,
    });
  }

  async sendPasswordResetEmail(to, context) {
    return await this.sendEmail({
      to,
      subject: 'Password Reset Request',
      template: 'passwordReset',
      context,
    });
  }

  async sendEmailVerificationEmail(to, context) {
    return await this.sendEmail({
      to,
      subject: 'Verify Your Email Address',
      template: 'emailVerification',
      context,
    });
  }

  async sendTeamInvitationEmail(to, context) {
    return await this.sendEmail({
      to,
      subject: 'Team Invitation',
      template: 'teamInvitation',
      context,
    });
  }

  async sendMatchNotificationEmail(to, context) {
    return await this.sendEmail({
      to,
      subject: 'Match Notification',
      template: 'matchNotification',
      context,
    });
  }

  async sendTrainingSessionEmail(to, context) {
    return await this.sendEmail({
      to,
      subject: 'Training Session Reminder',
      template: 'trainingSession',
      context,
    });
  }
}

export default new EmailService();
