"use client";
import { createContext, useContext } from "react";
import { useTimer } from "@/hooks/useTimer";

type TimerContextValue = ReturnType<typeof useTimer>;

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const timer = useTimer();
  return <TimerContext.Provider value={timer}>{children}</TimerContext.Provider>;
}

export function useTimerContext() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimerContext must be used within TimerProvider");
  return ctx;
}
