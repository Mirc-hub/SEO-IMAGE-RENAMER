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
import { toast } from "sonner";
import { Copy, Pencil } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

interface ResultsTableProps {
  results: AnalysisResult[];
  onResultUpdate?: (index: number, field: "seoName" | "altText", value: string) => void;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copiato!");
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome Originale</TableHead>
            <TableHead>Nome SEO</TableHead>
            <TableHead>Alt Text</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
