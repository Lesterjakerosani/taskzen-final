import { Router, Request, Response, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { requireAuth, h } from "../middleware/auth";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter";
import { generateOtp, getOtpExpiry, isOtpExpired } from "../lib/otp";
import { sendVerificationEmail, sendResetPasswordEmail } from "../lib/email";
import passport from "../lib/passport";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

function issueJwt(res: Response, user: { id: string; email: string; username: string }, rememberMe = false) {
  const token = signToken({ userId: user.id, email: user.email, username: user.username }, rememberMe);
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  });
  return token;
}

// ── Google OAuth ──────────────────────────────────────────────────────────────

router.get("/google", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["email", "profile"],
    prompt: "select_account",
    access_type: "offline",
  } as object)(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login?error=google_failed`,
    session: false,
  }),
  (req: Request, res: Response): void => {
    const user = req.user as { id: string; email: string; username: string };
    res.clearCookie("token");
    issueJwt(res, user);
    res.redirect(`${FRONTEND_URL}/dashboard`);
  }
);

// ── Register ──────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post("/register", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body as {
    username?: string; email?: string; password?: string;
  };

  if (!username?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: "Username, email, and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    // If account exists but is unverified, resend OTP so they can complete verification
    if (!existing.isVerified) {
      const otp = generateOtp();
      await prisma.user.update({
        where: { id: existing.id },
        data: { verificationOtp: otp, verificationOtpExpiry: getOtpExpiry(10) },
      });
      sendVerificationEmail(existing.email, existing.username, otp).catch(err =>
        console.error("[Auth] Failed to send verification email:", err)
      );
      res.status(200).json({
        message: "Account already registered. A new verification code has been sent.",
        email: existing.email,
      });
      return;
    }
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const otp = generateOtp();
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      isVerified: false,
      verificationOtp: otp,
      verificationOtpExpiry: getOtpExpiry(10),
    },
  });

  try {
    await sendVerificationEmail(user.email, user.username, otp);
  } catch (err) {
    console.error("[Auth] Email send failed:", err);
    // Account created but email failed — delete it so they can retry cleanly
    await prisma.user.delete({ where: { id: user.id } });
    res.status(500).json({ error: "Account created but we couldn't send the verification email. Please try again or check your email address." });
    return;
  }

  res.status(201).json({
    message: "Account created. Please check your email for a 6-digit verification code.",
    email: user.email,
  });
});

// ── Verify Email ──────────────────────────────────────────────────────────────

// POST /api/auth/verify-email
router.post("/verify-email", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body as { email?: string; otp?: string };

  if (!email?.trim() || !otp?.trim()) {
    res.status(400).json({ error: "Email and OTP are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  if (user.isVerified) {
    res.status(400).json({ error: "This account is already verified" });
    return;
  }
  if (user.verificationOtp !== otp.trim()) {
    res.status(400).json({ error: "Invalid verification code" });
    return;
  }
  if (isOtpExpired(user.verificationOtpExpiry)) {
    res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    return;
  }

  const verified = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationOtp: null,
      verificationOtpExpiry: null,
    },
  });

  issueJwt(res, verified);
  res.json({ user: { id: verified.id, username: verified.username, email: verified.email } });
});

// ── Resend Verification OTP ───────────────────────────────────────────────────

// POST /api/auth/resend-verification
router.post("/resend-verification", otpLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };

  if (!email?.trim()) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    // Generic message to prevent user enumeration
    res.json({ message: "If an unverified account exists for this email, a new code has been sent." });
    return;
  }
  if (user.isVerified) {
    res.status(400).json({ error: "This account is already verified" });
    return;
  }

  const otp = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationOtp: otp, verificationOtpExpiry: getOtpExpiry(10) },
  });

  sendVerificationEmail(user.email, user.username, otp).catch(err =>
    console.error("[Auth] Failed to resend verification email:", err)
  );

  res.json({ message: "A new verification code has been sent to your email." });
});

// ── Login ─────────────────────────────────────────────────────────────────────

// POST /api/auth/login
router.post("/login", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email, password, rememberMe } = req.body as {
    email?: string; password?: string; rememberMe?: boolean;
  };

  if (!email?.trim() || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  if (!user.password) {
    res.status(401).json({ error: "This account uses Google sign-in. Please use the Google button." });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.isVerified) {
    res.status(403).json({
      error: "Please verify your email before logging in.",
      code: "EMAIL_NOT_VERIFIED",
      email: user.email,
    });
    return;
  }

  issueJwt(res, user, rememberMe);
  res.json({ user: { id: user.id, username: user.username, email: user.email } });
});

// ── Forgot Password ───────────────────────────────────────────────────────────

// POST /api/auth/forgot-password
router.post("/forgot-password", otpLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };

  if (!email?.trim()) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Always return success to prevent user enumeration
  if (!user || !user.password) {
    res.json({ message: "If an account exists for this email, a reset code has been sent." });
    return;
  }

  const otp = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordOtp: otp, resetPasswordOtpExpiry: getOtpExpiry(10) },
  });

  sendResetPasswordEmail(user.email, user.username, otp).catch(err =>
    console.error("[Auth] Failed to send reset email:", err)
  );

  res.json({ message: "If an account exists for this email, a reset code has been sent." });
});

// ── Reset Password ────────────────────────────────────────────────────────────

// POST /api/auth/reset-password
router.post("/reset-password", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email, otp, newPassword } = req.body as {
    email?: string; otp?: string; newPassword?: string;
  };

  if (!email?.trim() || !otp?.trim() || !newPassword) {
    res.status(400).json({ error: "Email, OTP, and new password are required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  if (user.resetPasswordOtp !== otp.trim()) {
    res.status(400).json({ error: "Invalid reset code" });
    return;
  }
  if (isOtpExpired(user.resetPasswordOtpExpiry)) {
    res.status(400).json({ error: "Reset code has expired. Please request a new one." });
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetPasswordOtp: null,
      resetPasswordOtpExpiry: null,
    },
  });

  res.json({ message: "Password reset successfully. You can now log in." });
});

// ── Resend Reset OTP ──────────────────────────────────────────────────────────

// POST /api/auth/resend-reset-otp
router.post("/resend-reset-otp", otpLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };

  if (!email?.trim()) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.password) {
    res.json({ message: "If an account exists for this email, a new reset code has been sent." });
    return;
  }

  const otp = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordOtp: otp, resetPasswordOtpExpiry: getOtpExpiry(10) },
  });

  sendResetPasswordEmail(user.email, user.username, otp).catch(err =>
    console.error("[Auth] Failed to resend reset email:", err)
  );

  res.json({ message: "A new reset code has been sent to your email." });
});

// ── Change Password ───────────────────────────────────────────────────────────

// POST /api/auth/change-password
router.post("/change-password", requireAuth as RequestHandler, h(async (req, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string; newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password are required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user?.password) {
    res.status(400).json({ error: "This account uses Google sign-in and has no password to change" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  res.json({ message: "Password changed successfully" });
}));

// ── Logout ────────────────────────────────────────────────────────────────────

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response): void => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  if (req.session) {
    req.session.destroy(() => res.json({ message: "Logged out" }));
  } else {
    res.json({ message: "Logged out" });
  }
});

// ── Me ────────────────────────────────────────────────────────────────────────

// GET /api/auth/me
router.get("/me", requireAuth as RequestHandler, h(async (req, res) => {
  res.json({ user: req.user });
}));

// GET /api/auth/test-email  (dev only — remove in production)
router.get("/test-email", async (_req: Request, res: Response): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || user === "your-gmail@gmail.com" || !pass || pass === "your-app-password-here") {
    res.status(400).json({
      configured: false,
      error: "EMAIL_USER / EMAIL_PASS not set in .env",
      hint: "Set EMAIL_USER=your@gmail.com and EMAIL_PASS=your-16-char-app-password in backend/.env, then restart the server.",
    });
    return;
  }
  try {
    const { sendVerificationEmail: send } = await import("../lib/email");
    await send(user, "Test", "123456");
    res.json({ configured: true, message: `Test email sent to ${user}` });
  } catch (err) {
    res.status(500).json({ configured: false, error: String(err) });
  }
});

export default router;
