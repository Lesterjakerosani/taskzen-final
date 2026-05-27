"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowLeft, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FocusWarningModalProps {
  show: boolean;
  warningCount: number;
  distractions: number;
  onReturn: () => void;
  onEndSession: () => void;
}

export function FocusWarningModal({ show, warningCount, distractions, onReturn, onEndSession }: FocusWarningModalProps) {
  const shakeIntensity = Math.min(warningCount - 1, 3);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.4)" }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{
              scale: 1, opacity: 1, y: 0,
              x: shakeIntensity > 0
                ? [0, -6 * shakeIntensity, 6 * shakeIntensity, -4 * shakeIntensity, 4 * shakeIntensity, 0]
                : 0,
            }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ duration: 0.35, x: { duration: 0.4, ease: "easeInOut" } }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border/50 shadow-2xl"
            style={{
              background: "rgba(var(--card-rgb, 255 255 255) / 0.85)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Top gradient bar */}
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

            <div className="p-6 text-center">
              {/* Animated icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30"
              >
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </motion.div>

              <h2 className="mb-1 text-lg font-bold text-foreground">Stay Focused</h2>
              <p className="mb-1 text-sm text-muted-foreground leading-relaxed">
                Your study session is still active.
              </p>
              {distractions > 0 && (
                <p className="mb-4 text-xs font-medium text-amber-600 dark:text-amber-400">
                  {distractions} distraction{distractions > 1 ? "s" : ""} this session
                </p>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  onClick={onReturn}
                  className="w-full rounded-xl gradient-blue text-white h-10 font-semibold"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Focus
                </Button>
                <Button
                  onClick={onEndSession}
                  variant="ghost"
                  className="w-full rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 text-sm"
                >
                  <StopCircle className="mr-2 h-3.5 w-3.5" />
                  End Session
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
