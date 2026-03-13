import type { AnalysisResult } from "./types";

export function generateCsv(results: AnalysisResult[]): string {
  const BOM = "\uFEFF";
  const header = "nome_originale,nome_seo,alt_text";
  const rows = results.map(
    (r) =>
      `"${r.originalName}","${r.seoName}","${r.altText.replace(/"/g, '""')}"`
  );
  return BOM + [header, ...rows].join("\n");
}

export function downloadCsv(results: AnalysisResult[]) {
  const csv = generateCsv(results);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "risultati-seo.csv";
  a.click();
  URL.revokeObjectURL(url);
}
