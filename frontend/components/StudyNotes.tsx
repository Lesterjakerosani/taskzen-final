"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, Pencil, X, Check, SlidersHorizontal, BookOpen, Tag, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getNotes, createNote, updateNote, deleteNote, type Note } from "@/lib/api";

const CATEGORIES = ["General", "Math", "Science", "History", "Language", "Programming", "Other"];
const CATEGORY_COLORS: Record<string, string> = {
  General:     "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
  Math:        "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300",
  Science:     "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300",
  History:     "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300",
  Language:    "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300",
  Programming: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-300",
  Other:       "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function StudyNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("General");

  useEffect(() => {
    setLoading(true);
    getNotes()
      .then(({ notes }) => setNotes(notes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditingNote(null);
    setFormTitle(""); setFormContent(""); setFormCategory("General");
    setModalOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title); setFormContent(note.content); setFormCategory(note.category);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() && !formContent.trim()) return;
    setSaving(true);
    try {
      if (editingNote) {
        const { note } = await updateNote(editingNote.id, { title: formTitle, content: formContent, category: formCategory });
        setNotes(prev => prev.map(n => n.id === editingNote.id ? note : n));
      } else {
        const { note } = await createNote({ title: formTitle || "Untitled", content: formContent, category: formCategory });
        setNotes(prev => [note, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const filtered = useMemo(() => {
    return notes.filter(n => {
      const matchSearch = !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === "All" || n.category === filterCategory;
      const matchDate = !filterDate || n.createdAt.startsWith(filterDate);
      return matchSearch && matchCat && matchDate;
    });
  }, [notes, search, filterCategory, filterDate]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Study Notes</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 bg-foreground text-background text-xs font-semibold hover:opacity-80 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          New Note
        </button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-medium transition-colors ${
            showFilters || filterCategory !== "All" || filterDate
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
          {(filterCategory !== "All" || filterDate) && (
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
          )}
        </button>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Tag className="h-3 w-3" /> Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", ...CATEGORIES].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                          filterCategory === cat
                            ? "bg-foreground text-background border-foreground"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:w-48 space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Calendar className="h-3 w-3" /> Date
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      aria-label="Filter by date"
                      value={filterDate}
                      onChange={e => setFilterDate(e.target.value)}
                      className="flex-1 text-xs px-2 py-1.5 bg-background border border-border text-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                    {filterDate && (
                      <button aria-label="Clear date filter" onClick={() => setFilterDate("")} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {(filterCategory !== "All" || filterDate) && (
                  <button
                    onClick={() => { setFilterCategory("All"); setFilterDate(""); }}
                    className="self-end text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {notes.length === 0 ? "No notes yet — create your first one!" : "No notes match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filtered.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
              >
                <Card className="group hover:border-foreground/20 transition-colors h-full">
                  <CardContent className="p-4 flex flex-col h-full gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground leading-snug flex-1 line-clamp-2">
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button aria-label="Edit note" onClick={() => openEdit(note)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button aria-label="Delete note" onClick={() => setDeleteId(note.id)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {note.content && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 flex-1">
                        {note.content}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1 mt-auto">
                      <span className={`text-[0.65rem] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[note.category] ?? CATEGORY_COLORS.Other}`}>
                        {note.category}
                      </span>
                      <span className="text-[0.65rem] text-muted-foreground">{formatDate(note.updatedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-card border border-border shadow-xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-sm font-semibold">{editingNote ? "Edit Note" : "New Note"}</h3>
                <button aria-label="Close" onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Note title"
                  className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                />
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder="Write your note here..."
                  rows={6}
                  className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors resize-none"
                />
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                          formCategory === cat
                            ? "bg-foreground text-background border-foreground"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={(!formTitle.trim() && !formContent.trim()) || saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs bg-foreground text-background font-semibold hover:opacity-80 transition-opacity disabled:opacity-30"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {editingNote ? "Save Changes" : "Create Note"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm bg-card border border-border shadow-xl p-6 space-y-4"
            >
              <h3 className="text-sm font-semibold">Delete note?</h3>
              <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteId && handleDelete(deleteId)}
                  className="px-4 py-2 text-xs bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
