"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreakReminderProps {
  show: boolean;
  sessionsCompleted: number;
  onStartBreak: () => void;
  onDismiss: () => void;
}

export function BreakReminder({ show, sessionsCompleted, onStartBreak, onDismiss }: BreakReminderProps) {
  const isLongBreak = sessionsCompleted > 0 && sessionsCompleted % 4 === 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="relative bg-card border border-border rounded-lg p-8 max-w-sm w-full shadow-xl text-center"
          >
            <button
              aria-label="Dismiss"
              onClick={onDismiss}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Animated icon */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="w-20 h-20 rounded-lg gradient-blue flex items-center justify-center mx-auto mb-5 shadow-lg"
            >
              <Coffee className="h-10 w-10 text-background" />
            </motion.div>

            <h2 className="text-2xl font-bold mb-2">
              {isLongBreak ? "Long Break Time!" : "Great Work!"}
            </h2>
            <p className="text-muted-foreground mb-2 text-sm">
              You completed <strong className="text-foreground">{sessionsCompleted} focus session{sessionsCompleted !== 1 ? "s" : ""}</strong> today!
            </p>
            <p className="text-muted-foreground mb-6 text-sm">
              {isLongBreak
                ? "You've earned a 15-minute long break. Step away and recharge!"
                : "Take a 5-minute break to refresh your mind before continuing."}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < sessionsCompleted % 4 || (sessionsCompleted % 4 === 0 && sessionsCompleted > 0)
                      ? "bg-primary"
                      : "bg-border"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onDismiss} className="flex-1 rounded-lg">
                Skip Break
              </Button>
              <Button onClick={onStartBreak} className="flex-1 rounded-lg gradient-blue text-background">
                <Play className="h-4 w-4 mr-1.5" />
                Start Break
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
