"use client";

import { useState, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Pencil, ClipboardCopy } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

interface ResultsTableProps {
  results: AnalysisResult[];
  onResultUpdate?: (index: number, field: "seoName" | "altText", value: string) => void;
}

function copyToClipboard(text: string, label?: string) {
  navigator.clipboard.writeText(text);
  toast.success(label || "Copiato!");
}

function EditableCell({
  value,
  onSave,
  className,
  isPrimary,
}: {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  isPrimary?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  if (editing) {
    return (
      <TableCell className="p-0">
        <input
          ref={inputRef}
          className="w-full px-4 py-2 text-sm bg-background border-2 border-primary rounded outline-none"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSave(editValue);
              setEditing(false);
            }
            if (e.key === "Escape") {
              setEditValue(value);
              setEditing(false);
            }
          }}
          onBlur={() => {
            onSave(editValue);
            setEditing(false);
          }}
        />
      </TableCell>
    );
  }

  return (
    <TableCell
      className={`cursor-pointer hover:bg-muted/50 transition-colors group ${isPrimary ? "text-primary" : ""} ${className || ""}`}
    >
      <span onClick={() => copyToClipboard(value)}>{value}</span>
      <Copy className="inline ml-1 h-3 w-3 opacity-0 group-hover:opacity-50 cursor-pointer" />
      <Pencil
        className="inline ml-1 h-3 w-3 opacity-0 group-hover:opacity-50 cursor-pointer"
        onClick={() => setEditing(true)}
      />
    </TableCell>
  );
}

export function ResultsTable({ results, onResultUpdate }: ResultsTableProps) {
  if (results.length === 0) return null;

  const copyAllSeoNames = () => {
    const text = results.map((r) => r.seoName).join("\n");
    copyToClipboard(text, `${results.length} nomi SEO copiati!`);
  };

  const copyAllAltTexts = () => {
    const text = results.map((r) => r.altText).join("\n");
    copyToClipboard(text, `${results.length} alt text copiati!`);
  };

  const copyRowAsHtml = (r: AnalysisResult) => {
    const html = `<img src="${r.seoName}" alt="${r.altText}" />`;
    copyToClipboard(html, "HTML <img> copiato!");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={copyAllSeoNames}>
          <ClipboardCopy className="h-3 w-3 mr-1" />
          Copia tutti i nomi SEO
        </Button>
        <Button variant="outline" size="sm" onClick={copyAllAltTexts}>
          <ClipboardCopy className="h-3 w-3 mr-1" />
          Copia tutti gli alt text
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Originale</TableHead>
              <TableHead>Nome SEO</TableHead>
              <TableHead>Alt Text</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground">
                  {r.originalName}
                </TableCell>
                <EditableCell
                  value={r.seoName}
                  isPrimary
                  onSave={(v) => onResultUpdate?.(i, "seoName", v)}
                />
                <EditableCell
                  value={r.altText}
                  onSave={(v) => onResultUpdate?.(i, "altText", v)}
                />
                <TableCell className="p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="Copia come <img> HTML"
                    onClick={() => copyRowAsHtml(r)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
