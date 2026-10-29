"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Code2,
  FileCode2,
  Globe,
  Lock,
  Plus,
  Search,
  SearchX,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Switch } from "@/components/ui/switch";
import { SnippetActions } from "@/components/snippet-actions";
import { Avatar, Empty } from "@/components/ui/primitives";
import { languageLabel } from "@/lib/language";
import { cn } from "@/lib/utils";

type Snippet = {
  id: string;
  title: string;
  language: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

function dayMonth(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function CodesPage() {
  const { username } = useParams<{ username: string }>();
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [query, setQuery] = useState("");

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
    const list: Snippet[] = s.snippets ?? [];
    setSnippets(list);

    // The list endpoint omits `code`; fetch previews in parallel.
    const pairs = await Promise.all(
      list.map(async (item) => {
        try {
          const r = await fetch(`/api/snippets?id=${item.id}`);
          if (!r.ok) return [item.id, ""] as const;
          const d = await r.json();
          return [item.id, d.snippet?.code ?? ""] as const;
        } catch {
          return [item.id, ""] as const;
        }
      })
    );
    setCodes(Object.fromEntries(pairs));
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

  const publicCount = snippets?.filter((s) => s.isPublic).length ?? 0;
  const languages = useMemo(
    () => new Set((snippets ?? []).map((s) => s.language)).size,
    [snippets]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (snippets ?? []).filter((s) => {
      const inFilter =
        filter === "all" || (filter === "public" ? s.isPublic : !s.isPublic);
      const inQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        languageLabel(s.language).toLowerCase().includes(q);
      return inFilter && inQuery;
    });
  }, [snippets, filter, query]);

  if (notFound) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-24">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
            <p className="mono-label">404 · code cabinet</p>
            <h1 className="display mt-4 text-[42px]">No such maker.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              No user “{username}” exists, or their cabinet is empty.
            </p>
            <Link href="/explore" className="btn btn-ink mt-6">
              Browse the commons
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-5 sm:pt-7">
        <Link
          href={`/u/${username}`}
          className="group inline-flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="grid size-7 place-items-center rounded-full border border-border transition-colors group-hover:border-foreground/30">
            <ArrowLeft className="size-3.5" />
          </span>
          {displayName ?? username}
        </Link>

        <header className="reveal mt-6 border-b border-border pb-7">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <Avatar name={displayName ?? username} size={28} />
                <p className="mono-label">
                  Code cabinet · @{username}
                  {isOwner && <span className="ml-2 text-primary">you</span>}
                </p>
              </div>
              <h1 className="display mt-4 text-[clamp(40px,7vw,84px)]">
                Code by {displayName ?? username}.
              </h1>
              <p className="mt-4 max-w-[62ch] text-[14.5px] leading-relaxed text-muted-foreground sm:text-[15px]">
                {snippets === null
                  ? "Loading the cabinet…"
                  : `${snippets.length} saved snippet${snippets.length === 1 ? "" : "s"} — small programs, solved problems and things worth keeping.`}
                {isOwner && snippets && snippets.length > 0 && (
                  <span className="text-foreground/70"> Private work is included because this is you.</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/playground" className="btn btn-ink">
                <Plus className="size-4" /> New snippet
              </Link>
              {isOwner && (
                <Link href={`/u/${username}`} className="btn btn-outline">
                  Back to profile
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* stats band */}
        <div className="reveal reveal-1 mt-6 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {[
            ["Saved", snippets?.length ?? 0, "total"],
            ["Public", publicCount, "shared"],
            ["Languages", languages, "in use"],
          ].map(([label, value, hint]) => (
            <div key={String(label)} className="px-5 py-4">
              <p className="kpi-num text-[30px]">{value}</p>
              <p className="mono-label mt-1 !text-[8.5px]">
                {label} · {hint}
              </p>
            </div>
          ))}
        </div>

        {/* toolbar */}
        <div className="reveal reveal-2 mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this cabinet…"
              aria-label="Search snippets"
              className="h-9 w-full rounded-full border border-border bg-card pl-10 pr-4 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {isOwner && (
              (["all", "public", "private"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn("chip capitalize", filter === f && "chip-active")}
                >
                  {f}
                  {f === "public" && <span className="opacity-50">{publicCount}</span>}
                </button>
              ))
            )}
            <span className="mono-label ml-1 !text-[9px]">newest first</span>
          </div>
        </div>

        {snippets === null ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[260px] animate-pulse rounded-2xl border border-border bg-muted/30" />
            ))}
          </div>
        ) : snippets.length === 0 ? (
          <Empty
            icon={FileCode2}
            title="An empty cabinet"
            body={
              isOwner
                ? "Save something from the playground and it will live here."
                : "This maker has not shared any snippets yet."
            }
            className="mt-8"
            action={
              isOwner ? (
                <Link href="/playground" className="btn btn-ink">
                  Open the playground
                </Link>
              ) : (
                <Link href="/explore" className="btn btn-outline">
                  Explore public code
                </Link>
              )
            }
          />
        ) : visible.length === 0 ? (
          <Empty
            icon={SearchX}
            title="Nothing matches"
            body="Try a different search, or clear the filter."
            className="mt-8"
            action={
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
                className="btn btn-outline"
              >
                Clear
              </button>
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {visible.map((s, i) => (
              <article
                key={s.id}
                className="card-surface card-hover group flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="mono-label !text-[9px]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="size-3 rounded-full bg-border" />
                    <span className="mono-label truncate !text-[9.5px]">
                      {languageLabel(s.language)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {isOwner ? (
                      <>
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
                      </>
                    ) : (
                      <Globe className="size-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 truncate text-[15.5px] font-semibold tracking-[-0.01em]">
                      {s.title}
                    </h2>
                    <span className="mono-label shrink-0 !text-[9px]">
                      {dayMonth(s.updatedAt)}
                    </span>
                  </div>
                  <p className="mono-label mt-1 !text-[9px]">
                    {s.isPublic ? "public" : "private"} · saved {dayMonth(s.updatedAt)}
                  </p>

                  <div className="code-pane relative mt-4 max-h-[148px] flex-1 overflow-hidden">
                    <pre className="!p-3.5 text-[11px] leading-[1.7]">
                      {codes[s.id]
                        ? codes[s.id].split("\n").slice(0, 8).join("\n")
                        : `// ${s.title}\n// ${languageLabel(s.language)}\n\n// open to read the full snippet`}
                    </pre>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[var(--code-bg)] to-transparent" />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <Link
                      href={`/playground?snippet=${s.id}`}
                      className="group/link inline-flex items-center gap-1 text-[12.5px] font-medium text-foreground transition-colors hover:text-primary"
                    >
                      Open code
                      <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                    </Link>
                    <SnippetActions language={s.language} snippetId={s.id} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="mono-label">Cabinet · read, copy, run</p>
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Code2 className="size-3.5" /> Profile &amp; writing
          </Link>
        </footer>
      </main>
    </div>
  );
}
