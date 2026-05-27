import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Achievement definitions ───────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_session",   name: "First Step",      description: "Complete your first focus session",      icon: "🎯", xpReward: 25  },
  { id: "perfect_focus",   name: "Laser Focus",      description: "Finish a session with 0 distractions",  icon: "⚡", xpReward: 50  },
  { id: "early_bird",      name: "Early Bird",       description: "Study before 8:00 AM",                  icon: "🌅", xpReward: 30  },
  { id: "night_owl",       name: "Night Owl",        description: "Study after 11:00 PM",                  icon: "🦉", xpReward: 30  },
  { id: "streak_3",        name: "On Fire",          description: "3-day focus streak",                    icon: "🔥", xpReward: 40  },
  { id: "streak_7",        name: "Study Warrior",    description: "7-day focus streak",                    icon: "⚔️", xpReward: 100 },
  { id: "streak_30",       name: "Zen Master",       description: "30-day focus streak",                   icon: "🧘", xpReward: 500 },
  { id: "hours_5",         name: "Power Studier",    description: "Accumulate 5 total focus hours",        icon: "💪", xpReward: 75  },
  { id: "hours_25",        name: "Study Machine",    description: "Accumulate 25 total focus hours",       icon: "🤖", xpReward: 200 },
  { id: "sessions_10",     name: "Consistent",       description: "Complete 10 focus sessions",            icon: "📚", xpReward: 60  },
  { id: "sessions_50",     name: "Veteran",          description: "Complete 50 focus sessions",            icon: "🏆", xpReward: 250 },
  { id: "iron_focus",      name: "Iron Focus",       description: "3 perfect sessions in a row",           icon: "🛡️", xpReward: 100 },
];

// ── Level system ──────────────────────────────────────────────────────────────

export const LEVELS = [
  { level: 1, name: "Beginner",        minXp: 0     },
  { level: 2, name: "Apprentice",      minXp: 100   },
  { level: 3, name: "Focused Student", minXp: 300   },
  { level: 4, name: "Deep Worker",     minXp: 600   },
  { level: 5, name: "Focus Expert",    minXp: 1000  },
  { level: 6, name: "Study Master",    minXp: 2000  },
  { level: 7, name: "Zen Warrior",     minXp: 4000  },
  { level: 8, name: "Focus Legend",    minXp: 8000  },
];

export function getLevelInfo(xp: number) {
  let curr = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) curr = l;
  }
  const idx = LEVELS.indexOf(curr);
  const next = LEVELS[idx + 1] ?? null;
  const xpInLevel = xp - curr.minXp;
  const xpToNext = next ? next.minXp - curr.minXp : 1;
  const progress = next ? Math.min(100, (xpInLevel / xpToNext) * 100) : 100;
  return { current: curr, next, xpInLevel, xpToNext, progress };
}

// ── Focus scoring ─────────────────────────────────────────────────────────────

export function calcFocusScore(distractions: number): number {
  return Math.max(0, 100 - distractions * 10);
}

