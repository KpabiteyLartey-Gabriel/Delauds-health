import nodemailer from "nodemailer";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim() ?? "587";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "").trim();

  if (!host || !user || !pass) {
    throw new Error(
      "Password reset email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.",
    );
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("SMTP_PORT must be a valid positive number.");
  }

  const secure =
    process.env.SMTP_SECURE?.trim().toLowerCase() === "true" || port === 465;

  return { host, port, secure, user, pass };
}

export async function sendClientPasswordResetEmail(input: {
  toEmail: string;
  fullName?: string;
  resetLink: string;
}) {
  const cfg = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  const from = process.env.SMTP_FROM_EMAIL?.trim() || `Waterhouse Lodge <${cfg.user}>`;

  const greeting = input.fullName?.trim() || "Guest";
  const text = [
    `Hello ${greeting},`,
    "",
    "You requested a password reset for your Waterhouse Lodge account.",
    "",
    "Use the link below to reset your password:",
    input.resetLink,
    "",
    "This link expires in 5 minutes and can only be used once.",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  await transporter.sendMail({
    from,
    to: input.toEmail,
    subject: "Reset your Waterhouse Lodge password",
    text,
  });
}
