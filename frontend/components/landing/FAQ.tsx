"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "Is TaskZen free to use?", a: "Yes! TaskZen is completely free. Sign up and start your first focus session in minutes — no credit card required, ever." },
  { q: "How does the AI assistant work?", a: "Our AI assistant is powered by Google's Gemini model. It understands your study context and provides personalized study plans, instant explanations, and productivity coaching." },
  { q: "Can I customize the Pomodoro timer?", a: "Absolutely! You can customize focus duration (1–60 min), short break duration, long break duration, and how many sessions before a long break. Every setting is saved automatically." },
  { q: "Is my data stored securely?", a: "Your data is stored locally in your browser — we never send your personal information to external servers. Your privacy is fully protected and your data belongs to you." },
  { q: "Does TaskZen work on mobile?", a: "Yes! TaskZen is fully responsive and optimized for all screen sizes. Use it seamlessly on your smartphone, tablet, or desktop computer." },
  { q: "What subjects does the AI assistant support?", a: "The AI assistant can help with virtually any subject — mathematics, sciences, literature, history, programming, languages, and more. If you can study it, TaskZen can help." },
];

function FAQItem({ q, a, isOpen, onClick }: { q: string; a: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-border">
      <button onClick={onClick} className="w-full flex items-center justify-between py-5 text-left gap-6 group">
        <span className="text-sm text-card-foreground group-hover:text-foreground transition-colors" style={{ fontFamily: "Arial, sans-serif", fontWeight: 400 }}>
          {q}
        </span>
        <span className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
          {isOpen ? <Minus className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-sm text-muted-foreground leading-relaxed font-light" style={{ fontFamily: "Arial, sans-serif" }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section-linen py-28">
      <div className="max-w-2xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
            className="label-xs mb-5"
          >
            FAQ
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="heading-display text-3xl sm:text-4xl"
          >
            Frequently asked <em className="not-italic italic">questions</em>
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="border-t border-border"
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={faq.q}
              q={faq.q}
              a={faq.a}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
