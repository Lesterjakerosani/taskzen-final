import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getGreeting(): string {
  const phHour = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  ).getHours();
  if (phHour >= 0 && phHour < 12) return "Good morning";
  if (phHour >= 12 && phHour < 18) return "Good afternoon";
  return "Good evening";
}

export function getDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

export const CIRCUMFERENCE = 2 * Math.PI * 120;

export function getStrokeDashoffset(progress: number): number {
  return CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
}
