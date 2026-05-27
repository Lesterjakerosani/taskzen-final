"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getStats, type WeeklyDataPoint } from "@/lib/api";

interface TooltipEntry { dataKey: string; color: string; value: number; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string; }

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold mb-1.5 text-foreground">{label}</p>
      {payload.map((entry: TooltipEntry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
          <span className="font-medium text-foreground">
            {entry.dataKey === "focusMinutes" ? `${entry.value}m` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

interface ProductivityChartProps {
  weeklyData?: WeeklyDataPoint[];
}

export function ProductivityChart({ weeklyData: propData }: ProductivityChartProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>(propData ?? []);

  useEffect(() => {
    if (propData) {
      setWeeklyData(propData);
      return;
    }
    getStats()
      .then(({ weeklyData: data }) => setWeeklyData(data))
      .catch(console.error);
  }, [propData]);

  // Listen for new sessions to refresh chart
  useEffect(() => {
    const refresh = () => {
      getStats()
        .then(({ weeklyData: data }) => setWeeklyData(data))
        .catch(console.error);
    };
    window.addEventListener("taskzen_session_completed", refresh);
    return () => window.removeEventListener("taskzen_session_completed", refresh);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Productivity</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="area">
            <TabsList className="mb-4 h-8">
              <TabsTrigger value="area" className="text-xs px-3 py-1">Area</TabsTrigger>
              <TabsTrigger value="bar" className="text-xs px-3 py-1">Bar</TabsTrigger>
            </TabsList>

            <TabsContent value="area">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1877F2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#42A5F5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#42A5F5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <RechartTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="focusMinutes" name="Focus Minutes" stroke="#1877F2" strokeWidth={2.5} fill="url(#focusGrad)" dot={{ fill: "#1877F2", r: 3 }} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#42A5F5" strokeWidth={2} fill="url(#sessionsGrad)" dot={{ fill: "#42A5F5", r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="bar">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <RechartTooltip content={<CustomTooltip />} />
                  <Bar dataKey="focusMinutes" name="Focus Minutes" fill="#1877F2" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="sessions" name="Sessions" fill="#42A5F5" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
