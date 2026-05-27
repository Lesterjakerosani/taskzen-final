"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Building2,
  ClipboardList, Star, Calendar, Megaphone, BarChart2,
  Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",     href: "/school",              icon: LayoutDashboard },
  { label: "Students",      href: "/school/students",     icon: Users },
  { label: "Teachers",      href: "/school/teachers",     icon: GraduationCap },
  { label: "Subjects",      href: "/school/subjects",     icon: BookOpen },
  { label: "Classes",       href: "/school/classes",      icon: Building2 },
  { label: "Attendance",    href: "/school/attendance",   icon: ClipboardList },
  { label: "Grades",        href: "/school/grades",       icon: Star },
  { label: "Schedule",      href: "/school/schedule",     icon: Calendar },
  { label: "Announcements", href: "/school/announcements",icon: Megaphone },
  { label: "Reports",       href: "/school/reports",      icon: BarChart2 },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function SchoolSidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="relative hidden lg:flex flex-col h-full bg-[#1E3A8A] dark:bg-slate-900 flex-shrink-0 overflow-hidden border-r border-blue-950/40 dark:border-slate-800"
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 border-b border-white/10 flex-shrink-0 transition-all duration-250",
        isCollapsed ? "justify-center px-0" : "px-4 gap-3"
      )}>
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden whitespace-nowrap min-w-0"
            >
              <p className="text-white font-bold text-sm leading-none tracking-tight">AcademiaMS</p>
              <p className="text-blue-300 text-xs mt-0.5 font-medium">School Management</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = item.href === "/school"
            ? pathname === "/school"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl transition-all duration-150 group relative",
                isCollapsed ? "justify-center h-11 w-full" : "px-3 py-2.5",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-blue-200/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-colors",
                isActive ? "text-white" : "text-blue-300 group-hover:text-white"
              )} />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.13 }}
                    className="text-sm font-medium truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <div className="absolute right-2 w-1.5 h-5 bg-white/60 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 space-y-0.5 border-t border-white/10 pt-3 flex-shrink-0">
        <Link
          href="/school/settings"
          title={isCollapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl transition-all duration-150 group",
            isCollapsed ? "justify-center h-11 w-full" : "px-3 py-2.5",
            pathname === "/school/settings"
              ? "bg-white/15 text-white"
              : "text-blue-200/80 hover:bg-white/10 hover:text-white"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0 text-blue-300 group-hover:text-white transition-colors" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <button
          onClick={onToggle}
          title={isCollapsed ? "Expand" : "Collapse"}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl text-blue-200/80 hover:bg-white/10 hover:text-white transition-all duration-150",
            isCollapsed ? "justify-center h-11" : "px-3 py-2.5"
          )}
        >
          {isCollapsed
            ? <ChevronRight className="w-5 h-5 flex-shrink-0" />
            : (
              <>
                <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )
          }
        </button>
      </div>
    </motion.aside>
  );
}
