"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Zap, Star, Trophy, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFocusRank, getLevelInfo, type CompletionData } from "@/store/useFocusGame";
import { cn } from "@/lib/utils";

// ── Confetti ──────────────────────────────────────────────────────────────────

const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#5B8DB8"];

function Confetti() {
  const pieces = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.8 + Math.random() * 1.2,
    size: Math.random() * 8 + 5,
    rotate: Math.random() * 360,
    shape: i % 3,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className={cn("absolute top-0", p.shape === 0 ? "rounded-full" : p.shape === 1 ? "rounded-sm" : "rounded-none")}
          style={{ left: `${p.x}%`, width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ y: -20, opacity: 1, rotate: p.rotate }}
          animate={{ y: "110vh", opacity: [1, 1, 0], rotate: p.rotate + 540 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "linear" }}
        />
      ))}
    </div>
  );
}

// ── XP Counter ────────────────────────────────────────────────────────────────

function XPCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const inc = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count}</span>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface SessionCompletionModalProps {
  show: boolean;
  data: CompletionData | null;
  currentXp: number;
  onClose: () => void;
}

export function SessionCompletionModal({ show, data, currentXp, onClose }: SessionCompletionModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (show && data) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [show, data]);

  if (!data) return null;

  const rank = getFocusRank(data.focusScore);
  const prevXp = currentXp - data.xpGained;
  const levelInfo = getLevelInfo(currentXp);

  return (
    <>
      {showConfetti && <Confetti />}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.5)" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card border border-border shadow-2xl"
            >
              {/* Close */}
              <button
                aria-label="Close"
                onClick={onClose}
                className="absolute right-3 top-3 z-10 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header banner */}
              <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 text-center border-b border-border">
                <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner"
                >
                  <Trophy className="h-8 w-8 text-primary" />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground">Session Complete!</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {data.durationMinutes}m of focused work
                </p>
              </div>

              <div className="p-5 space-y-4">
                {/* XP + Score row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* XP Gained */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl bg-primary/10 p-3 text-center"
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary uppercase tracking-wide">XP Gained</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      +<XPCounter target={data.xpGained} />
                    </p>
                    {data.bonusXp > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        +{data.bonusXp} bonus XP
                      </p>
                    )}
                  </motion.div>

                  {/* Focus Score */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className={cn("rounded-xl p-3 text-center", rank.bg)}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium uppercase tracking-wide">Focus Score</span>
                    </div>
                    <p className={cn("text-3xl font-bold", rank.color)}>{rank.rank}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{data.focusScore}% — {rank.label}</p>
                  </motion.div>
                </div>

                {/* Level progress */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="rounded-xl border border-border bg-muted/30 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold">Level {levelInfo.current.level} — {levelInfo.current.name}</span>
                    </div>
                    {data.leveledUp && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.5 }}
                        className="text-[10px] font-bold text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full"
                      >
                        LEVEL UP! 🎉
                      </motion.span>
                    )}
                    {!data.leveledUp && levelInfo.next && (
                      <span className="text-[10px] text-muted-foreground">{levelInfo.xpToNext - levelInfo.xpInLevel} XP to next</span>
                    )}
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: `${getLevelInfo(prevXp).progress}%` }}
                      animate={{ width: `${levelInfo.progress}%` }}
                      transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                    />
                  </div>
                </motion.div>

                {/* Stats row */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-around text-center text-xs"
                >
                  {[
                    { label: "Duration", value: `${data.durationMinutes}m` },
                    { label: "Distractions", value: String(data.distractions) },
                    { label: "Total XP", value: String(currentXp) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="font-bold text-sm text-foreground">{value}</p>
                      <p className="text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </motion.div>

                {/* Achievements */}
                {data.newAchievements.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3"
                  >
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">
                      🏅 {data.newAchievements.length} Achievement{data.newAchievements.length > 1 ? "s" : ""} Unlocked!
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.newAchievements.map((a, i) => (
                        <motion.span
                          key={a.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.55 + i * 0.08 }}
                          className="flex items-center gap-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 px-2 py-1 text-[11px] font-medium text-amber-800 dark:text-amber-200"
                        >
                          <span>{a.icon}</span>
                          <span>{a.name}</span>
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}

                <Button onClick={onClose} className="w-full rounded-xl gradient-blue text-white h-10 font-semibold">
                  Continue
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
