"use client";

import { usePathname } from "next/navigation";
import {
  Bell, Search, Menu, GraduationCap,
  ChevronDown, LogOut, User, Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const routeTitles: Record<string, string> = {
  "/school":               "Dashboard",
  "/school/students":      "Students",
  "/school/teachers":      "Teachers",
  "/school/subjects":      "Subjects",
  "/school/classes":       "Classes",
  "/school/attendance":    "Attendance",
  "/school/grades":        "Grades",
  "/school/schedule":      "Schedule",
  "/school/announcements": "Announcements",
  "/school/reports":       "Reports",
  "/school/settings":      "Settings",
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function SchoolHeader({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const title = routeTitles[pathname] ?? "School Management";

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center gap-3 px-4 lg:px-6 flex-shrink-0 z-10">
      {/* Mobile hamburger */}
      <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={onMenuClick}>
        <Menu className="w-5 h-5" />
      </Button>

      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Desktop page title */}
      <h1 className="hidden lg:block text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
        {title}
      </h1>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search students, teachers..."
          className="pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-300 dark:focus:border-blue-700 rounded-xl outline-none transition-all duration-200 w-56 focus:w-72 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative shrink-0">
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-950" />
      </Button>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none">
            <div className="w-8 h-8 bg-[#1E3A8A] rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">AD</span>
            </div>
            <div className="hidden md:flex flex-col items-start leading-none">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Admin</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Administrator</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
          <DropdownMenuItem className="rounded-lg cursor-pointer">
            <User className="w-4 h-4 mr-2 text-slate-500" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-lg cursor-pointer">
            <Settings className="w-4 h-4 mr-2 text-slate-500" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="rounded-lg text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
