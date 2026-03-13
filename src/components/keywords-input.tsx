"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface KeywordsInputProps {
  keywords: string;
  onKeywordsChange: (keywords: string) => void;
  disabled: boolean;
}

export function KeywordsInput({
  keywords,
  onKeywordsChange,
  disabled,
}: KeywordsInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="keywords">Keyword SEO (una per riga o separate da virgola)</Label>
      <Textarea
        id="keywords"
        placeholder="keyword1, keyword2, keyword3..."
        value={keywords}
        onChange={(e) => onKeywordsChange(e.target.value)}
        disabled={disabled}
        rows={3}
      />
    </div>
  );
}