export function getFocusRank(score: number) {
  if (score >= 95) return { rank: "S", label: "Perfect",    color: "text-amber-500",  bg: "bg-amber-100 dark:bg-amber-900/30"  };
  if (score >= 80) return { rank: "A", label: "Excellent",  color: "text-green-500",  bg: "bg-green-100 dark:bg-green-900/30"  };
  if (score >= 60) return { rank: "B", label: "Good",       color: "text-blue-500",   bg: "bg-blue-100 dark:bg-blue-900/30"    };
  if (score >= 40) return { rank: "C", label: "Fair",       color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30"};
  return               { rank: "D", label: "Distracted", color: "text-gray-500",   bg: "bg-gray-100 dark:bg-gray-800"       };
}

// ── Completion data ───────────────────────────────────────────────────────────

export interface CompletionData {
  xpGained: number;
  bonusXp: number;
  focusScore: number;
  distractions: number;
  durationMinutes: number;
  newAchievements: AchievementDef[];
  leveledUp: boolean;
  newLevelName?: string;
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface FocusGameStore {
  // Persisted (also synced to DB)
  xp: number;
  unlockedIds: string[];
  totalDistractions: number;
  perfectSessions: number;

  // Session-local (reset each session)
  sessionDistractions: number;
  isSessionActive: boolean;
  warningCount: number;

  // Modals
  showWarning: boolean;
  showCompletion: boolean;
  completionData: CompletionData | null;

  // Actions
  initFromProfile: (xp: number, achievementIds: string[], distractions: number, perfects: number) => void;
  startSession: () => void;
  recordDistraction: () => void;
  finishSession: (durationMinutes: number, totalSessions: number, totalMinutes: number, streak: number) => CompletionData;
  dismissWarning: () => void;
  dismissCompletion: () => void;
}

export const useFocusGame = create<FocusGameStore>()(
  persist(
    (set, get) => ({
      xp: 0,
      unlockedIds: [],
      totalDistractions: 0,
      perfectSessions: 0,
      sessionDistractions: 0,
      isSessionActive: false,
      warningCount: 0,
      showWarning: false,
      showCompletion: false,
      completionData: null,

      initFromProfile: (xp, achievementIds, distractions, perfects) => {
        set({ xp, unlockedIds: achievementIds, totalDistractions: distractions, perfectSessions: perfects });
      },

      startSession: () => {
        set({ sessionDistractions: 0, isSessionActive: true, warningCount: 0, showWarning: false });
      },

      recordDistraction: () => {
        set((s) => ({
          sessionDistractions: s.sessionDistractions + 1,
          totalDistractions: s.totalDistractions + 1,
          warningCount: s.warningCount + 1,
          showWarning: s.isSessionActive,
        }));
      },

      finishSession: (durationMinutes, totalSessions, totalMinutes, streak) => {
        const s = get();
        const { sessionDistractions, xp, unlockedIds, perfectSessions } = s;

        const focusScore = calcFocusScore(sessionDistractions);
        const isPerfect = sessionDistractions === 0;
        const newPerfectStreak = isPerfect ? perfectSessions + 1 : 0;
        const newTotalSessions = totalSessions + 1; // DB already incremented, so use passed values
        const newTotalMinutes = totalMinutes;

        // XP calc: 2 XP per minute base
        let baseXp = Math.max(Math.round(durationMinutes * 2), 5);
        let bonusXp = 0;
        if (isPerfect) bonusXp += 25;
        if (durationMinutes >= 25) bonusXp += 15;
        if (durationMinutes >= 45) bonusXp += 20;
        if (streak >= 3) bonusXp += 10;
        if (streak >= 7) bonusXp += 20;

        // Unlock achievements
        const newAchievements: AchievementDef[] = [];
        const newUnlocked = [...unlockedIds];

        const tryUnlock = (id: string) => {
          const def = ACHIEVEMENTS.find((a) => a.id === id);
          if (def && !newUnlocked.includes(id)) {
            newUnlocked.push(id);
            newAchievements.push(def);
            bonusXp += def.xpReward;
          }
        };

        if (newTotalSessions === 1)             tryUnlock("first_session");
        if (isPerfect)                           tryUnlock("perfect_focus");
        if (new Date().getHours() < 8)           tryUnlock("early_bird");
        if (new Date().getHours() >= 23)         tryUnlock("night_owl");
        if (streak >= 3)                         tryUnlock("streak_3");
        if (streak >= 7)                         tryUnlock("streak_7");
        if (streak >= 30)                        tryUnlock("streak_30");
        if (newTotalMinutes >= 300)              tryUnlock("hours_5");
        if (newTotalMinutes >= 1500)             tryUnlock("hours_25");
        if (newTotalSessions >= 10)              tryUnlock("sessions_10");
        if (newTotalSessions >= 50)              tryUnlock("sessions_50");
        if (newPerfectStreak >= 3)               tryUnlock("iron_focus");

        const xpGained = baseXp + bonusXp;
        const newXp = xp + xpGained;
        const oldLevel = getLevelInfo(xp).current.level;
        const newLevelInfo = getLevelInfo(newXp);
        const leveledUp = newLevelInfo.current.level > oldLevel;

        const completionData: CompletionData = {
          xpGained,
          bonusXp,
          focusScore,
          distractions: sessionDistractions,
          durationMinutes,
          newAchievements,
          leveledUp,
          newLevelName: leveledUp ? newLevelInfo.current.name : undefined,
        };

        set({
          xp: newXp,
          unlockedIds: newUnlocked,
          perfectSessions: newPerfectStreak,
          isSessionActive: false,
          sessionDistractions: 0,
          showCompletion: true,
          showWarning: false,
          completionData,
        });

        return completionData;
      },

      dismissWarning: () => set({ showWarning: false }),
      dismissCompletion: () => set({ showCompletion: false, completionData: null }),
    }),
    {
      name: "taskzen-focus-game",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        return localStorage;
      }),
      partialize: (s) => ({
        xp: s.xp,
        unlockedIds: s.unlockedIds,
        totalDistractions: s.totalDistractions,
        perfectSessions: s.perfectSessions,
      }),
    }
  )
);
