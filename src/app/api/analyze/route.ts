import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/gemini";
import type { AnalyzeRequest, AnalyzeResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body: AnalyzeRequest = await request.json();
    const { imageBase64, keywords, siteUrl, model } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(imageBase64, "base64");

    const result: AnalyzeResponse = await analyzeImage(
      apiKey,
      model,
      imageBuffer,
      keywords,
      siteUrl
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
