"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowLeft,
  FileCode2,
  Globe,
  Loader2,
  Lock,
  SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SnippetActions } from "@/components/snippet-actions";
import { SiteHeader } from "@/components/site-header";
import { languageLabel } from "@/lib/language";

type Snippet = {
  id: string;
  title: string;
  language: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function CodesPage() {
  const { username } = useParams<{ username: string }>();
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const pRes = await fetch(`/api/users/${username}`);
    if (pRes.status === 404) {
      setNotFound(true);
      return;
    }
    const p = await pRes.json();
    setDisplayName(p.user?.name ?? p.user?.username ?? username);
    setIsOwner(!!p.isOwner);

    const sRes = await fetch(`/api/snippets?user=${username}`);
    const s = await sRes.json();
    setSnippets(s.snippets ?? []);
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  const togglePublic = async (snippet: Snippet, isPublic: boolean) => {
    setSnippets((s) =>
      s ? s.map((x) => (x.id === snippet.id ? { ...x, isPublic } : x)) : s
    );
    await fetch(`/api/snippets?id=${snippet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic }),
    });
  };

  if (notFound) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">User not found</h1>
          <p className="mt-2 text-muted-foreground">No user “{username}” exists.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/learn">Back to Learn</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href={`/u/${username}`}>
            <ArrowLeft className="size-4" /> {displayName ?? username}
          </Link>
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileCode2 className="size-5 text-primary" />
            Code by {displayName ?? username}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {snippets === null
              ? "Loading…"
              : `${snippets.length} saved snippet${snippets.length === 1 ? "" : "s"}, most recently saved first${
                  isOwner ? " (including private)" : ""
                }`}
          </p>
        </motion.div>

        {snippets === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : snippets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              <SearchX className="mx-auto mb-2 size-6 opacity-50" />
              No snippets saved yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {snippets.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.04 }}
              >
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="flex h-full flex-col py-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="truncate font-medium" title={s.title}>
                        {s.title}
                      </p>
                      {isOwner ? (
                        <div className="flex shrink-0 items-center gap-1.5">
                          {s.isPublic ? (
                            <Globe className="size-3.5 text-muted-foreground" />
                          ) : (
                            <Lock className="size-3.5 text-muted-foreground" />
                          )}
                          <Switch
                            checked={s.isPublic}
                            onCheckedChange={(v) => togglePublic(s, v)}
                            aria-label={`Make ${s.title} ${s.isPublic ? "private" : "public"}`}
                          />
                        </div>
                      ) : (
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {s.language}
                        </span>
                      )}
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {languageLabel(s.language)} · saved{" "}
                      {new Date(s.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/playground?snippet=${s.id}`}>View code</Link>
                      </Button>
                      <SnippetActions language={s.language} snippetId={s.id} />
                    </div>
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