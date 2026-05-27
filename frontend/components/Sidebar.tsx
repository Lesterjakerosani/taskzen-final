"use client";
import { motion } from "framer-motion";
import { Timer, BarChart2, BookOpen, Settings, Zap, Home, ListTodo, UserCircle, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ThemeLogo } from "@/components/ThemeLogo";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "dashboard", icon: Home, label: "Dashboard" },
  { id: "timer", icon: Timer, label: "Focus Timer" },
  { id: "reviewer", icon: Library, label: "Reviewer Library" },
  { id: "stats", icon: BarChart2, label: "Analytics" },
  { id: "notes", icon: BookOpen, label: "Study Notes" },
  { id: "todo", icon: ListTodo, label: "To-Do List" },
  { id: "profile", icon: UserCircle, label: "Profile" },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="hidden lg:flex flex-col items-center w-16 min-h-screen bg-card border-r border-border py-4 gap-1 fixed top-0 left-0 z-30"
      >
        {/* Logo */}
        <div className="mb-4">
          <ThemeLogo className="w-10 h-10 object-contain" style={{ borderRadius: "10px" }} />
        </div>

        <div className="flex-1 flex flex-col gap-1 w-full px-2">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "relative flex items-center justify-center w-full h-10 rounded-xl transition-all duration-200",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-accent/10 hover:text-primary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-primary rounded-xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange("settings")}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                activeTab === "settings"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent/10 hover:text-primary"
              )}
            >
              <Settings className="h-5 w-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </motion.aside>
    </TooltipProvider>
  );
}
