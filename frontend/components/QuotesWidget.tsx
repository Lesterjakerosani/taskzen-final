"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Quote, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fallbackQuotes } from "@/data/dummy";

export function QuotesWidget() {
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState(0);

  const loadQuote = async (useAI = true) => {
    setLoading(true);
    if (useAI) {
      try {
        const res = await fetch("/api/quotes");
        if (res.ok) {
          const data = await res.json();
          setQuote(data.quote);
          setKey((k) => k + 1);
          return;
        }
      } catch {}
    }
    const random = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    setQuote(random);
    setKey((k) => k + 1);
    setLoading(false);
  };

  useEffect(() => {
    const random = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    setQuote(random);
  }, []);

  return (
    <Card className="overflow-hidden gradient-blue-subtle">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold">Daily Inspiration</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => loadQuote(true)}
            disabled={loading}
            className="h-7 w-7"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="min-h-[60px] flex items-center">
          {loading ? (
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-2"
              >
                <Quote className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed italic">{quote}</p>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
