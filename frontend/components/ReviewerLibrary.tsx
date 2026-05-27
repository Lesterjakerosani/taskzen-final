"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Library, Sparkles, Upload, X, FileText, Search, Bookmark, BookmarkCheck,
  Trash2, ChevronLeft, RotateCcw, CheckCircle2, XCircle, FileQuestion,
  Layers, Brain, ClipboardList, Lightbulb, ArrowRight, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  generateReviewer, getReviewers, getReviewer,
  toggleReviewerBookmark, deleteReviewer,
  type ReviewerSummary, type ReviewerDetail,
  type Flashcard, type QuizQuestion, type KeyConcept,
} from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type MainTab = "generate" | "library";
type GeneratorMode = "topic" | "file";
type ViewerTab = "summary" | "concepts" | "flashcards" | "quiz" | "exam";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileTypeLabel(mime: string | null): string {
  if (!mime) return "";
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("wordprocessingml") || mime.includes("msword")) return "DOCX";
  if (mime.includes("presentationml") || mime.includes("powerpoint")) return "PPTX";
  return "File";
}

function fileTypeBadgeColor(mime: string | null): string {
  if (!mime) return "bg-muted text-muted-foreground";
  if (mime.includes("pdf")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (mime.includes("wordprocessingml") || mime.includes("msword"))
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Loading progress messages ─────────────────────────────────────────────────

const PROGRESS_MESSAGES = [
  "Analyzing your content...",
  "Identifying key concepts...",
  "Building study notes...",
  "Creating flashcards...",
  "Writing quiz questions...",
  "Generating exam questions...",
  "Finalizing your reviewer...",
];

function GeneratingOverlay() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % PROGRESS_MESSAGES.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 gap-6"
    >
      <div className="relative w-20 h-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-lg mb-1">AI is working its magic</h3>
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-sm text-muted-foreground"
          >
            {PROGRESS_MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-xs text-muted-foreground mt-2">Usually 15–45 seconds depending on content size</p>
      </div>
    </motion.div>
  );
}

// ── File Upload Zone ──────────────────────────────────────────────────────────

function FileUploadZone({
  file, onFileChange,
}: { file: File | null; onFileChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFileChange(f);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(e.target.files?.[0] ?? null);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <button
          aria-label="Remove file"
          onClick={() => onFileChange(null)}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200",
        dragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border hover:border-primary/50 hover:bg-accent/5",
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Upload className="h-6 w-6 text-primary" />
      </div>
      <div className="text-center">
        <p className="font-medium text-sm">Drop your file here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">Supports PDF, DOCX, PPT, PPTX · Max 15 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        aria-label="Upload study material"
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx"
        onChange={handleChange}
      />
    </div>
  );
}

// ── Reviewer Card ─────────────────────────────────────────────────────────────

function ReviewerCard({
  reviewer,
  onView,
  onBookmark,
  onDelete,
}: {
  reviewer: ReviewerSummary;
  onView: () => void;
  onBookmark: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const flashCount = Array.isArray(reviewer.flashcards) ? reviewer.flashcards.length : 0;
  const quizCount = Array.isArray(reviewer.quizzes) ? reviewer.quizzes.length : 0;
  const conceptCount = Array.isArray(reviewer.keyConcepts) ? reviewer.keyConcepts.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className="h-full cursor-pointer border hover:border-primary/40 transition-all duration-200 hover:shadow-md">
        <CardContent className="p-4 flex flex-col gap-3 h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-sm leading-tight truncate cursor-pointer hover:text-primary transition-colors"
                onClick={onView}
              >
                {reviewer.topic}
              </h3>
              {reviewer.originalFileName && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {reviewer.originalFileName}
                </p>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); onBookmark(); }}
              className={cn(
                "p-1.5 rounded-lg transition-colors shrink-0",
                reviewer.bookmarked
                  ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20",
              )}
            >
              {reviewer.bookmarked
                ? <BookmarkCheck className="h-4 w-4" />
                : <Bookmark className="h-4 w-4" />}
            </button>
          </div>

          {/* Summary preview */}
          {reviewer.generatedSummary && (
            <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
              {reviewer.generatedSummary}
            </p>
          )}

          {/* Stats */}
          <div className="flex gap-2 flex-wrap">
            {reviewer.fileType && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", fileTypeBadgeColor(reviewer.fileType))}>
                {fileTypeLabel(reviewer.fileType)}
              </span>
            )}
            {flashCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                {flashCount} flashcards
              </span>
            )}
            {quizCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                {quizCount} quiz Q's
              </span>
            )}
            {conceptCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {conceptCount} concepts
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(reviewer.createdAt)}
            </span>
            <div className="flex gap-1">
              {confirmDelete ? (
                <>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(); }}
                    className="text-xs px-2 py-1 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}
                    className="text-xs px-2 py-1 rounded-lg bg-muted hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    aria-label="Delete reviewer"
                    onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={onView}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 font-medium"
                  >
                    Open <ArrowRight className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Viewer: Flashcard ─────────────────────────────────────────────────────────

