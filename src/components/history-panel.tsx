"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { HistoryEntry } from "@/hooks/use-history";
import type { AnalysisResult } from "@/lib/types";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onLoad: (results: AnalysisResult[], keywords: string, model: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryPanel({ entries, onLoad, onDelete, onClear }: HistoryPanelProps) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Cronologia analisi</p>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-muted-foreground">
          Cancella tutto
        </Button>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer text-sm"
            onClick={() => onLoad(entry.results, entry.keywords, entry.model)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {entry.keywords || "(nessuna keyword)"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(entry.timestamp)} — {entry.results.length} immagini — {entry.model}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
