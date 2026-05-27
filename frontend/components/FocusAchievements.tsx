"use client";
import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACHIEVEMENTS, getLevelInfo } from "@/store/useFocusGame";
import { XPProgressBar } from "@/components/XPProgressBar";
import { cn } from "@/lib/utils";

interface FocusAchievementsProps {
  xp: number;
  unlockedIds: string[];
}

export function FocusAchievements({ xp, unlockedIds }: FocusAchievementsProps) {
  const unlocked = unlockedIds.length;
  const total = ACHIEVEMENTS.length;
  const { current } = getLevelInfo(xp);

  return (
    <div className="space-y-4">
      {/* Level card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary border border-primary/20">
              {current.level}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Current Level</p>
              <p className="text-base font-bold text-foreground">{current.name}</p>
              <XPProgressBar xp={xp} className="mt-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement grid */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Achievements
            </div>
            <span className="text-xs font-normal text-muted-foreground">{unlocked}/{total} unlocked</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ACHIEVEMENTS.map((achievement, i) => {
              const isUnlocked = unlockedIds.includes(achievement.id);
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -2 }}
                  className={cn(
                    "relative rounded-xl border p-3 transition-all duration-200",
                    isUnlocked
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                      : "bg-muted/30 border-border opacity-60"
                  )}
                >
                  {/* Lock icon for locked */}
                  {!isUnlocked && (
                    <Lock className="absolute top-2 right-2 h-3 w-3 text-muted-foreground" />
                  )}

                  <div className="text-2xl mb-1.5">{isUnlocked ? achievement.icon : "🔒"}</div>
                  <p className={cn(
                    "text-xs font-semibold leading-tight mb-0.5",
                    isUnlocked ? "text-amber-800 dark:text-amber-200" : "text-muted-foreground"
                  )}>
                    {achievement.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {achievement.description}
                  </p>
                  {isUnlocked && (
                    <span className="mt-1.5 inline-flex items-center text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      +{achievement.xpReward} XP
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
