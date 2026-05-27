"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeLogo } from "@/components/ThemeLogo";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-card border-b border-border shadow-[0_1px_8px_rgba(0,0,0,0.04)]" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <ThemeLogo className="w-7 h-7 object-contain" />
            <span className="font-bold text-foreground text-sm tracking-wide" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              TaskZen
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="label-xs hover:text-foreground transition-colors duration-200">
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="label-xs hover:text-foreground transition-colors duration-200">
              Sign in
            </Link>
            <Link href="/signup" className="btn-luxury text-[0.65rem] py-2.5 px-5">
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed top-16 left-0 right-0 z-40 bg-card border-b border-border shadow-md"
          >
            <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="label-xs hover:text-foreground transition-colors py-1"
                >
                  {link.label}
                </a>
              ))}
              <div className="divider-h mt-2" />
              <div className="flex items-center justify-between">
                <Link href="/login" className="label-xs hover:text-foreground transition-colors py-1" onClick={() => setMobileOpen(false)}>
                  Sign in
                </Link>
                <ThemeToggle />
              </div>
              <Link href="/signup" className="btn-luxury text-center text-[0.65rem]" onClick={() => setMobileOpen(false)}>
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
