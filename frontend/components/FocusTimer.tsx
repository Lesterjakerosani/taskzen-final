"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Focus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatTime, CIRCUMFERENCE, getStrokeDashoffset } from "@/lib/utils";
import type { TimerMode } from "@/types";
import { useTimerContext } from "@/context/TimerContext";

interface FocusTimerProps {
  onSessionComplete?: (sessions: number) => void;
  focusModeActive?: boolean;
  onToggleFocusMode?: () => void;
  disableKeyboard?: boolean;
}

const modeConfig = {
  "focus": { label: "Focus", color: "#5B8DB8", bgClass: "from-[#5B8DB8]/10 to-[#7BA8CC]/10" },
  "short-break": { label: "Short Break", color: "#7B9E87", bgClass: "from-[#7B9E87]/10 to-[#96B5A0]/10" },
  "long-break": { label: "Long Break", color: "#C4956A", bgClass: "from-[#C4956A]/10 to-[#D4A980]/10" },
};

export function FocusTimer({ onSessionComplete, focusModeActive, onToggleFocusMode, disableKeyboard }: FocusTimerProps) {
  const {
    mode, status, timeLeft, progress,
    completedSessions, start, pause, reset, switchMode,
  } = useTimerContext();

  const config = modeConfig[mode];

  // Keyboard shortcuts — disabled when another FocusTimer instance is already handling keys
  useEffect(() => {
    if (disableKeyboard) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (status === "running") { pause(); } else { start(); }
      }
      if (e.code === "KeyR") reset();
      if (e.code === "KeyF" && onToggleFocusMode) onToggleFocusMode();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [status, start, pause, reset, onToggleFocusMode, disableKeyboard]);

  useEffect(() => {
    if (status === "finished") onSessionComplete?.(completedSessions);
  }, [status, completedSessions, onSessionComplete]);

  const strokeDashoffset = getStrokeDashoffset(progress);
  const size = 260;
  const radius = 120;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        {/* Mode tabs */}
        <Tabs value={mode} onValueChange={(v) => switchMode(v as TimerMode)} className="mb-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="focus">Focus</TabsTrigger>
            <TabsTrigger value="short-break">Short Break</TabsTrigger>
            <TabsTrigger value="long-break">Long Break</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Timer ring */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <motion.div
              animate={status === "running" ? { scale: [1, 1.01, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <svg width={size} height={size} className="drop-shadow-xl">
                {/* Background glow */}
                <defs>
                  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={config.color} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={config.color} stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={config.color} />
                    <stop offset="100%" stopColor={config.color} />
                  </linearGradient>
                </defs>
                <circle cx={cx} cy={cy} r={radius + 20} fill="url(#glow)" />
                {/* Track */}
                <circle
                  cx={cx} cy={cy} r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-border"
                />
                {/* Progress */}
                <circle
                  cx={cx} cy={cy} r={radius}
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  className="timer-ring"
                />
              </svg>
            </motion.div>

            {/* Center display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={timeLeft}
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-bold tabular-nums tracking-tight"
                  style={{ color: config.color }}
                >
                  {formatTime(timeLeft)}
                </motion.span>
              </AnimatePresence>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                {config.label}
              </span>
              {status === "running" && (
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex items-center gap-1 mt-1"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-xs text-primary font-medium">Focusing</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={reset} className="h-10 w-10 rounded-xl">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={status === "running" ? pause : start}
                size="icon"
                className="h-14 w-14 rounded-2xl gradient-blue shadow-lg text-white"
              >
                {status === "running"
                  ? <Pause className="h-6 w-6" />
                  : <Play className="h-6 w-6 ml-0.5" />
                }
              </Button>
            </motion.div>
            <Button
              variant={focusModeActive ? "default" : "outline"}
              size="icon"
              onClick={onToggleFocusMode}
              className="h-10 w-10 rounded-xl"
            >
              <Focus className="h-4 w-4" />
            </Button>
          </div>

          {/* Session count */}
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  i < (completedSessions % 4)
                    ? "bg-primary scale-100"
                    : "bg-border scale-90"
                )}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-1">
              {completedSessions} sessions today
            </span>
          </div>

          {/* Keyboard hints */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span><kbd className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-xs">Space</kbd> Play/Pause</span>
            <span><kbd className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-xs">R</kbd> Reset</span>
            <span><kbd className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-xs">F</kbd> Focus</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
