"use client";

import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/export-csv";
import { downloadZip } from "@/lib/export-zip";
import type { AnalysisResult } from "@/lib/types";

interface ExportButtonsProps {
  results: AnalysisResult[];
  onClear?: () => void;
}

export function ExportButtons({ results, onClear }: ExportButtonsProps) {
  if (results.length === 0) return null;

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white"
        onClick={() => downloadCsv(results)}
      >
        Scarica CSV
      </Button>
      <Button
        variant="outline"
        className="bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white"
        onClick={() => downloadZip(results)}
      >
        Scarica ZIP (immagini rinominate)
      </Button>
      {onClear && (
        <Button variant="outline" onClick={onClear}>
          Nuova Analisi
        </Button>
      )}
    </div>
  );
}
