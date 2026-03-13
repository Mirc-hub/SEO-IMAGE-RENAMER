import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt, type PromptLanguage } from "./system-prompt";
import { prepareImageForAnalysis } from "./image-processing";
import { MAX_RETRIES, INITIAL_RETRY_WAIT_MS } from "./constants";
import type { AnalyzeResponse } from "./types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
        filename: result.filename || "unnamed.jpg",
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
