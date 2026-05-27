"use client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { suggestedPrompts } from "@/data/dummy";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2 p-3">
      {suggestedPrompts.slice(0, 5).map((prompt, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(prompt)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <Sparkles className="h-3 w-3" />
          {prompt}
        </motion.button>
      ))}
    </div>
  );
}
