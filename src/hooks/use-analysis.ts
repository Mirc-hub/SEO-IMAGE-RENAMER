"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AnalysisResult, LogEntry } from "@/lib/types";
import type { ImageFile } from "@/components/image-input";
import { SUPPORTED_EXTENSIONS } from "@/lib/constants";

const STORAGE_KEY = "seo-image-renamer-session";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface AnalysisState {
  results: AnalysisResult[];
  logs: LogEntry[];
  isRunning: boolean;
  progress: number;
  current: number;
  total: number;
}

function loadSession(): Partial<AnalysisState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return {
      results: data.results || [],
      logs: data.logs || [],
      progress: data.progress || 0,
      current: data.current || 0,
      total: data.total || 0,
    };
  } catch {
    return {};
  }
}

function saveSession(state: AnalysisState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        results: state.results,
        logs: state.logs,
        progress: state.progress,
        current: state.current,
        total: state.total,
      })
    );
  } catch {
    // localStorage full or unavailable
  }
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    results: [],
    logs: [],
    isRunning: false,
    progress: 0,
    current: 0,
    total: 0,
  });

  const initializedRef = useRef(false);
  const cancelRef = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const saved = loadSession();
    if (saved.results && saved.results.length > 0) {
      setState((prev) => ({ ...prev, ...saved, isRunning: false }));
    }
  }, []);

  // Save to localStorage when results change
  useEffect(() => {
    if (initializedRef.current && state.results.length > 0) {
      saveSession(state);
    }
  }, [state]);

  const addLog = useCallback((message: string, level: LogEntry["level"]) => {
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, { message, level }],
    }));
  }, []);

  const startAnalysis = useCallback(
    async (
      files: ImageFile[],
      urlsRaw: string,
      keywords: string,
      siteUrl: string,
      model: string,
      language: string = "it",
      delayMs: number = 4500
    ) => {
      cancelRef.current = false;

      setState({
        results: [],
        logs: [],
        isRunning: true,
        progress: 0,
        current: 0,
        total: 0,
      });

      type Job = { name: string; extension: string; dataBase64: string };
      const jobs: Job[] = [];

      // Local files
      for (const f of files) {
        jobs.push({ name: f.name, extension: f.extension, dataBase64: f.dataBase64 });
        addLog(`Caricata: ${f.name}`, "info");
      }

      // URL images
      const urls = urlsRaw
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      for (const url of urls) {
        addLog(`Scaricamento: ${url}`, "info");
        try {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const blob = await resp.blob();
          const buffer = await blob.arrayBuffer();
          const base64 = btoa(
            String.fromCharCode(...new Uint8Array(buffer))
          );

          const urlPath = url.split("?")[0].split("#")[0];
          let name = urlPath.split("/").pop() || "image.jpg";
          let ext = "." + name.split(".").pop()?.toLowerCase();
          if (!SUPPORTED_EXTENSIONS.has(ext)) {
            ext = ".jpg";
            name = name.includes(".") ? name : name + ext;
          }

          jobs.push({ name, extension: ext, dataBase64: base64 });
          addLog(`Scaricata: ${name}`, "success");
        } catch (err) {
          addLog(`Impossibile scaricare ${url}: ${err}`, "error");
        }
      }

      const total = jobs.length;
      if (total === 0) {
        addLog("Nessuna immagine valida trovata.", "error");
        setState((prev) => ({ ...prev, isRunning: false }));
        return;
      }

      setState((prev) => ({ ...prev, total }));
      addLog(`Avvio analisi di ${total} immagini...`, "info");

      const results: AnalysisResult[] = [];
      const usedNames: Record<string, number> = {};

      for (let i = 0; i < total; i++) {
        if (cancelRef.current) {
          addLog("Analisi interrotta dall'utente.", "error");
          break;
        }

        const job = jobs[i];
        addLog(`[${i + 1}/${total}] Analisi: ${job.name}...`, "info");

        try {
          const resp = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: job.dataBase64,
              originalName: job.name,
              extension: job.extension,
              keywords,
              siteUrl,
              model,
              language,
            }),
          });

          if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${resp.status}`);
          }

          const data = await resp.json();

          // Duplicate name handling
          let baseSeo = data.filename.replace(/\.[^.]+$/, "");
          baseSeo = baseSeo.replace(/-\d+$/, "");

          let finalName: string;
          if (baseSeo in usedNames) {
            usedNames[baseSeo] += 1;
            finalName = `${baseSeo}-${usedNames[baseSeo]}${job.extension}`;
          } else {
            usedNames[baseSeo] = 0;
            finalName = `${baseSeo}${job.extension}`;
          }

          const result: AnalysisResult = {
            originalName: job.name,
            seoName: finalName,
            altText: data.alt_text || "",
            imageData: job.dataBase64,
            extension: job.extension,
          };

          results.push(result);
          addLog(`  -> ${finalName}`, "success");

          setState((prev) => ({
            ...prev,
            results: [...prev.results, result],
            current: i + 1,
            progress: ((i + 1) / total) * 100,
          }));
        } catch (err) {
          addLog(`Analisi fallita per ${job.name}: ${err}`, "error");
          setState((prev) => ({
            ...prev,
            current: i + 1,
            progress: ((i + 1) / total) * 100,
          }));
        }

        // Delay between requests (skip after last)
        if (i < total - 1 && !cancelRef.current) {
          await sleep(delayMs);
        }
      }

      addLog(
        `Analisi completata! ${results.length}/${total} immagini elaborate.`,
        "success"
      );
      setState((prev) => ({ ...prev, isRunning: false }));
    },
    [addLog]
  );

  const stopAnalysis = useCallback(() => {
    cancelRef.current = true;
    addLog(
      "Interruzione richiesta. Attendi la fine dell'immagine corrente...",
      "error"
    );
  }, [addLog]);

  const updateResult = useCallback(
    (index: number, field: "seoName" | "altText", value: string) => {
      setState((prev) => {
        const updated = [...prev.results];
        if (updated[index]) {
          updated[index] = { ...updated[index], [field]: value };
        }
        return { ...prev, results: updated };
      });
    },
    []
  );

  const loadResults = useCallback((results: AnalysisResult[]) => {
    setState({
      results,
      logs: [{ message: `Caricati ${results.length} risultati dalla cronologia.`, level: "info" }],
      isRunning: false,
      progress: 100,
      current: results.length,
      total: results.length,
    });
  }, []);

  const clearSession = useCallback(() => {
    setState({
      results: [],
      logs: [],
      isRunning: false,
      progress: 0,
      current: 0,
      total: 0,
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    ...state,
    startAnalysis,
    stopAnalysis,
    updateResult,
    loadResults,
    clearSession,
  };
}
