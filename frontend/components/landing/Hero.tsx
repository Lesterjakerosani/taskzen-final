"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Brain } from "lucide-react";

export function Hero() {
  return (
    <section
      id="hero"
      className="section-linen relative flex flex-col justify-center overflow-hidden pt-20"
    >
      {/* Large ghost letter */}
      <div
        className="pointer-events-none absolute -right-8 bottom-0 select-none text-border leading-none"
        style={{ fontSize: "40vw", fontFamily: "Arial, sans-serif", fontWeight: 700, opacity: 0.04, lineHeight: 1 }}
        aria-hidden
      >
        F
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 w-full">
        <div className="grid lg:grid-cols-[1fr_300px] gap-12 lg:gap-20 items-center py-24">

          {/* Left: text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-10"
            >
              <div className="h-px w-8 bg-muted-foreground/40" />
              <span className="label-xs">AI Study Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="heading-display text-5xl sm:text-6xl lg:text-[5rem] mb-8 leading-[1.04]"
            >
              Study smarter.<br />
              Focus deeper.<br />
              <em className="not-italic italic text-muted-foreground">Score higher.</em>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="text-muted-foreground text-sm sm:text-base font-light max-w-md mb-12 leading-relaxed"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Pomodoro-structured sessions with a built-in AI tutor —
              so every minute you study actually counts.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.26 }}
              className="flex items-center gap-7"
            >
              <Link href="/signup" className="btn-luxury group">
                Start for free
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200"
                style={{ fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "Arial, sans-serif" }}
              >
                See features <ArrowRight className="h-2.5 w-2.5" />
              </a>
            </motion.div>
          </div>

          {/* Right: minimal timer card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <div className="bg-card border border-border p-7">
              <div className="flex items-center justify-between mb-7">
                <p className="label-xs">Session</p>
                <div className="flex gap-0.5">
                  {["Focus", "Break"].map((m, i) => (
                    <div
                      key={m}
                      className={`px-2.5 py-1 ${i === 0 ? "bg-foreground text-background" : "text-muted-foreground border border-border"}`}
                      style={{ fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Arial, sans-serif" }}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center mb-7">
                <div className="relative">
                  <svg width={140} height={140}>
                    <circle cx={70} cy={70} r={58} fill="none" className="text-border" stroke="currentColor" strokeWidth={3} />
                    <circle cx={70} cy={70} r={58} fill="none" stroke="#5B8DB8" strokeWidth={3}
                      strokeLinecap="square"
                      strokeDasharray={2 * Math.PI * 58}
                      strokeDashoffset={2 * Math.PI * 58 * 0.38}
                      transform="rotate(-90 70 70)" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-card-foreground" style={{ fontFamily: "Arial, sans-serif" }}>17:23</span>
                    <span className="label-xs mt-1">remaining</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mb-7">
                <div className="w-8 h-8 border border-border flex items-center justify-center text-muted-foreground">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                  </svg>
                </div>
                <div className="w-10 h-10 bg-foreground flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-background">
                    <rect x="6" y="4" width="4" height="16" rx="0.5" /><rect x="14" y="4" width="4" height="16" rx="0.5" />
                  </svg>
                </div>
                <div className="w-8 h-8 border border-border flex items-center justify-center text-muted-foreground">
                  <Brain className="h-3 w-3" />
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <div className="flex items-start gap-2 bg-accent border border-border px-3 py-2.5">
                  <Brain className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-muted-foreground" style={{ fontSize: "0.63rem", fontFamily: "Arial, sans-serif", lineHeight: 1.5 }}>
                    Focus on one concept at a time — break in 17 min.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
