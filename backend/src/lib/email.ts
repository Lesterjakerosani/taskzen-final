import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `TaskZen <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`;

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
  const { error } = await resend.emails.send({
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
  if (error) throw new Error(error.message);
}

export async function sendResetPasswordEmail(
  to: string,
  username: string,
  otp: string
): Promise<void> {
  const { error } = await resend.emails.send({
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
  if (error) throw new Error(error.message);
}
