"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  Compass,
  FolderOpen,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
  Globe,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SiteHeader } from "@/components/site-header";
import { SnippetCollectButton } from "@/components/snippet-collect";
import { SnippetLink } from "@/components/snippet-link";
import { Avatar, Empty } from "@/components/ui/primitives";
import { useMe } from "@/lib/use-me";
import { drop, getJson, peek } from "@/lib/api-cache";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  createdAt: string;
  snippet: {
    id: string;
    title: string;
    language: string;
    code: string;
    isPublic: boolean;
    createdAt: string;
    user: { username: string; name: string | null; image: string | null };
    _count: { likes: number; comments: number };
  };
};

type Collection = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: { username: string; name: string | null; image: string | null };
  count: number;
  items: Item[];
};

type MySnippet = {
  id: string;
  title: string;
  language: string;
  isPublic: boolean;
};

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { me } = useMe();
  const [collection, setCollection] = useState<Collection | null>(
    () => peek<{ collection: Collection }>(`/api/collections/${id}`)?.collection ?? null
  );
  const [isOwner, setIsOwner] = useState(false);
  const [missing, setMissing] = useState(false);

  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [mine, setMine] = useState<MySnippet[] | null>(null);
  const [mineError, setMineError] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getJson<{ collection: Collection; isOwner: boolean }>(
        `/api/collections/${id}`
      );
      setCollection(data.collection);
      setName(data.collection.name);
      setIsOwner(Boolean(data.isOwner));
    } catch {
      setMissing(true);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!addOpen || mine !== null) return;
    let alive = true;
    fetch("/api/snippets?mine=1")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        if (alive) setMine((d.snippets ?? []) as MySnippet[]);
      })
      .catch(() => {
        if (!alive) return;
        setMine([]);
        setMineError(true);
      });
    return () => {
      alive = false;
    };
  }, [addOpen, mine]);

  useEffect(() => {
    if (!addOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAddOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addOpen]);

  const addSnippet = async (snippet: MySnippet) => {
    if (!collection || addingId) return;
    setAddingId(snippet.id);
    try {
      const res = await fetch(`/api/collections/${collection.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snippetId: snippet.id }),
      });
      if (!res.ok) throw new Error();
      drop(`/api/collections/${collection.id}`);
      drop("/api/collections");
      await load();
      toast(`Added “${snippet.title}”`, {
        description: snippet.isPublic
          ? "Filed in this folder."
          : "Private snippet — only you can see it here.",
        variant: "success",
      });
    } catch {
      toast("Could not add the snippet", { variant: "error" });
    } finally {
      setAddingId(null);
    }
  };

  const rename = async () => {
    const trimmed = name.trim().slice(0, 48);
    if (!trimmed || savingName || !collection) return;
    setSavingName(true);
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not rename the folder", { variant: "error" });
        return;
      }
      setCollection((c) => (c ? { ...c, name: data.collection.name } : c));
      setRenaming(false);
      drop("/api/collections");
      toast("Folder renamed", { variant: "success" });
    } catch {
      toast("Could not rename the folder", { variant: "error" });
    } finally {
      setSavingName(false);
    }
  };

  const togglePublic = async (next: boolean) => {
    if (!collection) return;
    setCollection((c) => (c ? { ...c, isPublic: next } : c));
    const res = await fetch(`/api/collections/${collection.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    });
    drop("/api/collections");
    if (!res.ok) {
      setCollection((c) => (c ? { ...c, isPublic: !next } : c));
      toast("Could not update visibility", { variant: "error" });
    }
  };

  const removeItem = async (snippetId: string) => {
    if (!collection) return;
    setBusy(snippetId);
    const previous = collection;
    setCollection((c) =>
      c
        ? {
            ...c,
            count: Math.max(0, c.count - 1),
            items: c.items.filter((item) => item.snippet.id !== snippetId),
          }
        : c
    );
    try {
      const res = await fetch(`/api/collections/${collection.id}/items?snippetId=${snippetId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      drop("/api/collections");
    } catch {
      setCollection(previous);
      toast("Could not remove the snippet", { variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const deleteFolder = async () => {
    if (!collection) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    const res = await fetch(`/api/collections/${collection.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Could not delete the folder", { variant: "error" });
      return;
    }
    drop("/api/collections");
    toast("Folder deleted", { description: "The snippets themselves are untouched.", variant: "success" });
    router.push("/collections");
  };

  if (missing) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-24">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
            <p className="mono-label">404 · collection</p>
            <h1 className="display mt-4 text-[42px]">No such folder.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              It may be private, or it may have been deleted.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Link href="/collections" className="btn btn-ink">
                Your folders
              </Link>
              <Link href="/explore" className="btn btn-outline">
                Explore
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <div className="page-wrap grid place-items-center py-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const addedSnippetIds = new Set(collection.items.map((item) => item.snippet.id));
  const normalizedQuery = addQuery.trim().toLowerCase();
  const filteredMine = (mine ?? []).filter(
    (snippet) =>
      !normalizedQuery ||
      snippet.title.toLowerCase().includes(normalizedQuery) ||
      snippet.language.toLowerCase().includes(normalizedQuery)
  );

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <header className="reveal border-b border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mono-label">
                Collection · {collection.count} snippet{collection.count === 1 ? "" : "s"} ·{" "}
                {collection.isPublic ? "public" : "private"} · updated {shortDate(collection.updatedAt)}
              </p>

              {renaming ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void rename();
                  }}
                  className="mt-3 flex max-w-xl items-center gap-2"
                >
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={48}
                    autoFocus
                    className="h-11 rounded-lg px-3 text-[18px]"
                  />
                  <Button type="submit" size="sm" disabled={savingName || !name.trim()}>
                    {savingName ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRenaming(false);
                      setName(collection.name);
                    }}
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <h1 className="display mt-3 break-words text-[clamp(40px,7vw,86px)]">{collection.name}</h1>
              )}

              <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                {collection.description?.trim()
                  ? collection.description
                  : isOwner
                    ? "No description yet — this folder is just a place to keep related snippets together."
                    : `A folder of code kept by ${collection.user.name ?? collection.user.username}.`}
              </p>

              <div className="mt-4 flex items-center gap-2.5">
                <Avatar name={collection.user.name ?? collection.user.username} image={collection.user.image} size={28} />
                <Link
                  href={`/u/${collection.user.username}`}
                  className="text-[13px] font-medium hover:text-primary"
                >
                  {collection.user.name ?? collection.user.username}
                </Link>
                <span className="mono-label !text-[9px]">@{collection.user.username}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="btn btn-ink"
                  >
                    <Plus className="size-4" /> Add snippets
                  </button>
                  <Button variant="outline" onClick={() => setRenaming(true)} className="gap-1.5">
                    <Pencil className="size-4" /> Rename
                  </Button>
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2">
                    <Switch
                      checked={collection.isPublic}
                      onCheckedChange={togglePublic}
                      aria-label="Folder visible on your profile"
                    />
                    {collection.isPublic ? (
                      <Globe className="size-3.5 text-muted-foreground" />
                    ) : (
                      <Lock className="size-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <Button
                    variant={confirmDelete ? "destructive" : "ghost"}
                    onClick={() => void deleteFolder()}
                    className={cn("gap-1.5", !confirmDelete && "text-destructive hover:text-destructive")}
                  >
                    <Trash2 className="size-4" /> {confirmDelete ? "Delete folder?" : "Delete"}
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/collections" className="btn btn-outline">
                    <FolderOpen className="size-4" /> Your folders
                  </Link>
                  <Link href="/explore" className="btn btn-ink">
                    <Compass className="size-4" /> Explore
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {collection.items.length === 0 ? (
          <Empty
            icon={FolderOpen}
            title="This folder is empty"
            body={
              isOwner
                ? "Add your own snippets or collect ones from explore. Private snippets stay visible only to you."
                : "Its owner has not filed anything into it yet."
            }
            className="mt-10"
            action={
              isOwner ? (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="btn btn-ink"
                >
                  <Plus className="size-4" /> Add snippets
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="mt-8 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {collection.items.map((item, i) => {
              const s = item.snippet;
              return (
                <article
                  key={item.id}
                  className="card-surface card-hover reveal flex flex-col overflow-hidden"
                  style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={s.user.name ?? s.user.username} image={s.user.image} size={28} />
                      <div className="min-w-0">
                        <Link
                          href={`/u/${s.user.username}`}
                          className="block truncate text-[12.5px] font-medium hover:text-primary"
                        >
                          {s.user.name ?? s.user.username}
                        </Link>
                        <p className="mono-label !text-[8.5px]">{shortDate(item.createdAt)}</p>
                      </div>
                    </div>
                    <span className="mono-label shrink-0 !text-[9px]">{s.language}</span>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <SnippetLink id={s.id} className="group block">
                      <h3 className="line-clamp-2 min-h-[44px] text-[15.5px] font-semibold leading-snug tracking-[-0.01em] transition-colors group-hover:text-primary">
                        {s.title}
                        {!s.isPublic && <Lock className="ml-1.5 inline size-3 text-muted-foreground" />}
                      </h3>
                    </SnippetLink>

                    <div className="code-pane relative mt-3 h-[132px] overflow-hidden">
                      <pre className="!p-3.5 text-[11px] leading-[1.65]">
                        {s.code.split("\n").slice(0, 7).join("\n")}
                      </pre>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-[var(--code-bg)] to-transparent" />
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <SnippetLink
                        id={s.id}
                        className="group/link inline-flex items-center gap-1 text-[12.5px] font-medium text-foreground transition-colors hover:text-primary"
                      >
                        Open code
                        <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                      </SnippetLink>
                      <div className="flex items-center gap-1.5">
                        <SnippetCollectButton snippetId={s.id} compact label="Move" />
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => void removeItem(s.id)}
                            disabled={busy === s.id}
                            aria-label={`Remove ${s.title} from this folder`}
                            className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                          >
                            {busy === s.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <X className="size-3.5" />
                            )}
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {me && isOwner && collection.items.length > 0 && (
          <p className="mono-label mt-8">
            Removing a snippet from a folder never deletes it — it stays in{" "}
            <Link href="/dashboard" className="text-primary hover:underline">
              your snippets
            </Link>
            .
          </p>
        )}

        {isOwner && addOpen && (
          <div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-foreground/25 p-4 backdrop-blur-[2px] sm:items-center"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setAddOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-snippets-heading"
              className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_24px_60px_rgba(10,10,11,0.18)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="add-snippets-heading"
                    className="text-[15px] font-semibold tracking-[-0.01em]"
                  >
                    Add snippets
                  </h2>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                    Your own snippets, public or private. Private ones show only to you, even
                    in a public folder.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  aria-label="Close"
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                  placeholder="Search your snippets"
                  className="h-9 rounded-lg pl-9 text-[13px]"
                />
              </div>

              <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
                {mine === null ? (
                  <p className="flex items-center gap-2 py-6 text-[12.5px] text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" /> Loading your snippets…
                  </p>
                ) : mineError ? (
                  <p className="py-6 text-[12.5px] text-muted-foreground">
                    Could not load your snippets. Close and try again.
                  </p>
                ) : filteredMine.length === 0 ? (
                  <p className="py-6 text-[12.5px] text-muted-foreground">
                    {mine.length === 0
                      ? "No snippets yet — save one from the playground first."
                      : "No snippets match that search."}
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {filteredMine.map((snippet) => {
                      const added = addedSnippetIds.has(snippet.id);
                      return (
                        <li
                          key={snippet.id}
                          className="flex items-center gap-3 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium">
                              {snippet.title}
                            </p>
                            <p className="mono-label mt-0.5 flex items-center gap-1.5 !text-[9px]">
                              {snippet.language} · {snippet.isPublic ? "public" : "private"}
                              {!snippet.isPublic && <Lock className="size-2.5" />}
                            </p>
                          </div>
                          {added ? (
                            <span className="mono-label shrink-0 !text-[9px]">Added</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void addSnippet(snippet)}
                              disabled={Boolean(addingId)}
                              className="h-8 shrink-0 px-3 text-[12px]"
                            >
                              {addingId === snippet.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                "Add"
                              )}
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-4">
                <Link
                  href="/explore"
                  onClick={() => setAddOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Compass className="size-3.5" /> Explore public snippets
                </Link>
                <span className="mono-label !text-[9px]">
                  {collection.items.length} in folder
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
