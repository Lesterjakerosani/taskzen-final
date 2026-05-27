"use client";
import { useEffect, useRef, useCallback } from "react";

export function usePageVisibility(
  onDistraction: () => void,
  isActive: boolean,
  gracePeriodMs = 5000
) {
  const graceRef = useRef<NodeJS.Timeout | null>(null);
  const hiddenRef = useRef(false);
  const activeRef = useRef(isActive);

  useEffect(() => { activeRef.current = isActive; }, [isActive]);

  const clearGrace = useCallback(() => {
    if (graceRef.current) { clearTimeout(graceRef.current); graceRef.current = null; }
  }, []);

  const startGrace = useCallback(() => {
    if (hiddenRef.current) return;
    hiddenRef.current = true;
    graceRef.current = setTimeout(() => {
      if (hiddenRef.current && activeRef.current) onDistraction();
    }, gracePeriodMs);
  }, [onDistraction, gracePeriodMs]);

  const cancelGrace = useCallback(() => {
    hiddenRef.current = false;
    clearGrace();
  }, [clearGrace]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) startGrace(); else cancelGrace();
    };
    const onBlur   = () => startGrace();
    const onFocus  = () => cancelGrace();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      clearGrace();
    };
  }, [startGrace, cancelGrace, clearGrace]);
}
