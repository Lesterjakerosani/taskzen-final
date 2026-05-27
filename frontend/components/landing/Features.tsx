"use client";
import { motion } from "framer-motion";

const features = [
  {
    num: "01",
    title: "AI Tutor, Always On",
    description: "Ask anything, anytime. Your personal AI tutor explains complex topics, creates study plans, and adapts to your learning pace — 24/7.",
  },
  {
    num: "02",
    title: "Pomodoro Focus Timer",
    description: "Scientifically proven study intervals keep you in deep focus. Smart break reminders prevent burnout and maintain consistent output.",
  },
  {
    num: "03",
    title: "Learning Analytics",
    description: "Track your study patterns, streaks, and focus time with detailed charts. Understand how you learn best and continuously improve.",
  },
  {
    num: "04",
    title: "Daily AI Motivation",
    description: "Start every session with a personalized AI-generated quote tailored to your goals — keeping you driven and mentally sharp.",
  },
  {
    num: "05",
    title: "Customizable Timer",
    description: "Tailor your timer to fit your workflow — set custom focus durations, break intervals, and session goals so every study session works exactly the way you need it.",
  },
  {
    num: "06",
    title: "Deep Focus Mode",
    description: "Eliminate every distraction with an immersive full-screen overlay. Just you, the timer, and your next breakthrough.",
  },
];

export function Features() {
  return (
    <section id="features" className="section-white py-28">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="label-xs mb-4">What&apos;s inside</p>
            <h2 className="heading-display text-3xl sm:text-4xl lg:text-5xl leading-tight">
              Built for serious<br />
              <em className="not-italic italic">students</em>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-sm font-light max-w-xs leading-relaxed sm:text-right"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            Every feature is designed around one goal — help you focus longer and learn faster.
          </motion.p>
        </div>

        <div className="border-t border-border">
          {features.map((feature, i) => (
            <motion.div
              key={feature.num}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group grid grid-cols-[3rem_1fr] sm:grid-cols-[4rem_1fr_1fr] items-start gap-6 sm:gap-12 py-7 border-b border-border hover:bg-accent/50 transition-colors duration-200 -mx-3 px-3"
            >
              <span
                className="text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors duration-200 pt-0.5 tabular-nums"
                style={{ fontSize: "0.68rem", fontFamily: "Arial, sans-serif", letterSpacing: "0.08em" }}
              >
                {feature.num}
              </span>
              <h3
                className="text-card-foreground font-medium text-sm sm:text-base"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                {feature.title}
              </h3>
              <p
                className="hidden sm:block text-muted-foreground text-sm font-light leading-relaxed"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
