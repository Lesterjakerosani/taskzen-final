"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Trash2, Pencil, X, Check, SlidersHorizontal,
  Calendar, Tag, Flag, Clock, CheckCircle2, Circle, Loader2, Bell
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getTasks, createTask, updateTask, deleteTask, type Task } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────
type Priority = "high" | "medium" | "low";
type Status   = "pending" | "in-progress" | "done";

const CATEGORIES = ["Study", "Personal", "Work", "Health", "Other"];

const PRIORITY_META: Record<Priority, { label: string; color: string; dot: string }> = {
  high:   { label: "High",   color: "text-red-500",    dot: "bg-red-500" },
  medium: { label: "Medium", color: "text-amber-500",  dot: "bg-amber-500" },
  low:    { label: "Low",    color: "text-green-500",  dot: "bg-green-500" },
};

const STATUS_META: Record<Status, { label: string; icon: React.ElementType; color: string }> = {
  pending:       { label: "Pending",     icon: Circle,       color: "text-muted-foreground" },
  "in-progress": { label: "In Progress", icon: Loader2,      color: "text-blue-500" },
  done:          { label: "Done",        icon: CheckCircle2, color: "text-green-500" },
};

const CAT_COLORS: Record<string, string> = {
  Study:    "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300",
  Personal: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300",
  Work:     "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300",
  Health:   "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300",
  Other:    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isOverdue(t: Task) {
  if (t.status === "done" || !t.dueDate) return false;
  const due = new Date(`${t.dueDate}T${t.dueTime || "23:59"}`);
  return due < new Date();
}

function formatDue(date: string, time: string) {
  if (!date) return null;
  const d = new Date(`${date}T${time || "00:00"}`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    (time ? ` · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}` : "");
}

const emptyForm = () => ({
  title: "", description: "", category: "Study",
  priority: "medium" as Priority, status: "pending" as Status, dueDate: "", dueTime: "",
});

// ─── Component ────────────────────────────────────────────────────────────────
export function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [fCategory, setFCategory] = useState("All");
  const [fPriority, setFPriority]  = useState("All");
  const [fStatus, setFStatus]      = useState("All");
  const [fDate, setFDate]          = useState("");

  const [modalOpen, setModalOpen]   = useState(false);
  const [editTask, setEditTask]     = useState<Task | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [form, setForm]             = useState(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  // Load tasks from API
  useEffect(() => {
    setLoadingTasks(true);
    getTasks()
      .then(({ tasks }) => {
        setTasks(tasks);
        // Notify dashboard of current tasks for notifications
        window.dispatchEvent(new CustomEvent("taskzen_todos_updated", { detail: tasks }));
      })
      .catch(console.error)
      .finally(() => setLoadingTasks(false));

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  const openCreate = () => { setEditTask(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit   = (t: Task) => {
    setEditTask(t);
    setForm({ title: t.title, description: t.description, category: t.category,
              priority: t.priority as Priority, status: t.status as Status,
              dueDate: t.dueDate, dueTime: t.dueTime });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editTask) {
        const { task } = await updateTask(editTask.id, form);
        setTasks(prev => prev.map(t => t.id === editTask.id ? task : t));
      } else {
        const { task } = await createTask(form);
        setTasks(prev => [task, ...prev]);
      }
      setModalOpen(false);
      window.dispatchEvent(new Event("taskzen_todos_updated"));
    } catch (err) {
      console.error("Failed to save task:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const newStatus = t.status === "done" ? "pending" : "done";
    try {
      const { task } = await updateTask(id, { status: newStatus });
      setTasks(prev => prev.map(x => x.id === id ? task : x));
      window.dispatchEvent(new Event("taskzen_todos_updated"));
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      setDeleteId(null);
      window.dispatchEvent(new Event("taskzen_todos_updated"));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const hasFilters = fCategory !== "All" || fPriority !== "All" || fStatus !== "All" || fDate;

  const filtered = useMemo(() => tasks.filter(t => {
    const q = search.toLowerCase();
    return (
      (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) &&
      (fCategory === "All" || t.category === fCategory) &&
      (fPriority === "All" || t.priority === fPriority) &&
      (fStatus   === "All" || t.status   === fStatus) &&
      (!fDate || t.dueDate === fDate)
    );
  }), [tasks, search, fCategory, fPriority, fStatus, fDate]);

  const counts = useMemo(() => ({
    total: tasks.length,
    done:  tasks.filter(t => t.status === "done").length,
    overdue: tasks.filter(isOverdue).length,
  }), [tasks]);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">To-Do List</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loadingTasks ? "Loading..." : `${counts.done}/${counts.total} completed`}
            {counts.overdue > 0 && <span className="text-red-500 ml-2">· {counts.overdue} overdue</span>}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 bg-foreground text-background text-xs font-semibold hover:opacity-80 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </button>
      </div>

      {/* Notification permission banner */}
      <AnimatePresence>
        {notifPermission === "default" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Enable notifications to get reminders when tasks are due soon.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={requestPermission}
                className="text-xs px-3 py-1.5 bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
              >
                Enable
              </button>
              <button
                aria-label="Dismiss"
                onClick={() => setNotifPermission("denied")}
                className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
        {notifPermission === "granted" && tasks.some(t => t.dueDate && t.status !== "done") && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
          >
            <Bell className="h-3.5 w-3.5 text-green-500" />
            <p className="text-xs text-green-700 dark:text-green-300">
              Notifications active — you&apos;ll be reminded at 24h, 12h, 1h, and 30 min before each task.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-medium transition-colors ${
            showFilters || hasFilters
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
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
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Tag className="h-3 w-3" />Category</label>
                  <div className="flex flex-wrap gap-1">
                    {["All", ...CATEGORIES].map(c => (
                      <button key={c} onClick={() => setFCategory(c)}
                        className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${fCategory === c ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Flag className="h-3 w-3" />Priority</label>
                  <div className="flex flex-wrap gap-1">
                    {["All", "high", "medium", "low"].map(p => (
                      <button key={p} onClick={() => setFPriority(p)}
                        className={`px-2 py-0.5 text-xs rounded-full border capitalize transition-colors ${fPriority === p ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><CheckCircle2 className="h-3 w-3" />Status</label>
                  <div className="flex flex-wrap gap-1">
                    {["All", "pending", "in-progress", "done"].map(s => (
                      <button key={s} onClick={() => setFStatus(s)}
                        className={`px-2 py-0.5 text-xs rounded-full border capitalize transition-colors ${fStatus === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Calendar className="h-3 w-3" />Due Date</label>
                  <div className="flex items-center gap-2">
                    <input type="date" aria-label="Filter by due date" value={fDate} onChange={e => setFDate(e.target.value)}
                      className="flex-1 text-xs px-2 py-1.5 bg-background border border-border text-foreground focus:outline-none focus:border-foreground/40 transition-colors" />
                    {fDate && <button aria-label="Clear date filter" onClick={() => setFDate("")} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
                  </div>
                </div>
              </CardContent>
              {hasFilters && (
                <div className="px-4 pb-3">
                  <button onClick={() => { setFCategory("All"); setFPriority("All"); setFStatus("All"); setFDate(""); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Clear all filters
                  </button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task list */}
      {loadingTasks ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {tasks.length === 0 ? "No tasks yet — add your first one!" : "No tasks match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((task, i) => {
              const overdue = isOverdue(task);
              const StatusIcon = STATUS_META[task.status as Status]?.icon ?? Circle;
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18, delay: i * 0.03 }}
                >
                  <Card className={`group transition-colors hover:border-foreground/20 ${task.status === "done" ? "opacity-60" : ""}`}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <button
                        onClick={() => toggleDone(task.id)}
                        className={`mt-0.5 shrink-0 transition-colors ${task.status === "done" ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {task.status === "done"
                          ? <CheckCircle2 className="h-[18px] w-[18px]" />
                          : <Circle className="h-[18px] w-[18px]" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium leading-snug ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button aria-label="Edit task" onClick={() => openEdit(task)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button aria-label="Delete task" onClick={() => setDeleteId(task.id)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`text-[0.6rem] px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[task.category] ?? CAT_COLORS.Other}`}>
                            {task.category}
                          </span>
                          <span className={`flex items-center gap-1 text-[0.6rem] font-medium ${PRIORITY_META[task.priority as Priority]?.color ?? ""}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_META[task.priority as Priority]?.dot ?? ""}`} />
                            {PRIORITY_META[task.priority as Priority]?.label ?? task.priority}
                          </span>
                          <span className={`flex items-center gap-1 text-[0.6rem] font-medium ${STATUS_META[task.status as Status]?.color ?? ""}`}>
                            <StatusIcon className="h-3 w-3" />
                            {STATUS_META[task.status as Status]?.label ?? task.status}
                          </span>
                          {task.dueDate && (
                            <span className={`flex items-center gap-1 text-[0.6rem] font-medium ${overdue ? "text-red-500" : "text-muted-foreground"}`}>
                              <Clock className="h-3 w-3" />
                              {overdue && "Overdue · "}
                              {formatDue(task.dueDate, task.dueTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-card border border-border shadow-xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-sm font-semibold">{editTask ? "Edit Task" : "New Task"}</h3>
                <button aria-label="Close" onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Task title *"
                  className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                />
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Calendar className="h-3 w-3" />Due Date</label>
                    <input type="date" aria-label="Due date" value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full text-xs px-2 py-1.5 bg-background border border-border text-foreground focus:outline-none focus:border-foreground/40 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Clock className="h-3 w-3" />Time</label>
                    <input type="time" aria-label="Due time" value={form.dueTime}
                      onChange={e => setForm(f => ({ ...f, dueTime: e.target.value }))}
                      className="w-full text-xs px-2 py-1.5 bg-background border border-border text-foreground focus:outline-none focus:border-foreground/40 transition-colors" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Tag className="h-3 w-3" />Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${form.category === c ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Flag className="h-3 w-3" />Priority</label>
                  <div className="flex gap-2">
                    {(["high", "medium", "low"] as Priority[]).map(p => (
                      <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                        className={`flex-1 py-1.5 text-xs font-medium rounded border capitalize transition-colors ${form.priority === p ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${PRIORITY_META[p].dot}`} />
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
                <button onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/40 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={!form.title.trim() || saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs bg-foreground text-background font-semibold hover:opacity-80 transition-opacity disabled:opacity-30">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {editTask ? "Save Changes" : "Add Task"}
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm bg-card border border-border shadow-xl p-6 space-y-4"
            >
              <h3 className="text-sm font-semibold">Delete task?</h3>
              <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button onClick={() => deleteId && handleDelete(deleteId)}
                  className="px-4 py-2 text-xs bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">
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
