"use client";
import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, MailCheck, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { resendVerification } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const { user, isLoading, verifyEmail } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!email) router.replace("/signup");
  }, [email, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter the full 6-digit code."); return; }
    setError("");
    setSubmitting(true);
    try {
      await verifyEmail(email, code);
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resendStatus === "sending") return;
    setResendStatus("sending");
    try {
      await resendVerification(email);
      setResendStatus("sent");
      setCountdown(60);
      setTimeout(() => setResendStatus("idle"), 5000);
    } catch (err: unknown) {
      setResendStatus("idle");
      setError(err instanceof Error ? err.message : "Failed to resend. Please try again.");
    }
  };

  if (isLoading || !email) return null;

  return (
    <div className="min-h-screen section-linen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <MailCheck className="h-8 w-8 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Check your email</h1>
        <p className="text-muted-foreground text-center text-sm mb-1">
          We sent a 6-digit code to
        </p>
        <p className="text-center font-medium text-sm mb-8">{email}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP inputs */}
          <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <Input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold tracking-widest"
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={submitting || otp.join("").length !== 6}
            className="w-full gradient-blue text-white h-11"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Email"}
          </Button>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center">
          {resendStatus === "sent" ? (
            <p className="text-sm text-green-600">New code sent! Check your inbox.</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || resendStatus === "sending"}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resendStatus === "sending" ? "animate-spin" : ""}`} />
              {countdown > 0
                ? `Resend in ${countdown}s`
                : resendStatus === "sending"
                ? "Sending..."
                : "Resend code"}
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Wrong email?{" "}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Go back
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