function FlashcardItem({ card, index }: { card: Flashcard; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className="cursor-pointer select-none"
      onClick={() => setFlipped(f => !f)}
    >
      <div className="relative rounded-2xl border border-border overflow-hidden min-h-[140px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={flipped ? "back" : "front"}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "p-5 flex flex-col justify-between gap-3 min-h-[140px]",
              flipped
                ? "bg-primary/5"
                : "bg-card",
            )}
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {flipped ? "Answer" : "Question"}
              </p>
              <p className="text-sm font-medium leading-relaxed">
                {flipped ? card.back : card.front}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground text-right">
              {flipped ? "Tap to see question" : "Tap to reveal answer"}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Viewer: Quiz Question ─────────────────────────────────────────────────────

function QuizItem({
  q, index, onAnswer,
}: { q: QuizQuestion; index: number; onAnswer: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const letters = ["A", "B", "C", "D"];
  const answered = selected !== null;

  const handleSelect = (letter: string) => {
    if (answered) return;
    setSelected(letter);
    onAnswer(letter === q.answer);
  };

  return (
    <div className="space-y-3">
      <p className="font-medium text-sm">
        <span className="text-muted-foreground mr-2">{index + 1}.</span>
        {q.question}
      </p>
      <div className="space-y-2">
        {q.choices.map((choice, i) => {
          const letter = letters[i];
          const isCorrect = letter === q.answer;
          const isSelected = letter === selected;

          return (
            <button
              key={i}
              onClick={() => handleSelect(letter)}
              disabled={answered}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200",
                !answered && "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                answered && isCorrect && "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200",
                answered && isSelected && !isCorrect && "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200",
                answered && !isSelected && !isCorrect && "opacity-40",
                !answered && "border-border",
              )}
            >
              <span className="font-semibold mr-2">{letter})</span>
              {choice.replace(/^[A-D][).]\s*/, "")}
              {answered && isCorrect && <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-600" />}
              {answered && isSelected && !isCorrect && <XCircle className="inline h-4 w-4 ml-2 text-red-500" />}
            </button>
          );
        })}
      </div>
      {answered && q.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm"
        >
          <span className="font-semibold text-primary mr-1">
            {selected === q.answer ? "✓ Correct!" : "✗ Incorrect."}
          </span>
          {q.explanation}
        </motion.div>
      )}
    </div>
  );
}

// ── Viewer: Notes renderer ────────────────────────────────────────────────────

function renderNotes(content: string) {
  return content.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="text-base font-bold mt-5 mb-2 text-foreground">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h4 key={i} className="text-sm font-semibold mt-3 mb-1 text-foreground">
          {line.slice(4)}
        </h4>
      );
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <li key={i} className="ml-4 text-sm text-muted-foreground list-disc leading-relaxed">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-sm text-muted-foreground leading-relaxed">
        {line}
      </p>
    );
  });
}

// ── Reviewer Viewer ───────────────────────────────────────────────────────────

