const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
  return data as T;
}

async function apiFormFetch<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
  return data as T;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  dueDate: string;
  dueTime: string;
  createdAt: string;
}

export const getTasks = () => apiFetch<{ tasks: Task[] }>("/api/tasks");

export const createTask = (task: Omit<Task, "id" | "createdAt">) =>
  apiFetch<{ task: Task }>("/api/tasks", { method: "POST", body: JSON.stringify(task) });

export const updateTask = (id: string, task: Partial<Omit<Task, "id" | "createdAt">>) =>
  apiFetch<{ task: Task }>(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(task) });

export const deleteTask = (id: string) =>
  apiFetch<{ message: string }>(`/api/tasks/${id}`, { method: "DELETE" });

// ── Notes ─────────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export const getNotes = () => apiFetch<{ notes: Note[] }>("/api/notes");

export const createNote = (note: { title: string; content: string; category: string }) =>
  apiFetch<{ note: Note }>("/api/notes", { method: "POST", body: JSON.stringify(note) });

export const updateNote = (id: string, note: Partial<{ title: string; content: string; category: string }>) =>
  apiFetch<{ note: Note }>(`/api/notes/${id}`, { method: "PUT", body: JSON.stringify(note) });

export const deleteNote = (id: string) =>
  apiFetch<{ message: string }>(`/api/notes/${id}`, { method: "DELETE" });

// ── Profile ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  userId: string;
  avatar: string;
  fullName: string;
  institution: string;
  fieldOfStudy: string;
  yearLevel: string;
  studentId: string;
  dailyGoal: string;
  studyTime: string;
  learningStyle: string;
  xp: number;
  achievements: string;
  totalDistractions: number;
  perfectSessions: number;
}

export const getProfile = () =>
  apiFetch<{ profile: UserProfile; user: { id: string; username: string; email: string } }>("/api/user/profile");

export const updateProfile = (data: Partial<Omit<UserProfile, "id" | "userId">>) =>
  apiFetch<{ profile: UserProfile }>("/api/user/profile", { method: "PUT", body: JSON.stringify(data) });

export const saveGamification = (data: { xp: number; achievements: string; totalDistractions: number; perfectSessions: number }) =>
  apiFetch<{ profile: UserProfile }>("/api/user/profile", { method: "PUT", body: JSON.stringify(data) });

// ── Timer Settings ────────────────────────────────────────────────────────────

export interface TimerSettingsData {
  id: string;
  userId: string;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  volume: number;
  weeklyGoal: number;
}

export const getTimerSettings = () =>
  apiFetch<{ settings: TimerSettingsData }>("/api/timer-settings");

export const updateTimerSettings = (data: Partial<Omit<TimerSettingsData, "id" | "userId">>) =>
  apiFetch<{ settings: TimerSettingsData }>("/api/timer-settings", { method: "PUT", body: JSON.stringify(data) });

// ── Sessions & Stats ──────────────────────────────────────────────────────────

export interface StudySessionPayload {
  date: string;
  duration: number;
  mode: string;
  completed: boolean;
  subject?: string;
}

export interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  todaySessions: number;
  todayMinutes: number;
  weeklyProgress: number;
  weeklyGoal: number;
}

export interface WeeklyDataPoint {
  day: string;
  date: string;
  focusMinutes: number;
  sessions: number;
  breaks: number;
}

export const recordSession = (session: StudySessionPayload) =>
  apiFetch<{ session: StudySessionPayload }>("/api/sessions", { method: "POST", body: JSON.stringify(session) });

export const getStats = () =>
  apiFetch<{ stats: UserStats; weeklyData: WeeklyDataPoint[] }>("/api/sessions/stats");

// ── Reviewer Library ──────────────────────────────────────────────────────────

export interface KeyConcept {
  term: string;
  definition: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
}

export interface ReviewerSummary {
  id: string;
  topic: string;
  originalFileName: string | null;
  fileType: string | null;
  generatedSummary: string | null;
  bookmarked: boolean;
  createdAt: string;
  flashcards: Flashcard[] | null;
  quizzes: QuizQuestion[] | null;
  keyConcepts: KeyConcept[] | null;
}

export interface ReviewerDetail extends ReviewerSummary {
  reviewerContent: string | null;
  examQuestions: string[] | null;
}

export const generateReviewer = (topic?: string, file?: File) => {
  const fd = new FormData();
  if (topic) fd.append("topic", topic);
  if (file) fd.append("file", file);
  return apiFormFetch<{ reviewer: ReviewerDetail }>("/api/reviewers/generate", fd);
};

export const getReviewers = (search?: string) =>
  apiFetch<{ reviewers: ReviewerSummary[] }>(
    `/api/reviewers${search ? `?search=${encodeURIComponent(search)}` : ""}`,
  );

export const getReviewer = (id: string) =>
  apiFetch<{ reviewer: ReviewerDetail }>(`/api/reviewers/${id}`);

export const toggleReviewerBookmark = (id: string) =>
  apiFetch<{ reviewer: ReviewerDetail }>(`/api/reviewers/${id}/bookmark`, { method: "PATCH" });

export const deleteReviewer = (id: string) =>
  apiFetch<{ message: string }>(`/api/reviewers/${id}`, { method: "DELETE" });
