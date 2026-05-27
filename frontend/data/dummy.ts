import type { ProductivityStat, UserStats, StudySession } from "@/types";

export const dummyStats: UserStats = {
  totalSessions: 142,
  totalMinutes: 3550,
  currentStreak: 7,
  longestStreak: 21,
  todaySessions: 4,
  todayMinutes: 100,
  weeklyGoal: 600,
  weeklyProgress: 420,
};

export const weeklyData: ProductivityStat[] = [
  { day: "Mon", focusMinutes: 75, sessions: 3, breaks: 4 },
  { day: "Tue", focusMinutes: 100, sessions: 4, breaks: 5 },
  { day: "Wed", focusMinutes: 50, sessions: 2, breaks: 2 },
  { day: "Thu", focusMinutes: 125, sessions: 5, breaks: 6 },
  { day: "Fri", focusMinutes: 90, sessions: 3, breaks: 4 },
  { day: "Sat", focusMinutes: 60, sessions: 2, breaks: 3 },
  { day: "Sun", focusMinutes: 100, sessions: 4, breaks: 5 },
];

export const recentSessions: StudySession[] = [
  { id: "1", date: "2026-05-20", duration: 25, mode: "focus", completed: true, subject: "Mathematics" },
  { id: "2", date: "2026-05-20", duration: 25, mode: "focus", completed: true, subject: "Physics" },
  { id: "3", date: "2026-05-20", duration: 5, mode: "short-break", completed: true },
  { id: "4", date: "2026-05-19", duration: 25, mode: "focus", completed: true, subject: "Programming" },
  { id: "5", date: "2026-05-19", duration: 25, mode: "focus", completed: true, subject: "English" },
];

export const suggestedPrompts = [
  "Create a 3-hour study plan for my exam",
  "Explain calculus in simple terms",
  "Give me motivation to finish my project",
  "How can I avoid distractions while studying?",
  "Summarize the Pomodoro technique for me",
  "What are the best study techniques for memorization?",
  "Help me overcome procrastination",
  "Give me tips for better focus",
];

export const fallbackQuotes = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Success is the sum of small efforts repeated day in and day out. — Robert Collier",
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  "The expert in anything was once a beginner. — Helen Hayes",
  "It always seems impossible until it's done. — Nelson Mandela",
  "Your limitation — it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
];
