"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

interface ResultsTableProps {
  results: AnalysisResult[];
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copiato!");
}

export function ResultsTable({ results }: ResultsTableProps) {
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
              <TableCell
                className="text-primary cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => copyToClipboard(r.seoName)}
              >
                {r.seoName}
                <Copy className="inline ml-1 h-3 w-3 opacity-0 group-hover:opacity-50" />
              </TableCell>
              <TableCell
                className="cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => copyToClipboard(r.altText)}
              >
                {r.altText}
                <Copy className="inline ml-1 h-3 w-3 opacity-0 group-hover:opacity-50" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
