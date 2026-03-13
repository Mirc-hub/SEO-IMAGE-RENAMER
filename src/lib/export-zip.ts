import JSZip from "jszip";
import type { AnalysisResult } from "./types";

export async function downloadZip(results: AnalysisResult[]) {
  const zip = new JSZip();

  for (const r of results) {
    const binaryStr = atob(r.imageData);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    zip.file(r.seoName, bytes);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "immagini-seo-rinominate.zip";
  a.click();
  URL.revokeObjectURL(url);
}
