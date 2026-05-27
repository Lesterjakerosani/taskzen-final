import crypto from "crypto";

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function getOtpExpiry(minutes = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isOtpExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return new Date() > expiry;
}
