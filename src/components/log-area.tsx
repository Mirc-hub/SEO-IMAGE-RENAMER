"use client";

import { useEffect, useRef } from "react";
import type { LogEntry } from "@/lib/types";

interface LogAreaProps {
  logs: LogEntry[];
}

const levelColors: Record<string, string> = {
  info: "text-purple-400",
  success: "text-emerald-400",
  error: "text-red-400",
};

export function LogArea({ logs }: LogAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Log</p>
      <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs leading-relaxed">
        {logs.length === 0 && (
          <p className="text-gray-500">In attesa di avvio analisi...</p>
        )}
        {logs.map((log, i) => (
          <div key={i} className={levelColors[log.level] || "text-gray-300"}>
            {log.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
