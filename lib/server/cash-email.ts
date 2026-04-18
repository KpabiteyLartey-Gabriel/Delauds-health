import nodemailer from "nodemailer";

export interface CashPaymentEmailData {
  bookingId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomNumber: string | number;
  checkInDate: string;
  checkOutDate: string;
  amountReceivedGhs: number;
  cashReference: string;
  confirmedByEmail: string;
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim() ?? "587";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "").trim();

  if (!host || !user || !pass) {
    throw new Error(
      "Cash email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.",
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

function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-GH", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function sendCashPaymentConfirmationEmails(
  data: CashPaymentEmailData,
) {
  const cfg = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  const from = process.env.SMTP_FROM_EMAIL?.trim() || `Waterhouse Lodge <${cfg.user}>`;
  const adminEmail =
    process.env.ADMIN_CASH_NOTIFICATION_EMAIL?.trim() ??
    "info@waterhouseloadge.com";

  const detailLines = [
    `Booking ID: ${data.bookingId}`,
    `Cash Ref: ${data.cashReference}`,
    `Guest: ${data.guestName}`,
    `Guest Email: ${data.guestEmail}`,
    `Guest Phone: ${data.guestPhone}`,
    `Room: ${data.roomNumber}`,
    `Check-in: ${formatDate(data.checkInDate)}`,
    `Check-out: ${formatDate(data.checkOutDate)}`,
    `Amount Received: GHS ${data.amountReceivedGhs.toFixed(2)}`,
    `Confirmed by: ${data.confirmedByEmail}`,
  ].join("\n");

  const guestText = [
    "Your cash payment has been confirmed.",
    "",
    detailLines,
    "",
    "Thank you for booking with Waterhouse Lodge.",
  ].join("\n");

  const adminText = [
    "A cash payment has been confirmed.",
    "",
    detailLines,
  ].join("\n");

  await Promise.all([
    transporter.sendMail({
      from,
      to: data.guestEmail,
      subject: `Cash Payment Confirmed - ${data.cashReference}`,
      text: guestText,
    }),
    transporter.sendMail({
      from,
      to: adminEmail,
      subject: `Cash Payment Received - ${data.cashReference}`,
      text: adminText,
    }),
  ]);
}
