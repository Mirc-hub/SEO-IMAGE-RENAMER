"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ActionBarProps {
  isRunning: boolean;
  progress: number;
  current: number;
  total: number;
  onStart: () => void;
  onStop: () => void;
  canStart: boolean;
}

export function ActionBar({
  isRunning,
  progress,
  current,
  total,
  onStart,
  onStop,
  canStart,
}: ActionBarProps) {
  return (
    <div className="flex items-center gap-3">
      <Button onClick={onStart} disabled={!canStart || isRunning}>
        Avvia Analisi
      </Button>
      <Button
        variant="destructive"
        onClick={onStop}
        disabled={!isRunning}
      >
        Ferma
      </Button>
      <div className="flex-1 space-y-1">
        <Progress value={progress} className="h-2" />
        {total > 0 && (
          <p className="text-xs text-muted-foreground">
            {current}/{total} immagini elaborate
            {isRunning && current < total && (() => {
              const remaining = total - current;
              const seconds = Math.ceil(remaining * 4.5);
              const min = Math.floor(seconds / 60);
              const sec = seconds % 60;
              return ` — ~${min > 0 ? `${min}m ` : ""}${sec}s rimanenti`;
            })()}
          </p>
        )}
      </div>
    </div>
  );
}
