export const SUPPORTED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
]);

export const GEMINI_MODELS = [
  { value: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite (Preview)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
];

export const DEFAULT_MODEL = "gemini-3.1-flash-lite-preview";

export const PROMPT_LANGUAGES = [
  { value: "it", label: "Italiano" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
] as const;

export const DEFAULT_LANGUAGE = "it";

export const REQUEST_DELAY_MS = 4500; // 4.5s between requests

export const MIN_DELAY_MS = 1000;
export const MAX_DELAY_MS = 10000;

export const MAX_RETRIES = 3;
export const INITIAL_RETRY_WAIT_MS = 30000; // 30s, increases by 30s each retry
