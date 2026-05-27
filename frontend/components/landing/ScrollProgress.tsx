"use client";
import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function ScrollProgress() {
  const raw = useMotionValue(0);
  const scaleX = useSpring(raw, { stiffness: 200, damping: 30 });

  useEffect(() => {
    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      raw.set(total > 0 ? window.scrollY / total : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [raw]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[1px] origin-left z-[100]"
      style={{
        scaleX,
        background: "linear-gradient(90deg, #444444, #8B8B8B)",
      }}
    />
  );
}
