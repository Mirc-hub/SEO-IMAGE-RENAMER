"use client";

import { useState, useCallback, useEffect } from "react";
import type { AnalysisResult } from "@/lib/types";

const HISTORY_KEY = "seo-image-renamer-history";
const MAX_HISTORY = 20;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  keywords: string;
  model: string;
  results: AnalysisResult[];
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        setEntries(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToHistory = useCallback(
    (keywords: string, model: string, results: AnalysisResult[]) => {
      if (results.length === 0) return;

      const entry: HistoryEntry = {
        id: Date.now().toString(36),
        timestamp: Date.now(),
        keywords,
        model,
        // Store results without imageData to save space
        results: results.map((r) => ({
          ...r,
          imageData: "", // Don't store image bytes in history
        })),
      };

      setEntries((prev) => {
        const updated = [entry, ...prev].slice(0, MAX_HISTORY);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        } catch {
          // localStorage full
        }
        return updated;
      });
    },
    []
  );

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return { entries, saveToHistory, deleteEntry, clearHistory };
}
