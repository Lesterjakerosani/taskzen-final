export type TimerMode = "focus" | "short-break" | "long-break";
export type TimerStatus = "idle" | "running" | "paused" | "finished";
export type ThemeMode = "light" | "dark" | "system";

export interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  volume: number;
}

export interface StudySession {
  id: string;
  date: string;
  duration: number;
  mode: TimerMode;
  completed: boolean;
  subject?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ProductivityStat {
  day: string;
  focusMinutes: number;
  sessions: number;
  breaks: number;
}

export interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  todaySessions: number;
  todayMinutes: number;
  weeklyGoal: number;
  weeklyProgress: number;
}
