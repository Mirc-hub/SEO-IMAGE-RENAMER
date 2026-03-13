"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GEMINI_MODELS, PROMPT_LANGUAGES, MIN_DELAY_MS, MAX_DELAY_MS } from "@/lib/constants";

interface ConfigSectionProps {
  model: string;
  onModelChange: (model: string) => void;
  siteUrl: string;
  onSiteUrlChange: (url: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  delayMs: number;
  onDelayChange: (ms: number) => void;
  disabled: boolean;
}

export function ConfigSection({
  model,
  onModelChange,
  siteUrl,
  onSiteUrlChange,
  language,
  onLanguageChange,
  delayMs,
  onDelayChange,
  disabled,
}: ConfigSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="model">Modello Gemini</Label>
        <Select value={model} onValueChange={(v) => v && onModelChange(v)} disabled={disabled}>
          <SelectTrigger id="model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GEMINI_MODELS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="language">Lingua prompt</Label>
        <Select value={language} onValueChange={(v) => v && onLanguageChange(v)} disabled={disabled}>
          <SelectTrigger id="language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROMPT_LANGUAGES.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="siteUrl">URL Sito (opzionale)</Label>
        <Input
          id="siteUrl"
          placeholder="https://esempio.com"
          value={siteUrl}
          onChange={(e) => onSiteUrlChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="delay">Delay tra richieste: {(delayMs / 1000).toFixed(1)}s</Label>
        <input
          id="delay"
          type="range"
          min={MIN_DELAY_MS}
          max={MAX_DELAY_MS}
          step={500}
          value={delayMs}
          onChange={(e) => onDelayChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{MIN_DELAY_MS / 1000}s</span>
          <span>{MAX_DELAY_MS / 1000}s</span>
        </div>
      </div>
    </div>
  );
}
