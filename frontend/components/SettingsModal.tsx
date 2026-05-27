"use client";
import { useState } from "react";
import { Settings, Volume2, Timer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { TimerSettings } from "@/types";

interface SettingsModalProps {
  settings: TimerSettings;
  onSave: (settings: Partial<TimerSettings>) => void;
}

export function SettingsModal({ settings, onSave }: SettingsModalProps) {
  const [local, setLocal] = useState(settings);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSave(local);
    setOpen(false);
  };

  const Field = ({ label, value, onChange, min = 1, max = 60 }: {
    label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => onChange(Math.max(min, value - 1))}>-</Button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
        <Button variant="outline" size="icon-sm" onClick={() => onChange(Math.min(max, value + 1))}>+</Button>
        <span className="text-xs text-muted-foreground w-6">min</span>
      </div>
    </div>
  );

  const Toggle = ({ label, description, checked, onChange }: {
    label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Timer Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Durations */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Durations</h3>
            </div>
            <div className="bg-muted/40 rounded-xl px-4">
              <Field label="Focus Session" value={local.focusDuration} onChange={(v) => setLocal({ ...local, focusDuration: v })} />
              <Field label="Short Break" value={local.shortBreakDuration} onChange={(v) => setLocal({ ...local, shortBreakDuration: v })} max={30} />
              <Field label="Long Break" value={local.longBreakDuration} onChange={(v) => setLocal({ ...local, longBreakDuration: v })} max={60} />
              <Field label="Long Break Every" value={local.longBreakInterval} onChange={(v) => setLocal({ ...local, longBreakInterval: v })} min={2} max={8} />
            </div>
          </div>

          {/* Behavior */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Behavior</h3>
            </div>
            <div className="bg-muted/40 rounded-xl px-4">
              <Toggle label="Auto-start Breaks" description="Automatically start break when session ends" checked={local.autoStartBreaks} onChange={(v) => setLocal({ ...local, autoStartBreaks: v })} />
              <Toggle label="Auto-start Focus" description="Automatically start focus after break" checked={local.autoStartFocus} onChange={(v) => setLocal({ ...local, autoStartFocus: v })} />
              <Toggle label="Sound Notifications" description="Play sound when timer completes" checked={local.soundEnabled} onChange={(v) => setLocal({ ...local, soundEnabled: v })} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="flex-1 gradient-blue text-white" onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
