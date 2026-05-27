import rateLimit from "express-rate-limit";

// General auth endpoints (login, register): 10 attempts per 15 min
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait 15 minutes before trying again." },
});

// OTP send/resend: 3 emails per 5 min per IP
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP requests. Please wait a few minutes before trying again." },
});
