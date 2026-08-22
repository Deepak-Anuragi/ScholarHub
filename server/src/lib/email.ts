import nodemailer from "nodemailer";

const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

export async function sendSeatAlertEmail(
  to: string,
  studentName: string,
  libraryName: string,
  libraryLink: string
): Promise<void> {
  if (!transporter) {
    console.warn("[email] SMTP not configured — skipping seat alert email.");
    return;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER!;
  const clientUrl = (process.env.CLIENT_URL ?? "http://localhost:3000").split(",")[0].trim();

  await transporter.sendMail({
    from,
    to,
    subject: `Seat available at ${libraryName}`,
    text: `Hi ${studentName},\n\nA seat opened at ${libraryName}. You have 2 hours to book.\n\nBook now: ${clientUrl}${libraryLink}\n\n— Scholar's Hub`,
    html: `<p>Hi ${studentName},</p><p>A seat opened at <strong>${libraryName}</strong>. You have <strong>2 hours</strong> to book.</p><p><a href="${clientUrl}${libraryLink}">Book now</a></p><p>— Scholar's Hub</p>`,
  });
}
