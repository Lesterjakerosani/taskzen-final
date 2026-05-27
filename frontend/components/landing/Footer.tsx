"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { ThemeLogo } from "@/components/ThemeLogo";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
    { label: "FAQ", href: "#faq" },
  ],
  Account: [
    { label: "Sign in", href: "/login" },
    { label: "Create account", href: "/signup" },
  ],
};

const socials = [
  { Icon: GithubIcon, label: "GitHub", href: "#" },
  { Icon: XIcon, label: "X", href: "#" },
  { Icon: Mail, label: "Email", href: "#" },
];

export function Footer() {
  return (
    <footer className="section-dark pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {/* CTA editorial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="border-t border-white/10 pt-14 pb-16 mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-white/20" />
            <p className="label-xs text-[#8B8B8B]">Get started today</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
            <h3
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-xl"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Your AI study partner is{" "}
              <em className="not-italic italic">ready when you are.</em>
            </h3>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#2C2C2C] hover:bg-[#F5F1EC] transition-colors duration-200 shrink-0 self-start sm:self-end"
              style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "var(--font-inter), sans-serif", fontWeight: 500 }}
            >
              Get Started Free
            </Link>
          </div>
        </motion.div>

        {/* Footer content */}
        <div className="grid sm:grid-cols-3 gap-10 mb-14">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <ThemeLogo className="w-6 h-6 object-contain" />
              <span className="font-semibold text-white text-xs tracking-wide" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                TaskZen
              </span>
            </Link>
            <p className="text-xs text-[#8B8B8B] leading-relaxed max-w-[180px] font-light" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
              AI-powered study assistant combining Pomodoro with smart analytics.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="label-xs text-[#8B8B8B] mb-5">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-xs text-[#666660] hover:text-white transition-colors duration-200 font-light"
                      style={{ fontFamily: "var(--font-inter), sans-serif" }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/8">
          <p className="text-xs text-[#555550] font-light" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
            © {new Date().getFullYear()} TaskZen. Built for students everywhere.
          </p>
          <div className="flex items-center gap-1">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="p-2 text-[#555550] hover:text-white transition-colors duration-200"
              >
                <social.Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
