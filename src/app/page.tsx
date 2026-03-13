"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfigSection } from "@/components/config-section";
import { KeywordsInput } from "@/components/keywords-input";
import { ImageInput, type ImageFile } from "@/components/image-input";
import { ActionBar } from "@/components/action-bar";
import { ResultsTable } from "@/components/results-table";
import { ExportButtons } from "@/components/export-buttons";
import { LogArea } from "@/components/log-area";
import { useAnalysis } from "@/hooks/use-analysis";
import { DEFAULT_MODEL } from "@/lib/constants";

export default function Home() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [siteUrl, setSiteUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [urls, setUrls] = useState("");

  const analysis = useAnalysis();

  const canStart =
    !analysis.isRunning &&
    (files.length > 0 || urls.trim().length > 0);

  const handleStart = () => {
    if (files.length === 0 && urls.trim().length === 0) {
      toast.error("Carica almeno un'immagine o inserisci un URL.");
      return;
    }

    // Validate URLs format
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
      </div>
    </main>
  );
}
