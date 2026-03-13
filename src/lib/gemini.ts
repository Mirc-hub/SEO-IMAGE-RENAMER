import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt, type PromptLanguage } from "./system-prompt";
import { prepareImageForAnalysis } from "./image-processing";
import { MAX_RETRIES, INITIAL_RETRY_WAIT_MS } from "./constants";
import type { AnalyzeResponse } from "./types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeFilename(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf("."));
  const name = filename.substring(0, filename.lastIndexOf("."));
  const sanitized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9-]/g, "-")    // keep only a-z, 0-9, hyphens
    .replace(/-+/g, "-")            // collapse multiple hyphens
    .replace(/^-|-$/g, "");         // trim leading/trailing hyphens
  return (sanitized || "unnamed") + ext;
}

export async function analyzeImage(
  apiKey: string,
  model: string,
  imageBuffer: Buffer,
  keywords: string,
  siteUrl: string,
  language: PromptLanguage = "it"
): Promise<AnalyzeResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model });

  const systemPrompt = buildSystemPrompt(keywords, siteUrl, language);
  const compressedImage = await prepareImageForAnalysis(imageBuffer);

  let retryWait = INITIAL_RETRY_WAIT_MS;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await geminiModel.generateContent([
        systemPrompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: compressedImage.toString("base64"),
          },
        },
      ]);

      let text = response.response.text().trim();

      // Strip markdown code blocks if present
      if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }

      const result = JSON.parse(text);
      return {
        filename: sanitizeFilename(result.filename || "unnamed.jpg"),
        alt_text: result.alt_text || "",
      };
    } catch (error: unknown) {
      const errorStr = String(error);
      const isRateLimit =
        errorStr.includes("429") ||
        errorStr.toLowerCase().includes("quota") ||
        errorStr.toLowerCase().includes("rate");

      if (isRateLimit && attempt < MAX_RETRIES) {
        await sleep(retryWait);
        retryWait += INITIAL_RETRY_WAIT_MS;
        continue;
      }

      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}
