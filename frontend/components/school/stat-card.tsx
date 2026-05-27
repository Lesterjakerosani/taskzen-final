"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  icon: LucideIcon;
  gradient: string;
  delay?: number;
}

export function StatCard({
  title, value, change, changeType, icon: Icon, gradient, delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn("relative rounded-2xl p-6 overflow-hidden text-white shadow-md", gradient)}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/10 -translate-y-10 translate-x-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-10 -translate-x-6 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-white/70 text-sm font-medium truncate">{title}</p>
            <p className="text-3xl font-bold mt-1.5 tracking-tight leading-none">{value}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-4">
          {changeType === "up"   && <TrendingUp   className="w-4 h-4 text-green-300 shrink-0" />}
          {changeType === "down" && <TrendingDown  className="w-4 h-4 text-red-300 shrink-0" />}
          <span className={cn(
            "text-sm font-medium",
            changeType === "up"      ? "text-green-300"  :
            changeType === "down"    ? "text-red-300"    : "text-white/60"
          )}>
            {change}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