function ReviewerViewer({
  reviewer,
  onBack,
}: {
  reviewer: ReviewerDetail;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ViewerTab>("summary");
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(0);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);

  const flashcards = (reviewer.flashcards as Flashcard[] | null) ?? [];
  const quizzes = (reviewer.quizzes as QuizQuestion[] | null) ?? [];
  const concepts = (reviewer.keyConcepts as KeyConcept[] | null) ?? [];
  const examQs = (reviewer.examQuestions as string[] | null) ?? [];

  useEffect(() => {
    setShuffledCards([...flashcards]);
    setQuizScore(0);
    setQuizAnswered(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewer.id]);

  const handleShuffle = () => {
    setShuffledCards(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleQuizAnswer = (correct: boolean) => {
    setQuizAnswered(p => p + 1);
    if (correct) setQuizScore(p => p + 1);
  };

  const tabs: { id: ViewerTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "summary", label: "Summary", icon: Lightbulb },
    { id: "concepts", label: "Key Concepts", icon: Brain, count: concepts.length },
    { id: "flashcards", label: "Flashcards", icon: Layers, count: flashcards.length },
    { id: "quiz", label: "Quiz", icon: ClipboardList, count: quizzes.length },
    { id: "exam", label: "Exam Q's", icon: FileQuestion, count: examQs.length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          aria-label="Go back"
          onClick={onBack}
          className="mt-0.5 p-2 rounded-xl border border-border hover:bg-accent/10 transition-colors shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold truncate">{reviewer.topic}</h2>
            {reviewer.fileType && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", fileTypeBadgeColor(reviewer.fileType))}>
                {fileTypeLabel(reviewer.fileType)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generated {formatDate(reviewer.createdAt)}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                activeTab === tab.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* Summary */}
          {activeTab === "summary" && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="font-semibold">Overview</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {reviewer.generatedSummary}
                </p>

                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  {[
                    { label: "Key Concepts", value: concepts.length, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
                    { label: "Flashcards", value: flashcards.length, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30" },
                    { label: "Quiz Qs", value: quizzes.length, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
                    { label: "Exam Qs", value: examQs.length, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30" },
                  ].map(s => (
                    <div key={s.label} className={cn("rounded-xl p-3 text-center", s.color.split(" ").slice(1).join(" "))}>
                      <p className={cn("text-2xl font-bold", s.color.split(" ")[0])}>{s.value}</p>
                      <p className="text-xs mt-0.5 font-medium opacity-80">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Concepts */}
          {activeTab === "concepts" && (
            <div className="space-y-3">
              {concepts.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No key concepts available.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {concepts.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="h-full">
                        <CardContent className="p-4">
                          <p className="font-semibold text-sm text-primary mb-1">{c.term}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{c.definition}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Flashcards */}
          {activeTab === "flashcards" && (
            <div className="space-y-3">
              {flashcards.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No flashcards available.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{shuffledCards.length} cards · Tap to flip</p>
                    <button
                      onClick={handleShuffle}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent/10 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Shuffle
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {shuffledCards.map((card, i) => (
                      <FlashcardItem key={`${i}-${card.front}`} card={card} index={i} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Quiz */}
          {activeTab === "quiz" && (
            <div className="space-y-4">
              {quizzes.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No quiz questions available.</p>
              ) : (
                <>
                  {quizAnswered > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        Score: <strong>{quizScore}/{quizAnswered}</strong> answered
                        {quizAnswered === quizzes.length && (
                          <span className="text-muted-foreground ml-2">
                            ({Math.round((quizScore / quizzes.length) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="space-y-6">
                    {quizzes.map((q, i) => (
                      <Card key={i}>
                        <CardContent className="p-5">
                          <QuizItem q={q} index={i} onAnswer={handleQuizAnswer} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Exam Questions */}
          {activeTab === "exam" && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <FileQuestion className="h-4 w-4 text-orange-600" />
                  </div>
                  <h3 className="font-semibold">Possible Exam Questions</h3>
                </div>
                {examQs.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No exam questions available.</p>
                ) : (
                  <ol className="space-y-3">
                    {examQs.map((q, i) => (
                      <li key={i}>
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex gap-3 p-3 rounded-xl bg-muted/40 border border-border"
                        >
                          <span className="text-xs font-bold text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm leading-relaxed">{q}</p>
                        </motion.div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ReviewerLibrary() {
  const [mainTab, setMainTab] = useState<MainTab>("generate");
  const [mode, setMode] = useState<GeneratorMode>("topic");
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [reviewers, setReviewers] = useState<ReviewerSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState("");

  const [viewerData, setViewerData] = useState<ReviewerDetail | null>(null);
  const [loadingViewer, setLoadingViewer] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchReviewers = useCallback(async (q?: string) => {
    setLoadingList(true);
    try {
      const { reviewers: list } = await getReviewers(q);
      setReviewers(list);
    } catch {
      // silent
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewers();
  }, [fetchReviewers]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchReviewers(search || undefined), 350);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search, fetchReviewers]);

  const handleGenerate = async () => {
    if (mode === "topic" && !topic.trim()) return;
    if (mode === "file" && !file) return;

    setGenerating(true);
    setGenError(null);

    try {
      const { reviewer } = await generateReviewer(
        mode === "topic" ? topic.trim() : undefined,
        mode === "file" ? (file ?? undefined) : undefined,
      );
      await fetchReviewers(search || undefined);
      setTopic("");
      setFile(null);
      setViewerData(reviewer);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenReviewer = async (id: string) => {
    setLoadingViewer(true);
    try {
      const { reviewer } = await getReviewer(id);
      setViewerData(reviewer);
    } catch {
      // ignore
    } finally {
      setLoadingViewer(false);
    }
  };

  const handleBookmark = async (id: string) => {
    try {
      await toggleReviewerBookmark(id);
      setReviewers(prev =>
        prev.map(r => r.id === id ? { ...r, bookmarked: !r.bookmarked } : r),
      );
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReviewer(id);
      setReviewers(prev => prev.filter(r => r.id !== id));
      if (viewerData?.id === id) setViewerData(null);
    } catch { /* silent */ }
  };

  // Show reviewer detail
  if (viewerData) {
    return (
      <ReviewerViewer
        reviewer={viewerData}
        onBack={() => setViewerData(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" />
            Reviewer Library
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated study reviewers from topics or uploaded files
          </p>
        </div>
        <Badge variant="outline" className="hidden sm:flex gap-1 text-xs">
          <Sparkles className="h-3 w-3 text-primary" />
          AI-Powered
        </Badge>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border w-fit">
        {([
          { id: "generate" as MainTab, label: "Generate", icon: Sparkles },
          { id: "library" as MainTab, label: `My Library (${reviewers.length})`, icon: Library },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              mainTab === tab.id
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Generate Tab ── */}
        {mainTab === "generate" && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {generating ? (
              <Card>
                <CardContent className="p-6">
                  <GeneratingOverlay />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Create a New Reviewer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Mode toggle */}
                  <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border w-fit">
                    {([
                      { id: "topic" as GeneratorMode, label: "By Topic", icon: Brain },
                      { id: "file" as GeneratorMode, label: "Upload File", icon: Upload },
                    ] as const).map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                          mode === m.id
                            ? "bg-card text-foreground shadow-sm border border-border"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <m.icon className="h-3.5 w-3.5" />
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Topic input */}
                  {mode === "topic" && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Study Topic
                      </label>
                      <textarea
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="e.g. Photosynthesis, World War II, Calculus Derivatives, Python basics..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                      />
                      <p className="text-xs text-muted-foreground">
                        Be specific for better results. E.g. "The French Revolution and its causes" instead of just "History".
                      </p>
                    </div>
                  )}

                  {/* File upload */}
                  {mode === "file" && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Upload Study Material
                      </label>
                      <FileUploadZone file={file} onFileChange={setFile} />
                    </div>
                  )}

                  {/* Error */}
                  {genError && (() => {
                    const isRateLimit = genError.toLowerCase().includes("rate-limited") || genError.toLowerCase().includes("wait a minute");
                    return (
                      <div className={`flex items-start gap-2 p-3 rounded-xl text-sm border ${isRateLimit ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 text-amber-800 dark:text-amber-300" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{isRateLimit ? "Rate limit reached" : "Request failed"}</p>
                          <p className="mt-0.5 opacity-90">{genError}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Generate button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={generating || (mode === "topic" ? !topic.trim() : !file)}
                    className="w-full rounded-xl h-11 font-semibold"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Reviewer
                  </Button>

                  {/* Tip */}
                  <p className="text-xs text-center text-muted-foreground">
                    AI will generate a summary, key concepts, flashcards, a quiz, and exam questions.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent reviewers preview */}
            {reviewers.length > 0 && !generating && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Recently Generated</h3>
                  <button
                    onClick={() => setMainTab("library")}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reviewers.slice(0, 3).map(r => (
                    <ReviewerCard
                      key={r.id}
                      reviewer={r}
                      onView={() => handleOpenReviewer(r.id)}
                      onBookmark={() => handleBookmark(r.id)}
                      onDelete={() => handleDelete(r.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Library Tab ── */}
        {mainTab === "library" && (
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search reviewers by topic..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
              {search && (
                <button
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* List */}
            {loadingList ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : reviewers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Library className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">
                    {search ? "No reviewers found" : "Your library is empty"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {search
                      ? `No reviewers match "${search}"`
                      : "Generate your first reviewer by entering a topic or uploading a study file."}
                  </p>
                </div>
                {!search && (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setMainTab("generate")}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate First Reviewer
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {reviewers.map(r => (
                  <ReviewerCard
                    key={r.id}
                    reviewer={r}
                    onView={() => handleOpenReviewer(r.id)}
                    onBookmark={() => handleBookmark(r.id)}
                    onDelete={() => handleDelete(r.id)}
                  />
                ))}
              </div>
            )}

            {loadingViewer && (
              <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full"
                  />
                  <p className="text-sm font-medium">Loading reviewer...</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
