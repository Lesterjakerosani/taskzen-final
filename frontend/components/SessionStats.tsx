"use client";
import { motion } from "framer-motion";
import { Flame, Target, TrendingUp, Clock, Zap, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatMinutes, calculateProgress } from "@/lib/utils";
import { updateTimerSettings } from "@/lib/api";
import type { UserStats } from "@/types";

interface SessionStatsProps {
  stats: UserStats;
  todaySessions?: number;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -2 }}
    className="h-full"
  >
    <Card className="overflow-hidden h-full">
      <CardContent className="p-4 h-full">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export function SessionStats({ stats, todaySessions = 0 }: SessionStatsProps) {
  const [customGoalMinutes, setCustomGoalMinutes] = useState<number>(stats.weeklyGoal);
  const [editing, setEditing] = useState(false);
  const [inputHours, setInputHours] = useState("");

  const weeklyPercent = calculateProgress(stats.weeklyProgress, customGoalMinutes);

  const startEdit = () => {
    setInputHours(String(Math.round(customGoalMinutes / 60)));
    setEditing(true);
  };

  const confirmEdit = () => {
    const hrs = parseFloat(inputHours);
    if (!isNaN(hrs) && hrs > 0) {
      const mins = Math.round(hrs * 60);
      setCustomGoalMinutes(mins);
      updateTimerSettings({ weeklyGoal: mins }).catch(console.error);
    }
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Zap}
          label="Today's Sessions"
          value={String(todaySessions || stats.todaySessions)}
          sub="focus sessions"
          color="bg-primary/10 text-primary"
          delay={0}
        />
        <StatCard
          icon={Clock}
          label="Today's Focus"
          value={formatMinutes(stats.todayMinutes)}
          sub="deep work time"
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
          delay={0.08}
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${stats.currentStreak} days`}
          sub={`Best: ${stats.longestStreak} days`}
          color="bg-orange-100 dark:bg-orange-900/30 text-orange-500"
          delay={0.16}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Sessions"
          value={String(stats.totalSessions)}
          sub={formatMinutes(stats.totalMinutes) + " total"}
          color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          delay={0.24}
        />
      </div>

      {/* Weekly goal */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Weekly Goal</span>
                {!editing && (
                  <button
                    onClick={startEdit}
                    aria-label="Edit weekly goal"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>
              {editing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={inputHours}
                    onChange={(e) => setInputHours(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") cancelEdit(); }}
                    autoFocus
                    className="w-16 text-xs border border-border bg-background text-foreground px-2 py-1 focus:outline-none focus:border-primary"
                    placeholder="hrs"
                  />
                  <span className="text-xs text-muted-foreground">hrs/week</span>
                  <button onClick={confirmEdit} aria-label="Confirm" className="text-green-500 hover:text-green-600 transition-colors">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={cancelEdit} aria-label="Cancel" className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="blue">{weeklyPercent}%</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatMinutes(stats.weeklyProgress)} / {formatMinutes(customGoalMinutes)}
                  </span>
                </div>
              )}
            </div>
            <Progress value={weeklyPercent} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-2">
              {weeklyPercent >= 100
                ? "🎉 Weekly goal achieved! Amazing work!"
                : `${formatMinutes(customGoalMinutes - stats.weeklyProgress)} remaining to reach your weekly goal`}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
