"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, Check, FolderPlus, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/lib/use-me";
import { drop, getJson, peek } from "@/lib/api-cache";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type Folder = {
  id: string;
  name: string;
  isPublic: boolean;
  count: number;
  contains?: boolean;
};

/**
 * "Save to folder" for any snippet the viewer can read — their own or someone
 * else's from explore. Snippets are referenced by id, so the author keeps the
 * original; the folder is just an index over it.
 */
export function SnippetCollectButton({
  snippetId,
  compact = false,
  label = "Collect",
  className,
}: {
  snippetId: string;
  /** Small pill that matches the explore card action row */
  compact?: boolean;
  label?: string;
  className?: string;
}) {
  const { me } = useMe();
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const newInputRef = useRef<HTMLInputElement>(null);

  const url = `/api/collections?snippet=${snippetId}`;

  const load = useCallback(async () => {
    const cached = peek<{ collections: Folder[] }>(url);
    setFolders(cached ? cached.collections ?? [] : null);
    try {
      const data = await getJson<{ collections: Folder[] }>(url, 10_000);
      setFolders(data.collections ?? []);
    } catch {
      setFolders((prev) => prev ?? []);
    }
  }, [url]);

  // Warm the folder list while the pointer is on the button, so the dialog
  // opens with data instead of "Loading folders…".
  const prefetch = () => {
    if (!me || open) return;
    void getJson<{ collections: Folder[] }>(url, 10_000).catch(() => {});
  };

  const requireLogin = () => {
    if (me) return false;
    toast("Login to save", {
      description: "Sign in to keep snippets in folders.",
      variant: "error",
      actionLabel: "Sign in",
      actionHref: "/login",
    });
    return true;
  };

  const openPanel = () => {
    if (requireLogin()) return;
    setOpen(true);
    void load();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (creating) {
      const t = window.setTimeout(() => newInputRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [creating]);

  const toggle = async (folder: Folder) => {
    setBusy(folder.id);
    drop("/api/collections");
    const next = !folder.contains;
    // Optimistic: flip the tick and keep the count honest
    setFolders(
      (prev) =>
        prev?.map((f) =>
          f.id === folder.id
            ? { ...f, contains: next, count: Math.max(0, f.count + (next ? 1 : -1)) }
            : f
        ) ?? prev
    );
    try {
      const res = await fetch(
        next
          ? `/api/collections/${folder.id}/items`
          : `/api/collections/${folder.id}/items?snippetId=${snippetId}`,
        {
          method: next ? "POST" : "DELETE",
          ...(next
            ? {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ snippetId }),
              }
            : {}),
        }
      );
      if (!res.ok) throw new Error();
      if (next) toast(`Saved to “${folder.name}”`, { variant: "success" });
    } catch {
      toast("Could not update the folder", { variant: "error" });
      void load();
    } finally {
      setBusy(null);
    }
  };

  const createFolder = async () => {
    const name = newName.trim().slice(0, 48);
    if (!name || savingNew) return;
    setSavingNew(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not create the folder", { variant: "error" });
        return;
      }
      const folder: Folder = {
        id: data.collection.id,
        name: data.collection.name,
        isPublic: data.collection.isPublic,
        count: 0,
        contains: false,
      };
      setFolders((prev) => [folder, ...(prev ?? [])]);
      drop(url);
      setNewName("");
      setCreating(false);
      await toggle(folder);
    } catch {
      toast("Could not create the folder", { variant: "error" });
    } finally {
      setSavingNew(false);
    }
  };

  const trigger = compact ? (
    <button
      type="button"
      onClick={openPanel}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      aria-label="Save to a folder"
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-full px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <Bookmark className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  ) : (
    <Button
      variant="outline"
      onClick={openPanel}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      className={cn("gap-1.5", className)}
    >
      <Bookmark className="size-4" /> {label}
    </Button>
  );

  return (
    <>
      {trigger}

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-foreground/25 p-4 backdrop-blur-[2px] sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="collect-heading"
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-[0_24px_60px_rgba(10,10,11,0.18)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="collect-heading" className="text-[15px] font-semibold tracking-[-0.01em]">
                  Save to a folder
                </h2>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  Folders group snippets — yours and ones you find in explore.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="mt-4 max-h-[260px] overflow-y-auto">
              {folders === null ? (
                <p className="flex items-center gap-2 py-6 text-[12.5px] text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Loading folders…
                </p>
              ) : folders.length === 0 && !creating ? (
                <p className="py-6 text-[12.5px] text-muted-foreground">
                  No folders yet. Create one and this snippet goes straight in.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {folders.map((folder) => (
                    <li key={folder.id}>
                      <button
                        type="button"
                        onClick={() => void toggle(folder)}
                        disabled={busy === folder.id}
                        className="flex w-full items-center gap-2.5 py-2.5 text-left transition-colors hover:text-primary"
                      >
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                            folder.contains
                              ? "border-primary bg-primary text-[var(--paper)]"
                              : "border-border text-transparent"
                          )}
                        >
                          {busy === folder.id ? (
                            <Loader2 className="size-3 animate-spin text-primary" />
                          ) : (
                            <Check className="size-3" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                          {folder.name}
                        </span>
                        <span className="mono-label shrink-0 !text-[9px]">{folder.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {creating ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void createFolder();
                }}
                className="mt-4 flex items-center gap-2 border-t border-border pt-4"
              >
                <Input
                  ref={newInputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={48}
                  placeholder="Folder name"
                  className="h-9 rounded-lg px-3 font-mono text-[12.5px]"
                />
                <Button type="submit" size="sm" disabled={savingNew || !newName.trim()}>
                  {savingNew ? <Loader2 className="size-3.5 animate-spin" /> : "Create"}
                </Button>
              </form>
            ) : (
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <FolderPlus className="size-3.5" /> New folder
                </button>
                <Link
                  href="/collections"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline"
                >
                  <Plus className="size-3" /> All folders
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
