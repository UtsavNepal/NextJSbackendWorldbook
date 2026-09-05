import nodemailer from 'nodemailer';

type MailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMail({ to, subject, text, html }: MailOptions) {
  return getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}
