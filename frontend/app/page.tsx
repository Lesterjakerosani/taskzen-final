"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { About } from "@/components/landing/About";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 bg-foreground flex items-center justify-center"
        >
          <Zap className="h-4 w-4 text-background" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <About />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
