"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { FocusTimer } from "@/components/FocusTimer";
import { SessionStats } from "@/components/SessionStats";
import { ProductivityChart } from "@/components/ProductivityChart";
import { QuotesWidget } from "@/components/QuotesWidget";
import { BreakReminder } from "@/components/BreakReminder";
import { SettingsModal } from "@/components/SettingsModal";
import { StudyNotes } from "@/components/StudyNotes";
import { TodoList } from "@/components/TodoList";
import { ProfilePage } from "@/components/ProfilePage";
import { FocusWarningModal } from "@/components/FocusWarningModal";
import { SessionCompletionModal } from "@/components/SessionCompletionModal";
import { FocusAchievements } from "@/components/FocusAchievements";
import { XPProgressBar } from "@/components/XPProgressBar";
import { AmbientPlayer } from "@/components/AmbientPlayer";
import { ReviewerLibrary } from "@/components/ReviewerLibrary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TimerProvider, useTimerContext } from "@/context/TimerContext";
import { useAuth } from "@/context/AuthContext";
import { useTaskNotifications } from "@/hooks/useTaskNotifications";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { useFocusGame } from "@/store/useFocusGame";
import { getStats, getProfile, getTasks, saveGamification, type UserStats, type WeeklyDataPoint, type Task } from "@/lib/api";
import { cn, formatMinutes } from "@/lib/utils";
import {
  BookOpen, Zap, GraduationCap,
  Lightbulb, Calendar, CheckCircle2, BarChart3, Trophy, Library, KeyRound
} from "lucide-react";

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

