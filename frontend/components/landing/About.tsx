"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function About() {
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/api/landing/stats`)
      .then((r) => r.json())
      .then((d) => setUserCount(d.students ?? 0))
      .catch(() => {});
  }, []);

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
    return n > 0 ? `${n}+` : "0";
  };

  const stats = [
    { value: userCount === null ? "—" : formatCount(userCount), label: "Students registered" },
    { value: "25 min", label: "Avg. focus session" },
    { value: "Free", label: "Forever" },
  ];

  return (
    <section id="about" className="section-linen py-28">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">

        <div className="flex items-center gap-3 mb-14">
          <div className="h-px w-8 bg-muted-foreground/40" />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
            className="label-xs"
          >
            Why TaskZen
          </motion.p>
        </div>

        {/* Pull quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="border-l-2 border-foreground pl-8 mb-16"
        >
          <h2 className="heading-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight max-w-3xl">
            Every student deserves a personal tutor —
            not just the ones who can afford one.
          </h2>
        </motion.div>

        {/* 3-column body text */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-8 sm:gap-12 mb-20 text-sm text-muted-foreground font-light leading-relaxed"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          <p>
            We built TaskZen because great studying isn&apos;t just about hours put in —
            it&apos;s about how those hours are spent. Our AI is trained to explain,
            guide, and motivate at every level.
          </p>
          <p>
            Paired with the Pomodoro technique, it doesn&apos;t just answer your
            questions — it helps you build the discipline and habits that lead to
            lasting academic success.
          </p>
          <p>
            No subscriptions, no data harvesting. Your progress stays in your
            browser. Learning is personal — we keep it that way.
          </p>
        </motion.div>

        {/* Live stats bar */}
        <div className="border-t border-border pt-10 grid grid-cols-2 sm:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className="text-2xl sm:text-3xl font-bold text-card-foreground mb-1" style={{ fontFamily: "Arial, sans-serif" }}>
                {stat.value}
              </div>
              <div className="label-xs" style={{ textTransform: "none", letterSpacing: "0.04em" }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
