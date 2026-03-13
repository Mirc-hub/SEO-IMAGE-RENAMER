"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ConfigSection } from "@/components/config-section";
import { KeywordsInput } from "@/components/keywords-input";
import { ImageInput, type ImageFile } from "@/components/image-input";
import { ActionBar } from "@/components/action-bar";
import { ResultsTable } from "@/components/results-table";
import { ExportButtons } from "@/components/export-buttons";
import { LogArea } from "@/components/log-area";
import { HistoryPanel } from "@/components/history-panel";
import { useAnalysis } from "@/hooks/use-analysis";
import { useHistory } from "@/hooks/use-history";
import { DEFAULT_MODEL } from "@/lib/constants";
import type { AnalysisResult } from "@/lib/types";

export default function Home() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [siteUrl, setSiteUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [urls, setUrls] = useState("");

  const analysis = useAnalysis();
  const history = useHistory();
  const wasRunningRef = useRef(false);

  // Save to history when analysis completes
  useEffect(() => {
    if (wasRunningRef.current && !analysis.isRunning && analysis.results.length > 0) {
      history.saveToHistory(keywords, model, analysis.results);
    }
    wasRunningRef.current = analysis.isRunning;
  }, [analysis.isRunning, analysis.results, keywords, model, history]);

  const canStart =
    !analysis.isRunning &&
    (files.length > 0 || urls.trim().length > 0);

  const handleStart = () => {
    if (files.length === 0 && urls.trim().length === 0) {
      toast.error("Carica almeno un'immagine o inserisci un URL.");
      return;
    }

    if (urls.trim()) {
      const urlLines = urls.split("\n").map((u) => u.trim()).filter(Boolean);
      const invalidUrls = urlLines.filter((u) => {
        try {
          new URL(u);
          return false;
        } catch {
          return true;
        }
      });
      if (invalidUrls.length > 0) {
        toast.error(`URL non validi: ${invalidUrls.join(", ")}`);
        return;
      }
    }

    if (!keywords.trim()) {
      toast.warning("Nessuna keyword inserita. L'analisi prosegue senza keyword.");
    }

    analysis.startAnalysis(files, urls, keywords, siteUrl, model);
  };

  const handleLoadHistory = (results: AnalysisResult[], histKeywords: string, histModel: string) => {
    setKeywords(histKeywords);
    setModel(histModel);
    // Load results into current view (without imageData, so ZIP won't work but CSV/copy will)
    analysis.loadResults(results);
    toast.success("Sessione caricata dalla cronologia");
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            SEO Image Renamer
          </h1>
          <p className="text-sm text-muted-foreground">
            Rinomina le tue immagini in ottica SEO con Gemini AI
          </p>
        </div>

        <ConfigSection
          model={model}
          onModelChange={setModel}
          siteUrl={siteUrl}
          onSiteUrlChange={setSiteUrl}
          disabled={analysis.isRunning}
        />

        <KeywordsInput
          keywords={keywords}
          onKeywordsChange={setKeywords}
          disabled={analysis.isRunning}
        />

        <ImageInput
          files={files}
          onFilesChange={setFiles}
          urls={urls}
          onUrlsChange={setUrls}
          disabled={analysis.isRunning}
        />

        <ActionBar
          isRunning={analysis.isRunning}
          progress={analysis.progress}
          current={analysis.current}
          total={analysis.total}
          onStart={handleStart}
          onStop={analysis.stopAnalysis}
          canStart={canStart}
        />

        <ResultsTable results={analysis.results} onResultUpdate={analysis.updateResult} />

        <ExportButtons results={analysis.results} onClear={analysis.clearSession} />

        <LogArea logs={analysis.logs} />

        <HistoryPanel
          entries={history.entries}
          onLoad={handleLoadHistory}
          onDelete={history.deleteEntry}
          onClear={history.clearHistory}
        />
      </div>
    </main>
  );
}
