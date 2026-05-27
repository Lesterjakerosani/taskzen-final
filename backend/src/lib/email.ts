import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// Verify SMTP connection on startup so misconfiguration is caught immediately
transporter.verify((err) => {
  if (err) {
    console.error("[Email] SMTP connection FAILED:", err.message);
    console.error("[Email] Check EMAIL_USER and EMAIL_PASS in backend/.env");
  } else {
    console.log(`[Email] SMTP ready — sending from ${process.env.EMAIL_USER}`);
  }
});

const FROM = `"TaskZen" <${process.env.EMAIL_USER}>`;

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

export async function sendVerificationEmail(
  to: string,
  username: string,
  otp: string
): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Verify your TaskZen account",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="margin-bottom:8px;">Welcome to TaskZen, ${username}!</h2>
        <p style="color:#555;">Use this code to verify your email address:</p>
        ${otpBlock(otp)}
        <p style="color:#888;font-size:13px;">
          If you didn't create a TaskZen account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendResetPasswordEmail(
  to: string,
  username: string,
  otp: string
): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Reset your TaskZen password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="margin-bottom:8px;">Password Reset</h2>
        <p style="color:#555;">Hi ${username}, use this code to reset your password:</p>
        ${otpBlock(otp)}
        <p style="color:#888;font-size:13px;">
          If you didn't request this, ignore this email — your password won't change.
        </p>
      </div>
    `,
  });
}
