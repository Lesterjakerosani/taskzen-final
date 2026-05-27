"use client";
import { useEffect, useRef } from "react";

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  dueTime: string;
}

const NOTIFIED_KEY = "taskzen_notified";
const THRESHOLDS = [
  { key: "24h", ms: 24 * 60 * 60 * 1000, label: "due in 24 hours" },
  { key: "12h", ms: 12 * 60 * 60 * 1000, label: "due in 12 hours" },
  { key: "1h",  ms:  1 * 60 * 60 * 1000, label: "due in 1 hour" },
  { key: "30m", ms: 30 * 60 * 1000,       label: "due in 30 minutes" },
];

function loadNotified(): Record<string, number> {
  try { const r = localStorage.getItem(NOTIFIED_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveNotified(data: Record<string, number>) {
  try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify(data)); } catch {}
}

function fire(title: string, body: string, tag: string) {
  if (Notification.permission !== "granted") return;
  try { new Notification(title, { body, tag, icon: "/taskzen-circle.png" }); } catch {}
}

export function useTaskNotifications(tasks: Task[]) {
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const check = () => {
      const now = Date.now();
      const notified = loadNotified();
      let changed = false;

      for (const task of tasksRef.current) {
        if (task.status === "done" || !task.dueDate) continue;
        const due = new Date(`${task.dueDate}T${task.dueTime || "09:00"}`).getTime();
        const msLeft = due - now;
        if (msLeft <= 0) continue;

        // Fire as soon as the task enters a threshold zone (no narrow window)
        for (const t of THRESHOLDS) {
          if (msLeft <= t.ms) {
            const notifKey = `${task.id}_${t.key}`;
            if (!notified[notifKey]) {
              fire("⏰ TaskZen Reminder", `"${task.title}" is ${t.label}`, notifKey);
              notified[notifKey] = now;
              changed = true;
            }
          }
        }
      }

      if (changed) saveNotified(notified);
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);
}
