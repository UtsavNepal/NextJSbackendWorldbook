type Mailer = {
  createTransport: (options: {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: { user?: string; pass?: string };
  }) => {
    sendMail: (options: {
      from?: string;
      to: string;
      subject: string;
      text?: string;
      html?: string;
    }) => Promise<unknown>;
  };
};

const load = (name: string): Mailer =>
  (require as unknown as (id: string) => Mailer)(name);

const nodemailer = load('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}
