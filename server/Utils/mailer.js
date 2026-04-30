const nodemailer = require("nodemailer");

const isMailerConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER);

const getTransporter = () => {
  if (!isMailerConfigured()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
};

const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("SMTP is not configured.");
  }

  const fromName = process.env.EMAIL_FROM_NAME || "AutoCore";
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;

  return transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text,
  });
};

module.exports = {
  isMailerConfigured,
  sendMail,
};