const EMPTY_STATS: UserStats = {
  totalSessions: 0, totalMinutes: 0,
  currentStreak: 0, longestStreak: 0,
  todaySessions: 0, todayMinutes: 0,
  weeklyProgress: 0, weeklyGoal: 600,
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("New passwords do not match");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to change password");
      setStatus("success");
      setMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Change Password</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
            />
          </div>
          {message && (
            <p className={`text-sm ${status === "success" ? "text-green-500" : "text-destructive"}`}>
              {message}
            </p>
          )}
          <Button type="submit" disabled={status === "loading"} className="gradient-blue text-white">
            {status === "loading" ? "Saving..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DashboardOverview({ onNavigate, stats }: { onNavigate: (tab: string) => void; stats: UserStats }) {
  const quickStats = [
    { icon: Zap,         label: "Sessions Today",  value: String(stats.todaySessions),  color: "text-primary bg-primary/10" },
    { icon: Calendar,    label: "Day Streak",       value: `${stats.currentStreak}`,     color: "text-orange-500 bg-orange-100 dark:bg-orange-900/30" },
    { icon: CheckCircle2,label: "Weekly Progress",  value: `${Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)}%`, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
    { icon: BarChart3,   label: "Total Focus",      value: formatMinutes(stats.totalMinutes), color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
  ];

  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl gradient-blue p-6 text-white shadow-md"
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <Badge className="bg-white/20 text-white border-0 mb-3 text-xs">AI-Powered</Badge>
            <h1 className="text-2xl font-bold mb-1">Ready to Focus?</h1>
            <p className="text-white/80 text-sm mb-4 max-w-xs">
              Start a Pomodoro session, ask your AI assistant, or review your progress.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => onNavigate("timer")}
                className="bg-white text-[#2C2C2C] hover:bg-white/90 rounded-xl text-sm h-9 font-semibold"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Start Focus
              </Button>
              <Button
                onClick={() => onNavigate("reviewer")}
                variant="outline"
                className="border-white/30 text-white bg-transparent hover:bg-white/10 rounded-xl text-sm h-9"
              >
                <Library className="h-3.5 w-3.5 mr-1.5" />
                Reviewer
              </Button>
            </div>
          </div>
          <div className="hidden sm:flex w-20 h-20 rounded-2xl bg-white/15 items-center justify-center">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -2 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.color)}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid lg:grid-cols-2 gap-4">
        <QuotesWidget />
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Start 25m Focus", icon: Zap, tab: "timer", color: "bg-primary/10 text-primary hover:bg-primary/20" },
                { label: "Reviewer Library", icon: Library, tab: "reviewer", color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50" },
                { label: "View Analytics", icon: BarChart3, tab: "stats", color: "bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 dark:hover:bg-green-900/50" },
                { label: "Study Notes", icon: BookOpen, tab: "notes", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 hover:bg-amber-200 dark:hover:bg-amber-900/50" },
              ].map((action) => (
                <button
                  key={action.tab}
                  onClick={() => onNavigate(action.tab)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all duration-200 text-left",
                    action.color
                  )}
                >
                  <action.icon className="h-4 w-4 shrink-0" />
                  {action.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart preview */}
      <ProductivityChart />
    </div>
  );
}

function DashboardContent() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("tab") || "dashboard";
    }
    return "dashboard";
  });
  const [focusModeActive, setFocusModeActive] = useState(false);

  // Real data from API
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
  const [avatar, setAvatar] = useState("");
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  const { user, logout } = useAuth();

  // ── Gamification ───────────────────────────────────────────────────────────
  const focusGame = useFocusGame();
  const sessionStartedRef = useRef(false);
  const latestStatsRef = useRef<UserStats>(EMPTY_STATS);

  const { status, mode, showBreakReminder, completedSessions, todaySessions, dismissBreak, settings, updateSettings } = useTimerContext();

  // Fetch stats, profile, and tasks on mount
  useEffect(() => {
    getStats()
      .then(({ stats: s, weeklyData: w }) => {
        setStats(s);
        setWeeklyData(w);
        latestStatsRef.current = s;
      })
      .catch(console.error);

    getProfile()
      .then(({ profile }) => {
        setAvatar(profile.avatar);
        // Hydrate gamification from server (server wins over localStorage)
        try {
          const ids = JSON.parse(profile.achievements || "[]");
          focusGame.initFromProfile(profile.xp, ids, profile.totalDistractions, profile.perfectSessions);
        } catch {}
      })
      .catch(console.error);

    getTasks()
      .then(({ tasks }) => setAllTasks(tasks))
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track when timer starts a new focus session
  useEffect(() => {
    if (status === "running" && mode === "focus") {
      if (!sessionStartedRef.current) {
        sessionStartedRef.current = true;
        focusGame.startSession();
      }
    } else if (status === "idle") {
      sessionStartedRef.current = false;
    }
  }, [status, mode, focusGame]);

  // Distraction detection via Page Visibility API
  usePageVisibility(
    () => focusGame.recordDistraction(),
    focusGame.isSessionActive
  );

  // Refresh stats + award XP when a session completes
  useEffect(() => {
    const onComplete = (e: Event) => {
      const detail = (e as CustomEvent).detail as { durationMinutes: number; isPartial: boolean } | undefined;
      const durationMinutes = detail?.durationMinutes ?? 0;

      getStats()
        .then(({ stats: s, weeklyData: w }) => {
          setStats(s);
          setWeeklyData(w);
          latestStatsRef.current = s;

          const completionData = focusGame.finishSession(
            durationMinutes,
            s.totalSessions,
            s.totalMinutes,
            s.currentStreak
          );

          // Persist gamification state to backend
          const state = useFocusGame.getState();
          saveGamification({
            xp: state.xp,
            achievements: JSON.stringify(state.unlockedIds),
            totalDistractions: state.totalDistractions,
            perfectSessions: state.perfectSessions,
          }).catch(console.error);

          return completionData;
        })
        .catch(console.error);
    };
    window.addEventListener("taskzen_session_completed", onComplete);
    return () => window.removeEventListener("taskzen_session_completed", onComplete);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep tasks in sync when TodoList updates them
  useEffect(() => {
    const refresh = () => {
      getTasks()
        .then(({ tasks }) => setAllTasks(tasks))
        .catch(console.error);
    };
    window.addEventListener("taskzen_todos_updated", refresh);
    return () => window.removeEventListener("taskzen_todos_updated", refresh);
  }, []);

  // Sync avatar from profile updates
  useEffect(() => {
    const onProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.avatar !== undefined) setAvatar(detail.avatar);
    };
    window.addEventListener("taskzen_profile_updated", onProfileUpdated);
    return () => window.removeEventListener("taskzen_profile_updated", onProfileUpdated);
  }, []);

  useTaskNotifications(allTasks);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/dashboard?tab=${tab}`);
  }, []);

  const handleToggleFocusMode = () => setFocusModeActive((p) => !p);

  // Merge live timer sessions with DB stats
  const liveStats = { ...stats, todaySessions: stats.todaySessions + todaySessions };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex-1 flex flex-col lg:ml-16 min-w-0">
        <Header
          activeTab={activeTab}
          onTabChange={handleTabChange}
          streak={stats.currentStreak}
          username={user?.username}
          avatar={avatar}
          tasks={allTasks}
          onLogout={logout}
        />

        <main className="flex-1 p-4 pb-16 lg:p-6 lg:pb-16 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <DashboardOverview onNavigate={handleTabChange} stats={liveStats} />
              </motion.div>
            )}

            {activeTab === "timer" && (
              <motion.div key="timer" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <div className="grid lg:grid-cols-5 gap-5">
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-xl font-bold">Focus Timer</h2>
                      <SettingsModal settings={settings} onSave={updateSettings} />
                    </div>
                    <FocusTimer
                      focusModeActive={focusModeActive}
                      onToggleFocusMode={handleToggleFocusMode}
                      disableKeyboard={focusModeActive}
                    />
                    <QuotesWidget />
                  </div>
                  <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold mb-1">{"Today's Progress"}</h2>
                    {/* XP bar */}
                    <XPProgressBar xp={focusGame.xp} />
                    {/* Distraction count for active session */}
                    {focusGame.isSessionActive && focusGame.sessionDistractions > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        ⚠️ {focusGame.sessionDistractions} distraction{focusGame.sessionDistractions > 1 ? "s" : ""} this session
                      </p>
                    )}
                    <SessionStats stats={liveStats} todaySessions={todaySessions} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "stats" && (
              <motion.div key="stats" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="text-xl font-bold mb-4">Productivity Analytics</h2>
                <div className="space-y-5">
                  <SessionStats stats={liveStats} todaySessions={todaySessions} />
                  <ProductivityChart weeklyData={weeklyData} />
                  <div>
                    <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      Achievements & Levels
                    </h3>
                    <FocusAchievements xp={focusGame.xp} unlockedIds={focusGame.unlockedIds} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "reviewer" && (
              <motion.div key="reviewer" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <ReviewerLibrary />
              </motion.div>
            )}

            {activeTab === "notes" && (
              <motion.div key="notes" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <StudyNotes />
              </motion.div>
            )}

            {activeTab === "todo" && (
              <motion.div key="todo" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <TodoList />
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <ProfilePage
                  username={user?.username}
                  userEmail={user?.email}
                  onProfileChange={(newAvatar) => setAvatar(newAvatar)}
                />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="text-xl font-bold mb-4">Settings</h2>
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Timer Configuration</h3>
                          <p className="text-sm text-muted-foreground">Customize your Pomodoro durations and behavior</p>
                        </div>
                        <SettingsModal settings={settings} onSave={updateSettings} />
                      </div>
                      <div className="border-t border-border pt-4">
                        <h3 className="font-semibold mb-1">Current Settings</h3>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                          <div>Focus Duration: <span className="text-foreground font-medium">{settings.focusDuration} min</span></div>
                          <div>Short Break: <span className="text-foreground font-medium">{settings.shortBreakDuration} min</span></div>
                          <div>Long Break: <span className="text-foreground font-medium">{settings.longBreakDuration} min</span></div>
                          <div>Long Break Every: <span className="text-foreground font-medium">{settings.longBreakInterval} sessions</span></div>
                          <div>Sound: <span className="text-foreground font-medium">{settings.soundEnabled ? "On" : "Off"}</span></div>
                          <div>Auto-start Breaks: <span className="text-foreground font-medium">{settings.autoStartBreaks ? "On" : "Off"}</span></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <ChangePasswordCard />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <BreakReminder
        show={showBreakReminder}
        sessionsCompleted={completedSessions}
        onStartBreak={dismissBreak}
        onDismiss={dismissBreak}
      />

      {/* Gamification modals */}
      <FocusWarningModal
        show={focusGame.showWarning}
        warningCount={focusGame.warningCount}
        distractions={focusGame.sessionDistractions}
        onReturn={focusGame.dismissWarning}
        onEndSession={() => { focusGame.dismissWarning(); }}
      />

      <SessionCompletionModal
        show={focusGame.showCompletion}
        data={focusGame.completionData}
        currentXp={focusGame.xp}
        onClose={focusGame.dismissCompletion}
      />

      {/* Persistent music player — always mounted so music never stops on tab change */}
      <AmbientPlayer />

      <AnimatePresence>
        {focusModeActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md space-y-4">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl gradient-blue flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Focus Mode</h2>
                <p className="text-sm text-muted-foreground mt-1">Distraction-free environment active</p>
              </div>
              <FocusTimer focusModeActive onToggleFocusMode={handleToggleFocusMode} />
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={handleToggleFocusMode}
              >
                Exit Focus Mode (F)
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <TimerProvider>
      <DashboardContent />
    </TimerProvider>
  );
}
