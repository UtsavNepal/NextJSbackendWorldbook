import nodemailer from 'nodemailer';
import { ERRORS } from '@/constants/errors';

type MailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

function smtpPassword() {
  return (process.env.SMTP_PASS || '').replace(/\s/g, '');
}

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = smtpPassword();
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';

  if (host.includes('gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

export async function sendMail({ to, subject, text, html }: MailOptions) {
  if (!process.env.SMTP_USER || !smtpPassword()) {
    throw new Error(ERRORS.email.notConfigured);
  }
  try {
    return await getTransporter().sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('sendMail failed', error);
    throw new Error(ERRORS.email.sendFailed);
  }
}
