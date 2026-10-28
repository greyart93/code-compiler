"use client";

import { useState } from "react";
import { Check, Copy, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileNameFor } from "@/lib/language";

interface SnippetActionsProps {
  language: string;
  /** Provide code directly when it is already in memory (playground, my snippets) */
  code?: string | null;
  /** Otherwise provide snippetId — code is fetched on demand (public showcase cards) */
  snippetId?: string;
}

export function SnippetActions({ language, code, snippetId }: SnippetActionsProps) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const resolveCode = async (): Promise<string> => {
    if (code !== undefined && code !== null) return code;
    if (!snippetId) return "";
    const res = await fetch(`/api/snippets?id=${snippetId}`);
    if (!res.ok) return "";
    const data = await res.json();
    return data.snippet?.code ?? "";
  };

  const handleCopy = async () => {
    setBusy(true);
    try {
      const text = await resolveCode();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const text = await resolveCode();
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileNameFor(language);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        disabled={busy}
        aria-label="Copy code"
        title="Copy code"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : copied ? (
          <Check className="size-4 text-green-600" />
        ) : (
          <Copy className="size-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        disabled={busy}
        aria-label="Download code"
        title={`Download ${fileNameFor(language)}`}
      >
        <Download className="size-4" />
      </Button>
    </div>
  );
}
