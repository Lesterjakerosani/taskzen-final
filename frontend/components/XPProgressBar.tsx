"use client";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { getLevelInfo } from "@/store/useFocusGame";
import { cn } from "@/lib/utils";

interface XPProgressBarProps {
  xp: number;
  className?: string;
  compact?: boolean;
}

export function XPProgressBar({ xp, className, compact = false }: XPProgressBarProps) {
  const { current, next, xpInLevel, xpToNext, progress } = getLevelInfo(xp);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] font-bold text-primary">Lv.{current.level}</span>
        </div>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
          />
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Zap className="h-2.5 w-2.5 text-primary" />
          <span className="text-[10px] font-semibold text-foreground">{xp}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
            <Zap className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-bold text-foreground">Lv.{current.level} — {current.name}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {next ? `${xpInLevel}/${xpToNext} XP` : "Max Level"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
        />
      </div>
      {next && (
        <p className="text-[10px] text-muted-foreground text-right">
          {xpToNext - xpInLevel} XP to {next.name}
        </p>
      )}
    </div>
  );
}
