"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Code2, FileCode2, Loader2, Lock, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SnippetActions } from "@/components/snippet-actions";
import { SiteHeader } from "@/components/site-header";

type Snippet = {
  id: string;
  title: string;
  language: string;
  code: string;
  isPublic: boolean;
  updatedAt: string;
};

export default function Dashboard() {
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [unauthed, setUnauthed] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/snippets?mine=1");
    if (res.status === 401) {
      setUnauthed(true);
      setSnippets([]);
      return;
    }
    const data = await res.json();
    setSnippets(data.snippets ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/snippets?id=${id}`, { method: "DELETE" });
      setSnippets((s) => (s ? s.filter((x) => x.id !== id) : s));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My snippets</h1>
            <p className="text-sm text-muted-foreground">
              Everything you&apos;ve saved from the playground
            </p>
          </div>
          <Button asChild>
            <Link href="/playground">New snippet</Link>
          </Button>
        </div>

        {unauthed ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Lock className="size-8 text-muted-foreground" />
              <p>Sign in to see your saved snippets.</p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/register">Create account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : snippets === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : snippets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <FileCode2 className="size-8 text-muted-foreground" />
              <p className="text-muted-foreground">Nothing saved yet.</p>
              <Button asChild>
                <Link href="/playground">Write some code</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {snippets.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
              >
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center gap-3 py-3.5">
                    <Code2 className="size-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.language} · updated{" "}
                        {new Date(s.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {s.isPublic ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="size-3.5" /> Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="size-3.5" /> Private
                      </span>
                    )}
                    <SnippetActions language={s.language} code={s.code} />
                    <Button variant="ghost" size="icon" asChild aria-label="Open">
                      <Link href={`/playground?snippet=${s.id}`}>→</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      aria-label="Delete snippet"
                      className="text-destructive hover:text-destructive"
                    >
                      {deleting === s.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
