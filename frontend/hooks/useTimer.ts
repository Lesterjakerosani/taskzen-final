"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { TimerMode, TimerStatus, TimerSettings } from "@/types";
import { getDateString } from "@/lib/utils";
import { getTimerSettings, updateTimerSettings, recordSession } from "@/lib/api";

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  volume: 0.5,
};

function getDuration(mode: TimerMode, settings: TimerSettings): number {
  if (mode === "focus") return settings.focusDuration * 60;
  if (mode === "short-break") return settings.shortBreakDuration * 60;
  return settings.longBreakDuration * 60;
}

export function useTimer() {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [mode, setMode] = useState<TimerMode>("focus");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(getDuration("focus", DEFAULT_SETTINGS));
  const [completedSessions, setCompletedSessions] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [focusModeActive, setFocusModeActive] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const finishedRef = useRef(false);

  // Refs that always hold the current state values — safe to read in callbacks
  const statusRef = useRef<TimerStatus>("idle");
  const modeRef = useRef<TimerMode>("focus");
  const timeLeftRef = useRef(getDuration("focus", DEFAULT_SETTINGS));
  const settingsRef = useRef<TimerSettings>(DEFAULT_SETTINGS);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const totalTime = getDuration(mode, settings);

  // Load timer settings from API on mount
  useEffect(() => {
    getTimerSettings()
      .then(({ settings: s }) => {
        const loaded: TimerSettings = {
          focusDuration:      s.focusDuration,
          shortBreakDuration: s.shortBreakDuration,
          longBreakDuration:  s.longBreakDuration,
          longBreakInterval:  s.longBreakInterval,
          autoStartBreaks:    s.autoStartBreaks,
          autoStartFocus:     s.autoStartFocus,
          soundEnabled:       s.soundEnabled,
          volume:             s.volume,
        };
        setSettings(loaded);
        setTimeLeft(getDuration("focus", loaded));
        setSettingsLoaded(true);
      })
      .catch(() => {
        try {
          const saved = localStorage.getItem("timerSettings");
          if (saved) {
            const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            setSettings(parsed);
            setTimeLeft(getDuration("focus", parsed));
          }
        } catch {}
        setSettingsLoaded(true);
      });
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playSound = useCallback(() => {
    const s = settingsRef.current;
    if (!s.soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(s.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, []);

  // Record elapsed focus time when the user stops early (>= 1 minute qualifies)
  const recordPartialIfEligible = useCallback(() => {
    const curStatus = statusRef.current;
    const curMode = modeRef.current;
    const curTimeLeft = timeLeftRef.current;
    const curSettings = settingsRef.current;
    if ((curStatus === "running" || curStatus === "paused") && curMode === "focus") {
      const elapsed = getDuration(curMode, curSettings) - curTimeLeft;
      if (elapsed >= 60) {
        recordSession({
          date: getDateString(new Date()),
          duration: Math.round(elapsed / 60),
          mode: "focus",
          completed: true,
          subject: "",
        })
          .then(() => window.dispatchEvent(new CustomEvent("taskzen_session_completed", {
            detail: { durationMinutes: Math.round(elapsed / 60), isPartial: true },
          })))
          .catch(console.error);
      }
    }
  }, []);

  const handleFinish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimer();
    setStatus("finished");
    playSound();

    const curMode = modeRef.current;
    const curSettings = settingsRef.current;

    if (curMode === "focus") {
      setCompletedSessions((prev) => prev + 1);
      setTodaySessions((prev) => prev + 1);
      setShowBreakReminder(true);

      // Save first, then notify so getStats sees the new row
      recordSession({
        date: getDateString(new Date()),
        duration: curSettings.focusDuration,
        mode: "focus",
        completed: true,
        subject: "",
      })
        .then(() => window.dispatchEvent(new CustomEvent("taskzen_session_completed", {
          detail: { durationMinutes: curSettings.focusDuration, isPartial: false },
        })))
        .catch(console.error);
    } else {
      recordSession({
        date: getDateString(new Date()),
        duration: curMode === "short-break" ? curSettings.shortBreakDuration : curSettings.longBreakDuration,
        mode: curMode,
        completed: true,
      }).catch(console.error);
      setShowBreakReminder(false);
    }
  }, [clearTimer, playSound]);

  // Countdown — pure state update, no side effects inside the updater
  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [status, clearTimer]);

  // Completion detection — fires when timeLeft reaches 0 while running
  useEffect(() => {
    if (timeLeft === 0 && status === "running") {
      handleFinish();
    }
  }, [timeLeft, status, handleFinish]);

  const start = useCallback(() => {
    finishedRef.current = false;
    setStatus("running");
  }, []);

  const pause = useCallback(() => setStatus("paused"), []);

  const reset = useCallback(() => {
    recordPartialIfEligible();
    finishedRef.current = false;
    clearTimer();
    setStatus("idle");
    setShowBreakReminder(false);
    setTimeLeft(getDuration(modeRef.current, settingsRef.current));
  }, [clearTimer, recordPartialIfEligible]);

  const switchMode = useCallback((newMode: TimerMode) => {
    recordPartialIfEligible();
    finishedRef.current = false;
    clearTimer();
    setMode(newMode);
    setStatus("idle");
    setShowBreakReminder(false);
    setTimeLeft(getDuration(newMode, settingsRef.current));
  }, [clearTimer, recordPartialIfEligible]);

  const dismissBreak = useCallback(() => {
    setShowBreakReminder(false);
    const nextMode: TimerMode =
      completedSessions % settingsRef.current.longBreakInterval === 0 ? "long-break" : "short-break";
    switchMode(nextMode);
  }, [completedSessions, switchMode]);

  const updateSettings = useCallback((newSettings: Partial<TimerSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      updateTimerSettings(newSettings).catch(console.error);
      try { localStorage.setItem("timerSettings", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const toggleFocusMode = useCallback(() => setFocusModeActive((p) => !p), []);

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return {
    mode, status, timeLeft, totalTime, progress,
    completedSessions, todaySessions, settings, settingsLoaded,
    showBreakReminder, focusModeActive,
    start, pause, reset, switchMode,
    dismissBreak, updateSettings, toggleFocusMode,
  };
}
