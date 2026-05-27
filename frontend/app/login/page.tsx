"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, Brain } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { ThemeLogo } from "@/components/ThemeLogo";

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

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

const features = [
  "AI tutor available 24/7",
  "Pomodoro-structured sessions",
  "Learning analytics & streaks",
  "Fully private — data stays local",
];

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [user, isLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setSubmitting(true);
    try {
      await login(email.trim(), password, rememberMe);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const e = err as Error & { code?: string; email?: string };
      if (e.code === "EMAIL_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(e.email ?? email.trim())}`);
        return;
      }
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    // Clear all user-specific cached data so a different account starts fresh
    if (typeof window !== "undefined") {
      ["taskzen_profile", "taskzen_todos", "taskzen_notes", "timerSettings",
       "taskzen_weekly_goal", "focusai_session", "focusai_users", "focusai_testimonials"]
        .forEach(k => localStorage.removeItem(k));
    }
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/auth/google`;
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
            <p className="text-white/40 text-[0.6rem] tracking-[0.2em] uppercase font-sans mb-6 mt-8">
              Welcome to TaskZen
            </p>
            <h2
              className="text-white text-3xl lg:text-4xl font-bold leading-tight mb-10"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Your AI study partner<br />
              <em className="not-italic italic text-white/60">is waiting.</em>
            </h2>

            {/* Feature list */}
            <div className="space-y-3 mb-14">
              {features.map((f, i) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.07 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-1 h-1 bg-white/40 shrink-0" />
                  <span className="text-white/60 text-sm font-light" style={{ fontFamily: "Arial, sans-serif" }}>
                    {f}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Timer preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="border border-white/10 p-6 inline-flex flex-col items-center gap-4"
            >
              <svg width={90} height={90}>
                <circle cx={45} cy={45} r={38} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
                <circle cx={45} cy={45} r={38} fill="none" stroke="#5B8DB8" strokeWidth={3}
                  strokeLinecap="square"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 * 0.38}
                  transform="rotate(-90 45 45)" />
              </svg>
              <div className="absolute" style={{ marginTop: "-64px" }}>
                <div className="flex flex-col items-center">
                  <span className="text-white font-bold text-lg" style={{ fontFamily: "Arial, sans-serif" }}>17:23</span>
                  <span className="text-white/40 text-[0.55rem] tracking-[0.15em] uppercase">Focus</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-8">
                <Brain className="h-3 w-3 text-white/30" />
                <span className="text-white/40 text-xs font-light" style={{ fontFamily: "Arial, sans-serif" }}>
                  Active focus session
                </span>
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
              <span className="label-xs">Sign in</span>
            </div>
            <h1 className="heading-display text-2xl sm:text-3xl">Welcome to TaskZen</h1>
            <p className="text-muted-foreground text-sm font-light mt-2" style={{ fontFamily: "Arial, sans-serif" }}>
              Sign in to your TaskZen account
            </p>
          </div>

          {/* Social login */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 border border-border bg-card hover:bg-accent transition-colors py-2.5 text-muted-foreground hover:text-foreground"
              style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Arial, sans-serif" }}
            >
              <GoogleIcon />
              Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="label-xs">or email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="label-xs" style={{ textTransform: "none", letterSpacing: "0.04em" }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  style={{ fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Arial, sans-serif" }}
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 border-border accent-primary cursor-pointer"
              />
              <span className="label-xs" style={{ textTransform: "none", letterSpacing: "0.04em" }}>Remember me</span>
            </label>

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
                  Sign in
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 label-xs" style={{ textTransform: "none", letterSpacing: "0.04em" }}>
            New to TaskZen?{" "}
            <Link href="/signup" className="text-foreground font-semibold hover:underline transition-colors">
              Create an account
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
