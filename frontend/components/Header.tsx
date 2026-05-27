"use client";
import { motion } from "framer-motion";
import { Menu, Bell, Zap, BookOpen, Settings, Brain, BarChart2, Home, Timer, LogOut, Flame, ListTodo, Clock, AlertCircle, CheckCircle2, UserCircle, Trophy } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getGreeting } from "@/lib/utils";
import { ThemeLogo } from "@/components/ThemeLogo";

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  dueTime: string;
  priority: string;
}

function getAlertTasks(tasks: Task[]) {
  const now = Date.now();
  return tasks
    .filter(t => t.status !== "done" && t.dueDate)
    .map(t => {
      const due = new Date(`${t.dueDate}T${t.dueTime || "23:59"}`).getTime();
      const msLeft = due - now;
      return { ...t, msLeft, due };
    })
    .filter(t => t.msLeft <= 24 * 60 * 60 * 1000) // within 24h or overdue
    .sort((a, b) => a.msLeft - b.msLeft);
}

function formatTimeLeft(ms: number) {
  if (ms < 0) return "Overdue";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 1) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m left`;
  return "Due now";
}

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  streak: number;
  username?: string;
  avatar?: string;
  onLogout?: () => void;
  tasks?: Task[];
}

const mobileNavItems = [
  { id: "dashboard", icon: Home, label: "Dashboard" },
  { id: "timer", icon: Timer, label: "Focus Timer" },
  { id: "assistant", icon: Brain, label: "AI Assistant" },
  { id: "stats", icon: BarChart2, label: "Analytics" },
  { id: "notes", icon: BookOpen, label: "Study Notes" },
  { id: "todo", icon: ListTodo, label: "To-Do List" },
  { id: "profile", icon: UserCircle, label: "Profile" },
  { id: "settings", icon: Settings, label: "Settings" },
];

function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Header({ activeTab, onTabChange, streak, username, avatar: avatarProp, onLogout, tasks: tasksProp }: HeaderProps) {
  const initials = getInitials(username);
  const [alertTasks, setAlertTasks] = useState<ReturnType<typeof getAlertTasks>>([]);
  const [avatar, setAvatar] = useState(avatarProp ?? "");

  useEffect(() => {
    const onProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.avatar !== undefined) setAvatar(detail.avatar);
    };
    window.addEventListener("taskzen_profile_updated", onProfileUpdated);
    return () => window.removeEventListener("taskzen_profile_updated", onProfileUpdated);
  }, []);

  // Update avatar when prop changes (e.g. after profile load)
  useEffect(() => {
    if (avatarProp !== undefined) setAvatar(avatarProp);
  }, [avatarProp]);

  const refreshTasks = useCallback(() => {
    if (tasksProp) {
      setAlertTasks(getAlertTasks(tasksProp));
    }
  }, [tasksProp]);

  useEffect(() => {
    refreshTasks();
    const id = setInterval(refreshTasks, 30_000);
    window.addEventListener("taskzen_todos_updated", refreshTasks);
    return () => {
      clearInterval(id);
      window.removeEventListener("taskzen_todos_updated", refreshTasks);
    };
  }, [refreshTasks]);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 lg:px-6 bg-card/80 backdrop-blur-xl border-b border-border"
    >
      {/* Mobile menu */}
      <div className="flex items-center gap-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <img src="/taskzen.png" alt="TaskZen" className="w-8 h-8 object-contain" />
                <SheetTitle className="text-base font-bold">TaskZen</SheetTitle>
              </div>
            </SheetHeader>
            <nav className="p-3 flex flex-col gap-1">
              {mobileNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent/10"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
              {onLogout && (
                <>
                  <div className="border-t border-border my-2" />
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-1.5">
          <ThemeLogo className="w-7 h-7 object-contain" />
          <span className="font-bold text-sm">TaskZen</span>
        </div>
      </div>

      {/* Desktop greeting */}
      <div className="hidden lg:flex items-center gap-2 ml-1">
        <span className="text-sm text-muted-foreground">{getGreeting()},</span>
        <span className="text-sm font-semibold text-foreground">{username ?? "there"}</span>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {streak > 0 && (
          <Badge variant="orange" className="hidden sm:flex items-center gap-1 px-2.5 py-1">
            <Flame className="h-3.5 w-3.5" />
            <span>{streak} day streak</span>
          </Badge>
        )}
        <DropdownMenu onOpenChange={refreshTasks}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
              <Bell className="h-4 w-4" />
              {alertTasks.length > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 border-2 border-background text-white text-[8px] font-bold flex items-center justify-center">
                  {alertTasks.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {alertTasks.length > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{alertTasks.length}</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* System message */}
            {alertTasks.length > 0 && (
              <div className="mx-2 mb-2 mt-1 flex items-start gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
                <span className="text-lg shrink-0">📋</span>
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    TaskZen Reminder
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                    You have <span className="font-bold">{alertTasks.length} task{alertTasks.length > 1 ? "s" : ""}</span> that need{alertTasks.length === 1 ? "s" : ""} to be finished. Stay on track and complete them before they&apos;re due!
                  </p>
                </div>
              </div>
            )}
            {alertTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <p className="text-xs text-muted-foreground">All clear! No tasks due in the next 24 hours.</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {alertTasks.map(t => {
                  const overdue = t.msLeft < 0;
                  return (
                    <DropdownMenuItem
                      key={t.id}
                      className="flex items-start gap-3 p-3 cursor-pointer"
                      onClick={() => onTabChange("todo")}
                    >
                      {overdue
                        ? <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        : <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{t.title}</p>
                        <p className={`text-[11px] mt-0.5 font-medium ${overdue ? "text-red-500" : "text-amber-500"}`}>
                          {formatTimeLeft(t.msLeft)}
                        </p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 capitalize ${
                        t.priority === "high" ? "bg-red-100 text-red-600 dark:bg-red-900/40"
                        : t.priority === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40"
                        : "bg-green-100 text-green-600 dark:bg-green-900/40"
                      }`}>
                        {t.priority}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-center justify-center text-muted-foreground" onClick={() => onTabChange("todo")}>
              View all tasks
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />

        {/* Avatar with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
              <Avatar className="h-8 w-8 cursor-pointer">
                {avatar && <AvatarImage src={avatar} alt={username ?? "User"} className="object-cover" />}
                <AvatarFallback className="text-xs gradient-blue text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{username ?? "User"}</span>
                <span className="text-xs text-muted-foreground truncate">TaskZen Student</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onTabChange("profile")}>
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTabChange("settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTabChange("stats")}>
                <BarChart2 className="mr-2 h-4 w-4" />
                Analytics
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {onLogout && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
