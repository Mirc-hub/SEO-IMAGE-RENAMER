export interface AnalyzeRequest {
  imageBase64: string;
  originalName: string;
  extension: string;
  keywords: string;
  siteUrl: string;
  model: string;
  language?: string;
}

export interface AnalyzeResponse {
  filename: string;
  alt_text: string;
}

export interface AnalysisResult {
  originalName: string;
  seoName: string;
  altText: string;
  imageData: string; // base64 of original image
  extension: string;
}

export type LogLevel = "info" | "success" | "error";

export interface LogEntry {
  message: string;
  level: LogLevel;
}
