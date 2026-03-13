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
import { GEMINI_MODELS } from "@/lib/constants";

interface ConfigSectionProps {
  model: string;
  onModelChange: (model: string) => void;
  siteUrl: string;
  onSiteUrlChange: (url: string) => void;
  disabled: boolean;
}

export function ConfigSection({
  model,
  onModelChange,
  siteUrl,
  onSiteUrlChange,
  disabled,
}: ConfigSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <Label htmlFor="siteUrl">URL Sito (opzionale)</Label>
        <Input
          id="siteUrl"
          placeholder="https://esempio.com"
          value={siteUrl}
          onChange={(e) => onSiteUrlChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
