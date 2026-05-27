import { Router, RequestHandler } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, h } from "../middleware/auth";

const router = Router();
router.use(requireAuth as RequestHandler);

// POST /api/sessions — record a completed study session
router.post("/", h(async (req, res) => {
  const { date, duration, mode, completed, subject } = req.body as {
    date?: string;
    duration?: number;
    mode?: string;
    completed?: boolean;
    subject?: string;
  };

  if (!date || !duration || !mode) {
    res.status(400).json({ error: "date, duration, and mode are required" });
    return;
  }

  const session = await prisma.studySession.create({
    data: {
      userId: req.user!.userId,
      date,
      duration,
      mode,
      completed: completed ?? true,
      subject: subject ?? "",
    },
  });
  res.status(201).json({ session });
}));

// GET /api/sessions/stats — aggregated stats for the current user
router.get("/stats", h(async (req, res) => {
  const userId = req.user!.userId;
  const today = new Date().toISOString().slice(0, 10);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStart = weekAgo.toISOString().slice(0, 10);

  const [allFocusSessions, weeklySessions, timerSettings] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId, mode: "focus", completed: true },
      orderBy: { date: "asc" },
    }),
    prisma.studySession.findMany({
      where: { userId, mode: "focus", completed: true, date: { gte: weekStart } },
      orderBy: { date: "asc" },
    }),
    prisma.timerSettings.findUnique({ where: { userId } }),
  ]);

  const todaySessions = allFocusSessions.filter(s => s.date === today);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const totalSessions = allFocusSessions.length;
  const totalMinutes = allFocusSessions.reduce((sum, s) => sum + s.duration, 0);
  const weeklyProgress = weeklySessions.reduce((sum, s) => sum + s.duration, 0);

  // Streak calculation
  const uniqueDates = [...new Set(allFocusSessions.map(s => s.date))].sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: string | null = null;

  for (const date of uniqueDates) {
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diffDays = Math.round(
        (new Date(date).getTime() - new Date(prevDate).getTime()) / 86400000,
      );
      runningStreak = diffDays === 1 ? runningStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, runningStreak);
    prevDate = date;
  }

  if (prevDate) {
    const diffDays = Math.round(
      (new Date(today).getTime() - new Date(prevDate).getTime()) / 86400000,
    );
    currentStreak = diffDays <= 1 ? runningStreak : 0;
  }

  // Weekly chart (last 7 days)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const allLastWeekSessions = await prisma.studySession.findMany({
    where: { userId, completed: true, date: { gte: weekStart } },
  });

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo);
    d.setDate(weekAgo.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const daySessions = allLastWeekSessions.filter(s => s.date === dateStr);
    return {
      day: dayNames[d.getDay()],
      date: dateStr,
      focusMinutes: daySessions.filter(s => s.mode === "focus").reduce((sum, s) => sum + s.duration, 0),
      sessions: daySessions.filter(s => s.mode === "focus").length,
      breaks: daySessions.filter(s => s.mode !== "focus").length,
    };
  });

  res.json({
    stats: {
      totalSessions,
      totalMinutes,
      currentStreak,
      longestStreak,
      todaySessions: todaySessions.length,
      todayMinutes,
      weeklyProgress,
      weeklyGoal: timerSettings?.weeklyGoal ?? 600,
    },
    weeklyData,
  });
}));

export default router;
