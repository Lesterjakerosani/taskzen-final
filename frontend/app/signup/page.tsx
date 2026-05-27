"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, Check, Brain } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { ThemeLogo } from "@/components/ThemeLogo";

interface Strength {
  score: number;
  label: string;
  color: string;
  barColor: string;
}

function getPasswordStrength(password: string): Strength {
  if (!password) return { score: 0, label: "", color: "", barColor: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const map: Strength[] = [
    { score: 0, label: "", color: "", barColor: "" },
    { score: 1, label: "Very weak", color: "#C4956A", barColor: "bg-[#C4956A]" },
    { score: 2, label: "Weak", color: "#D4A94A", barColor: "bg-[#D4A94A]" },
    { score: 3, label: "Fair", color: "#8B9E8B", barColor: "bg-[#8B9E8B]" },
    { score: 4, label: "Strong", color: "#7B9E87", barColor: "bg-[#7B9E87]" },
    { score: 5, label: "Very strong", color: "#5B8DB8", barColor: "bg-[#5B8DB8]" },
  ];
  return map[score];
}

const strengthCriteria = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "Uppercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "Number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "Special character" },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignupPage() {
  const { user, isLoading, signup } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [user, isLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) { setError("Please enter a username."); return; }
    if (username.trim().length < 2) { setError("Username must be at least 2 characters."); return; }
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (!agreedToTerms) { setError("Please agree to the Terms of Service to continue."); return; }
    setSubmitting(true);
    try {
      const { email: confirmedEmail } = await signup(username.trim(), email.trim(), password);
      router.replace(`/verify-email?email=${encodeURIComponent(confirmedEmail)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col bg-[#2C2C2C] p-12 relative overflow-hidden">
        {/* Ghost letter */}
        <div
          className="pointer-events-none absolute -right-6 -bottom-6 select-none leading-none text-white/[0.03]"
          style={{ fontSize: "32vw", fontFamily: "Arial, sans-serif", fontWeight: 700 }}
          aria-hidden
        >
          T
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 w-fit relative z-10">
          <img src="/taskzen.png" alt="TaskZen" className="w-7 h-7 object-contain" />
          <span className="font-bold text-white text-sm tracking-wide" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            TaskZen
          </span>
        </Link>

        {/* Center content */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-white/40 text-[0.6rem] tracking-[0.2em] uppercase font-sans mb-6">
              Get started free
            </p>
            <h2
              className="text-white text-3xl lg:text-4xl font-bold leading-tight mb-4"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Every student deserves<br />
              <em className="not-italic italic text-white/60">a personal tutor.</em>
            </h2>
            <p className="text-white/40 text-sm font-light leading-relaxed mb-12 max-w-xs" style={{ fontFamily: "Arial, sans-serif" }}>
              Join thousands of students using AI-powered study sessions to focus deeper and learn faster.
            </p>

            {/* AI assistant preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12 border border-white/10 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-3 w-3 text-white/30" />
                <span className="text-white/40 text-[0.6rem] tracking-[0.15em] uppercase" style={{ fontFamily: "Arial, sans-serif" }}>AI Study Assistant</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-end">
                  <div className="bg-white/10 text-white/70 px-3 py-1.5 max-w-[80%]"
                    style={{ fontSize: "0.68rem", fontFamily: "Arial, sans-serif", lineHeight: 1.5 }}>
                    Explain Newton&apos;s 2nd law simply
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="h-2.5 w-2.5 text-white/40" />
                  </div>
                  <div className="bg-white/5 border border-white/10 px-3 py-1.5 max-w-[80%] text-white/50"
                    style={{ fontSize: "0.68rem", fontFamily: "Arial, sans-serif", lineHeight: 1.5 }}>
                    Force = Mass × Acceleration. Heavier objects need more force to move.
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <Link href="/" className="text-white/30 hover:text-white/60 transition-colors text-xs font-light" style={{ fontFamily: "Arial, sans-serif" }}>
            ← Back to home
          </Link>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="min-h-screen section-linen flex flex-col items-center justify-center px-8 py-14">

        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Link href="/" className="flex items-center gap-2.5">
            <ThemeLogo className="w-7 h-7 object-contain" />
            <span className="font-bold text-foreground text-sm tracking-wide" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>TaskZen</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* Heading */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-muted-foreground/40" />
              <span className="label-xs">Create account</span>
            </div>
            <h1 className="heading-display text-2xl sm:text-3xl">Join TaskZen</h1>
            <p className="text-muted-foreground text-sm font-light mt-2" style={{ fontFamily: "Arial, sans-serif" }}>
              Start your first focus session in minutes
            </p>
          </div>

          {/* Google sign up */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  ["taskzen_profile", "taskzen_todos", "taskzen_notes", "timerSettings",
                   "taskzen_weekly_goal", "focusai_session", "focusai_users", "focusai_testimonials"]
                    .forEach(k => localStorage.removeItem(k));
                }
                window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/auth/google`;
              }}
              className="w-full flex items-center justify-center gap-2 border border-border bg-card hover:bg-accent transition-colors py-2.5 text-muted-foreground hover:text-foreground"
              style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Arial, sans-serif" }}
            >
              <GoogleIcon />
              Sign up with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="label-xs">or email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="label-xs" style={{ textTransform: "none", letterSpacing: "0.04em" }}>
                Username
              </label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                className="rounded-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="label-xs" style={{ textTransform: "none", letterSpacing: "0.04em" }}>
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-none"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="label-xs" style={{ textTransform: "none", letterSpacing: "0.04em" }}>
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10 rounded-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />}
                </button>
              </div>

              {/* Strength indicator */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-2 space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5 flex-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-0.5 flex-1 transition-all duration-300 ${i <= strength.score ? strength.barColor : "bg-border"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs shrink-0" style={{ color: strength.color, fontFamily: "Arial, sans-serif" }}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {strengthCriteria.map((c) => (
                      <div key={c.label} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 flex items-center justify-center transition-colors ${c.test(password) ? "bg-[#7B9E87]" : "bg-border"}`}>
                          {c.test(password) && <Check className="h-1.5 w-1.5 text-white" strokeWidth={3} />}
                        </div>
                        <span className={`text-xs transition-colors ${c.test(password) ? "text-muted-foreground" : "text-muted-foreground/40"}`}
                          style={{ fontFamily: "Arial, sans-serif" }}>
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="label-xs" style={{ textTransform: "none", letterSpacing: "0.04em" }}>
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`pr-10 rounded-none transition-colors ${
                    confirmPassword
                      ? confirmPassword === password
                        ? "border-[#7B9E87] focus-visible:ring-[#7B9E87]/30"
                        : "border-[#C4956A] focus-visible:ring-[#C4956A]/30"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-3.5 h-3.5 mt-0.5 border-border accent-primary cursor-pointer shrink-0"
              />
              <span className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "Arial, sans-serif" }}>
                I agree to the{" "}
                <button type="button" className="text-foreground font-medium hover:underline transition-colors" onClick={(e) => e.preventDefault()}>
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" className="text-foreground font-medium hover:underline transition-colors" onClick={(e) => e.preventDefault()}>
                  Privacy Policy
                </button>
              </span>
            </label>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 text-red-600 dark:text-red-400 text-xs"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-luxury w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 label-xs" style={{ textTransform: "none", letterSpacing: "0.04em" }}>
            Already have an account?{" "}
            <Link href="/login" className="text-foreground font-semibold hover:underline transition-colors">
              Sign in
            </Link>
          </p>

          {/* Mobile back link */}
          <div className="lg:hidden text-center mt-6">
            <Link href="/" className="label-xs hover:text-foreground transition-colors" style={{ textTransform: "none" }}>
              ← Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
