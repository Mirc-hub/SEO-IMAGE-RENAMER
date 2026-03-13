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
import { Input } from "@/components/ui/input";
import { Copy, Pencil, ClipboardCopy, Search } from "lucide-react";
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
  const [search, setSearch] = useState("");

  if (results.length === 0) return null;

  const filtered = search.trim()
    ? results.filter((r) => {
        const q = search.toLowerCase();
        return (
          r.originalName.toLowerCase().includes(q) ||
          r.seoName.toLowerCase().includes(q) ||
          r.altText.toLowerCase().includes(q)
        );
      })
    : results;

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

  // Map filtered results to original indices
  const filteredWithIndex = filtered.map((r) => ({
    ...r,
    originalIndex: results.indexOf(r),
  }));

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca nei risultati..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8"
          />
        </div>
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
            {filteredWithIndex.map((r) => (
              <TableRow key={r.originalIndex}>
                <TableCell className="text-muted-foreground">
                  {r.originalName}
                </TableCell>
                <EditableCell
                  value={r.seoName}
                  isPrimary
                  onSave={(v) => onResultUpdate?.(r.originalIndex, "seoName", v)}
                />
                <EditableCell
                  value={r.altText}
                  onSave={(v) => onResultUpdate?.(r.originalIndex, "altText", v)}
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
