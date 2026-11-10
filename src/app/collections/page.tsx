"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, FolderOpen, Loader2, Lock, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SiteHeader } from "@/components/site-header";
import { CollectionCard, type CollectionSummary } from "@/components/collection-card";
import { Empty, PageHead } from "@/components/ui/primitives";
import { useMe } from "@/lib/use-me";
import { drop, getJson, peek } from "@/lib/api-cache";
import { toast } from "@/components/ui/toaster";

export default function CollectionsPage() {
  const router = useRouter();
  const { me, loaded } = useMe();
  const [collections, setCollections] = useState<CollectionSummary[] | null>(
    () => peek<{ collections: CollectionSummary[] }>("/api/collections")?.collections ?? null
  );
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    const cached = peek<{ collections: CollectionSummary[] }>("/api/collections");
    setCollections(cached ? cached.collections ?? [] : null);
    getJson<{ collections: CollectionSummary[] }>("/api/collections")
      .then((d) => setCollections(d.collections ?? []))
      .catch(() => setCollections((prev) => prev ?? []));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!me) {
      router.replace("/login?next=%2Fcollections");
      return;
    }
    load();
  }, [loaded, me, router, load]);

  const create = async () => {
    const trimmed = name.trim().slice(0, 48);
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, description, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not create the folder", { variant: "error" });
        return;
      }
      toast(`“${trimmed}” is ready`, { description: "Add snippets from explore.", variant: "success" });
      setName("");
      setDescription("");
      setIsPublic(true);
      setCreating(false);
      drop("/api/collections");
      load();
    } catch {
      toast("Could not create the folder", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded || !me) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <div className="page-wrap grid place-items-center py-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const total = collections?.reduce((sum, c) => sum + c.count, 0) ?? 0;

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <PageHead
          eyebrow={`Collections · ${collections?.length ?? 0} folder${collections?.length === 1 ? "" : "s"} · ${total} saved`}
          title="Your folders."
          description="Group snippets the way you think about them — one folder per project, per language, per idea. Folders can hold your own code and anything you find in explore."
          actions={
            <>
              <Link href="/explore" className="btn btn-outline">
                <Compass className="size-4" /> Find snippets
              </Link>
              <Button onClick={() => setCreating((v) => !v)} className="gap-1.5">
                {creating ? <X className="size-4" /> : <Plus className="size-4" />}
                {creating ? "Cancel" : "New folder"}
              </Button>
            </>
          }
        />

        {creating && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
            className="reveal card-surface mt-6 grid gap-4 p-5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
          >
            <div className="grid gap-1.5">
              <Label htmlFor="folder-name" className="mono-label !text-[9px]">
                Folder name
              </Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={48}
                placeholder="e.g. React patterns"
                autoFocus
                className="h-9 rounded-lg px-3 text-[13px]"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="folder-desc" className="mono-label !text-[9px]">
                Description (optional)
              </Label>
              <Input
                id="folder-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={280}
                placeholder="What lives in here?"
                className="h-9 rounded-lg px-3 text-[13px]"
              />
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  aria-label="Folder visible on your profile"
                />
                <span className="mono-label !text-[9.5px]">{isPublic ? "Public" : "Private"}</span>
              </div>
              <Button type="submit" disabled={saving || !name.trim()} className="gap-1.5">
                {saving && <Loader2 className="size-3.5 animate-spin" />} Create
              </Button>
            </div>
          </form>
        )}

        {collections === null ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[260px] animate-pulse rounded-2xl border border-border bg-muted/40" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <Empty
            icon={FolderOpen}
            title="No folders yet"
            body="Create a folder, then hit Collect on any snippet in explore or on your dashboard to file it away."
            className="mt-10"
            action={
              <Link href="/explore" className="btn btn-ink">
                Browse the commons
              </Link>
            }
          />
        ) : (
          <>
            <div className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  showVisibility
                  className="reveal"
                />
              ))}
            </div>

            <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <p className="mono-label">
                <Lock className="mr-1.5 inline size-3" /> Private folders stay off your profile
              </p>
              <div className="flex items-center gap-5 text-[12.5px] text-muted-foreground">
                <Link href="/dashboard" className="link-underline hover:text-foreground">
                  Dashboard
                </Link>
                <Link href={`/u/${me.username}`} className="link-underline hover:text-foreground">
                  Public profile
                </Link>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
