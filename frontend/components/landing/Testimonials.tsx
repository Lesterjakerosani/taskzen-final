"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Loader2, Star } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  initials: string;
  quote: string;
  rating: number;
  anonymous: boolean;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 mb-4">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3 w-3 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-border"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`h-5 w-5 transition-colors ${s <= (hovered || value) ? "text-amber-400 fill-amber-400" : "text-border"}`}
            strokeWidth={1.5}
          />
        </button>
      ))}
      <span className="ml-2 text-xs text-muted-foreground" style={{ fontFamily: "Arial, sans-serif" }}>
        {hovered || value ? ["", "Poor", "Fair", "Good", "Great", "Excellent"][hovered || value] : "Rate your experience"}
      </span>
    </div>
  );
}

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/landing/testimonials`);
      const data = await res.json();
      setTestimonials(data.testimonials ?? []);
    } catch {
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/landing/testimonials`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: trimmed, rating }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit."); return; }
      setInput("");
      setRating(5);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
      fetchTestimonials();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const [featured, ...rest] = testimonials;

  return (
    <section id="testimonials" className="section-white py-28">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-muted-foreground/40" />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4 }}
              className="label-xs"
            >
              Student Stories
            </motion.p>
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="heading-display text-xl sm:text-2xl sm:text-right"
          >
            Real results from <em className="not-italic italic">real students</em>
          </motion.h2>
        </div>

        {loading ? (
          <div className="bg-card border border-border p-14 flex items-center justify-center mb-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
          </div>
        ) : testimonials.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-border p-14 flex flex-col items-center justify-center text-center mb-3"
          >
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-4" strokeWidth={1.5} />
            <p className="text-muted-foreground text-sm font-light" style={{ fontFamily: "Arial, sans-serif" }}>
              No stories yet — be the first to share yours.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Featured testimonial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="bg-card border border-border p-10 sm:p-14 mb-3"
            >
              <StarDisplay rating={featured.rating} />
              <div
                className="text-6xl text-border leading-none mb-6 select-none"
                style={{ fontFamily: "Arial, sans-serif" }}
                aria-hidden
              >
                &ldquo;
              </div>
              <p
                className="text-foreground text-xl sm:text-2xl font-light leading-relaxed mb-10 max-w-3xl"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                {featured.quote}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 bg-foreground flex items-center justify-center text-background shrink-0"
                  style={{ fontSize: "0.6rem", fontFamily: "Arial, sans-serif" }}
                >
                  {featured.initials}
                </div>
                <div>
                  <div className="text-card-foreground text-xs font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
                    {featured.name}
                  </div>
                  <div className="label-xs mt-0.5" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
                    {featured.anonymous ? "Anonymous · TaskZen User" : featured.role}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Compact testimonials */}
            {rest.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-3 mb-3">
                {rest.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="bg-card border border-border p-6 hover:border-muted-foreground/30 transition-colors duration-300"
                  >
                    <StarDisplay rating={t.rating} />
                    <p
                      className="text-sm text-muted-foreground leading-relaxed mb-6 italic font-light"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 bg-foreground flex items-center justify-center text-background shrink-0"
                        style={{ fontSize: "0.5rem", fontFamily: "Arial, sans-serif" }}
                      >
                        {t.initials}
                      </div>
                      <div>
                        <div className="text-card-foreground text-xs font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
                          {t.name}
                        </div>
                        <div className="label-xs mt-0.5" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
                          {t.anonymous ? "Anonymous · TaskZen User" : t.role}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Submission form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="bg-card border border-border p-6 sm:p-8 mt-3"
        >
          <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "Arial, sans-serif" }}>
            Share your experience — posted anonymously
          </p>

          <div className="mb-4">
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            placeholder="How has TaskZen helped your studies?"
            rows={3}
            disabled={submitting}
            className="w-full bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/50 p-3 resize-none focus:outline-none focus:border-muted-foreground/50 transition-colors duration-200 disabled:opacity-50"
            style={{ fontFamily: "Arial, sans-serif" }}
          />
          <div className="flex items-center justify-end mt-3">
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || submitting}
              className="text-xs px-4 py-2 bg-foreground text-background font-semibold disabled:opacity-30 hover:opacity-80 transition-opacity duration-200 flex items-center gap-2"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
              Post Anonymously
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 mt-2" style={{ fontFamily: "Arial, sans-serif" }}>{error}</p>
          )}

          <AnimatePresence>
            {submitted && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground mt-2"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                Thank you for sharing your story!
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
}
