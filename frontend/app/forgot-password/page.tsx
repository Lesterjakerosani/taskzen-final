"use client";
import { useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, KeyRound, RefreshCw, ArrowLeft } from "lucide-react";
import { forgotPassword, resetPassword, resendResetOtp } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");

  // Step 1
  const [email, setEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Step 2
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [success, setSuccess] = useState(false);

  // Resend
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = () => {
    setCountdown(60);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(countdownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setStep("reset");
      startCountdown();
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string, refs: (HTMLInputElement | null)[]) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) refs[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent, refs: (HTMLInputElement | null)[]) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) refs[index - 1]?.focus();
  };

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setResetError("");
    const code = otp.join("");
    if (code.length !== 6) { setResetError("Please enter the full 6-digit code."); return; }
    if (newPassword.length < 6) { setResetError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setResetError("Passwords do not match."); return; }
    setResetSubmitting(true);
    try {
      await resetPassword(email.trim(), code, newPassword);
      setSuccess(true);
      setTimeout(() => router.replace("/login"), 2500);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : "Reset failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resendStatus === "sending") return;
    setResendStatus("sending");
    try {
      await resendResetOtp(email.trim());
      setResendStatus("sent");
      startCountdown();
      setTimeout(() => setResendStatus("idle"), 5000);
    } catch (err: unknown) {
      setResendStatus("idle");
      setResetError(err instanceof Error ? err.message : "Failed to resend. Please try again.");
    }
  };

  const variants = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  };

  return (
    <div className="min-h-screen section-linen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Back to login */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <motion.div
              key="email"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-2xl font-bold text-center mb-2">Forgot password?</h1>
              <p className="text-muted-foreground text-center text-sm mb-8">
                Enter your email and we&apos;ll send you a reset code.
              </p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Email address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>

                {emailError && (
                  <p className="text-destructive text-sm">{emailError}</p>
                )}

                <Button
                  type="submit"
                  disabled={emailSubmitting}
                  className="w-full gradient-blue text-white h-11"
                >
                  {emailSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Code"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}

          {/* ── Step 2: OTP + New Password ── */}
          {step === "reset" && !success && (
            <motion.div
              key="reset"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-2xl font-bold text-center mb-2">Enter reset code</h1>
              <p className="text-muted-foreground text-center text-sm mb-1">
                We sent a 6-digit code to
              </p>
              <p className="text-center font-medium text-sm mb-6">{email}</p>

              <form onSubmit={handleResetSubmit} className="space-y-5">
                {/* OTP */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Verification code</label>
                  <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                      <Input
                        key={i}
                        ref={el => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value, inputRefs.current)}
                        onKeyDown={e => handleOtpKeyDown(i, e, inputRefs.current)}
                        className="w-11 h-13 text-center text-xl font-bold"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">New password</label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Confirm new password</label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {resetError && (
                  <p className="text-destructive text-sm">{resetError}</p>
                )}

                <Button
                  type="submit"
                  disabled={resetSubmitting || otp.join("").length !== 6}
                  className="w-full gradient-blue text-white h-11"
                >
                  {resetSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                </Button>
              </form>

              {/* Resend */}
              <div className="mt-5 text-center">
                {resendStatus === "sent" ? (
                  <p className="text-sm text-green-600">New code sent!</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0 || resendStatus === "sending"}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1.5 mx-auto"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${resendStatus === "sending" ? "animate-spin" : ""}`} />
                    {countdown > 0 ? `Resend in ${countdown}s` : resendStatus === "sending" ? "Sending..." : "Resend code"}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Success ── */}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Password reset!</h2>
              <p className="text-muted-foreground text-sm">Redirecting you to login...</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
