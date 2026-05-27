import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // Always log on first use so Render logs show what's configured
  if (!user || !pass) {
    console.error(
      "[Email] MISSING CREDENTIALS — EMAIL_USER and/or EMAIL_PASS are not set in environment variables. " +
      "Emails will fail. Set these in your Render dashboard under Environment."
    );
  } else {
    console.log(`[Email] Transporter ready — user=${user}, pass=${"*".repeat(pass.length)}`);
  }

  _transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL on 465 — more reliable on cloud hosts than STARTTLS/587
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return _transporter;
}

const FROM = () => `"TaskZen" <${process.env.EMAIL_USER}>`;

function otpBlock(otp: string) {
  return `
    <div style="font-size:36px;font-weight:700;letter-spacing:12px;text-align:center;
                padding:20px;background:#f5f5f5;border-radius:8px;margin:20px 0;
                font-family:monospace;">
      ${otp}
    </div>
    <p style="text-align:center;color:#888;font-size:13px;margin:0;">
      Expires in 10 minutes
    </p>
  `;
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const transporter = getTransporter();
  console.log(`[Email] Sending "${subject}" to ${to}`);
  try {
    const info = await transporter.sendMail({ from: FROM(), to, subject, html });
    console.log(`[Email] Sent OK — messageId=${info.messageId}`);
  } catch (err: any) {
    // Log the specific SMTP error so it appears in Render logs
    console.error(`[Email] Send FAILED to ${to}:`);
    console.error(`  code=${err.code}  responseCode=${err.responseCode}`);
    console.error(`  message=${err.message}`);
    if (err.code === "EAUTH") {
      console.error(
        "[Email] AUTHENTICATION FAILED — your Gmail App Password is wrong or 2-Step Verification " +
        "is disabled on the Google account. Regenerate the App Password at " +
        "https://myaccount.google.com/apppasswords"
      );
    } else if (err.code === "ECONNECTION" || err.code === "ETIMEDOUT") {
      console.error(
        "[Email] CONNECTION FAILED — Render may be blocking outbound SMTP on port 587. " +
        "Try switching to port 465 (secure: true) or use a dedicated email service."
      );
    }
    throw err;
  }
}

export async function sendVerificationEmail(
  to: string,
  username: string,
  otp: string
): Promise<void> {
  await sendMail(
    to,
    "Verify your TaskZen account",
    `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="margin-bottom:8px;">Welcome to TaskZen, ${username}!</h2>
        <p style="color:#555;">Use this code to verify your email address:</p>
        ${otpBlock(otp)}
        <p style="color:#888;font-size:13px;">
          If you didn't create a TaskZen account, you can safely ignore this email.
        </p>
      </div>
    `
  );
}

export async function sendResetPasswordEmail(
  to: string,
  username: string,
  otp: string
): Promise<void> {
  await sendMail(
    to,
    "Reset your TaskZen password",
    `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="margin-bottom:8px;">Password Reset</h2>
        <p style="color:#555;">Hi ${username}, use this code to reset your password:</p>
        ${otpBlock(otp)}
        <p style="color:#888;font-size:13px;">
          If you didn't request this, ignore this email — your password won't change.
        </p>
      </div>
    `
  );
}
