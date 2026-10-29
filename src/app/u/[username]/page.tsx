"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  Camera,
  Check,
  Code2,
  FileCode2,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Sparkles,
  StickyNote,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SnippetActions } from "@/components/snippet-actions";
import { SiteHeader } from "@/components/site-header";
import { AllNotesList } from "@/components/lesson-notes";
import { toast } from "@/components/ui/toaster";
import { COURSES } from "@/data/courses";
import { Avatar, ArrowLink, Empty, SectionHead, Stat, Tag } from "@/components/ui/primitives";
import { Ring } from "@/components/ui/data-viz";
import { cn } from "@/lib/utils";

type Profile = {
  user: {
    id: string;
    username: string;
    name: string | null;
    bio: string | null;
    image: string | null;
    createdAt: string;
  };
  stats: {
    publicSnippets: number;
    totalSnippets?: number;
    tutorials: number;
    notes?: number;
    interviews?: number;
    attemptedProblems?: number;
  };
  completedCourses: { slug: string; completedAt: string }[];
  isOwner: boolean;
};

type Snippet = {
  id: string;
  title: string;
  language: string;
  isPublic: boolean;
  updatedAt: string;
};

type Tutorial = {
  id: string;
  title: string;
  language: string | null;
  createdAt: string;
};

/** Read an image File → resize to ≤256px square → JPEG data URL */
async function fileToAvatarDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("decode failed"));
    el.src = dataUrl;
  });
  const size = 256;
  const scale = Math.min(size / img.width, size / img.height, 1);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function monthYear(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function dayMonth(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [notFound, setNotFound] = useState(false);

  // Profile editing (owner only)
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/users/${username}`);
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    const data = await res.json();
    setProfile(data);

    const sRes = await fetch(`/api/snippets?user=${username}`);
    const sData = await sRes.json();
    setSnippets(sData.snippets ?? []);

    const tRes = await fetch(`/api/tutorials`);
    const tData = await tRes.json();
    setTutorials(
      (tData.tutorials ?? []).filter(
        (t: { user: { username: string } }) => t.user.username === username
      )
    );
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  // Pull the first few lines of code for the showcase cards.
  useEffect(() => {
    if (!snippets || snippets.length === 0) return;
    let alive = true;
    const top = snippets.slice(0, 6);
    Promise.all(
      top.map((s) =>
        fetch(`/api/snippets?id=${s.id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((rows) => {
      if (!alive) return;
      const map: Record<string, string> = {};
      rows.forEach((row, i) => {
        if (row?.snippet?.code) map[top[i].id] = row.snippet.code;
      });
      setCodeMap(map);
    });
    return () => {
      alive = false;
    };
  }, [snippets]);

  useEffect(() => {
    if (profile?.isOwner) {
      setEditName(profile.user.name ?? "");
      setEditBio(profile.user.bio ?? "");
    }
  }, [profile?.isOwner, profile?.user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, bio: editBio }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast(d.error ?? "Failed to save profile", { variant: "error" });
        return;
      }
      toast("Profile updated", { variant: "success" });
      setEditing(false);
      load();
    } catch {
      toast("Could not save profile", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Pick an image file", { variant: "error" });
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast(d.error ?? "Upload failed", { variant: "error" });
        return;
      }
      toast("Avatar updated", { variant: "success" });
      load();
    } catch {
      toast("Could not process image", { variant: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: null }),
      });
      if (res.ok) {
        toast("Avatar removed", { variant: "success" });
        load();
      }
    } finally {
      setUploading(false);
    }
  };

  const togglePublic = async (snippet: Snippet, isPublic: boolean) => {
    setSnippets((s) => (s ? s.map((x) => (x.id === snippet.id ? { ...x, isPublic } : x)) : s));
    await fetch(`/api/snippets?id=${snippet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic }),
    });
  };

  const startEditing = () => {
    setEditing(true);
    setTimeout(() => editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  const topLanguage = useMemo(() => {
    if (!snippets?.length) return null;
    const counts = new Map<string, number>();
    for (const s of snippets) counts.set(s.language, (counts.get(s.language) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [snippets]);

  const completeness = useMemo(() => {
    if (!profile) return { pct: 0, missing: [] as string[] };
    const checks = [
      { label: "a photo", done: !!profile.user.image },
      { label: "a display name", done: !!profile.user.name?.trim() },
      { label: "a bio", done: (profile.user.bio ?? "").trim().length >= 24 },
      { label: "a saved snippet", done: (profile.stats.totalSnippets ?? 0) > 0 },
      { label: "a finished course", done: profile.completedCourses.length > 0 },
      { label: "a published tutorial", done: profile.stats.tutorials > 0 },
    ];
    const missing = checks.filter((c) => !c.done).map((c) => c.label);
    return {
      pct: Math.round(((checks.length - missing.length) / checks.length) * 100),
      missing,
    };
  }, [profile]);

  if (notFound) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-24">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
            <p className="mono-label">404 · profile</p>
            <h1 className="display mt-4 text-[42px]">No one by that name.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              “{username}” is not in the workshop. Check the spelling, or browse the community feed.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Link href="/explore" className="btn btn-ink">
                Explore code
              </Link>
              <Link href="/" className="btn btn-outline">
                Go home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <div className="page-wrap grid place-items-center py-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const displayName = profile.user.name ?? profile.user.username;
  const isOwner = profile.isOwner;
  const joined = monthYear(profile.user.createdAt);
  const courses = profile.completedCourses;

  return (
    <div className="app-shell">
      <SiteHeader />

      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        {/* ── hero ───────────────────────────────────────────────────── */}
        <header className="reveal grid gap-8 border-b border-border pb-9 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-12">
          <div className="min-w-0 self-end">
            <p className="mono-label">
              {isOwner ? "Your profile" : "Profile"} · {isOwner ? "public view" : `member since ${joined}`}
            </p>
            <h1 className="display mt-3 break-words text-[clamp(46px,9vw,104px)] leading-[0.88] text-foreground">
              {displayName}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-mono text-[13.5px] font-medium text-primary">@{profile.user.username}</span>
              <span className="size-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                <CalendarDays className="size-3.5" /> Joined {joined}
              </span>
              {topLanguage && (
                <>
                  <span className="size-1 rounded-full bg-border" />
                  <span className="mono-label !text-[10px]">mostly {topLanguage}</span>
                </>
              )}
            </div>

            <p className="mt-6 max-w-[62ch] whitespace-pre-line text-[15.5px] leading-relaxed text-muted-foreground">
              {profile.user.bio?.trim()
                ? profile.user.bio
                : isOwner
                  ? "Your bio is still blank. A couple of lines about what you build and what you are learning makes this page feel like yours."
                  : `${displayName} has not written a bio yet. The work below speaks for itself.`}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              {isOwner ? (
                <>
                  <Button onClick={startEditing} className="gap-1.5">
                    <Pencil className="size-4" /> Edit profile
                  </Button>
                  <Button variant="outline" asChild className="gap-1.5">
                    <Link href="/dashboard">
                      <LayoutDashboard className="size-4" /> Dashboard
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="gap-1.5">
                    <Link href="/playground">
                      <Plus className="size-4" /> New snippet
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <a href="#work" className="btn btn-ink">
                    <Code2 className="size-4" /> Selected work
                  </a>
                  <a href="#writing" className="btn btn-outline">
                    Read tutorials <ArrowUpRight className="size-4" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* portrait plate */}
          <aside className="relative">
            <div className="dot-grid relative overflow-hidden rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <p className="mono-label">Portrait</p>
                <span className="mono-label !text-[9px]">
                  No. {profile.user.id.slice(-4).toUpperCase()}
                </span>
              </div>

              <div className="relative mx-auto mt-6 w-fit">
                <Avatar
                  name={displayName}
                  image={profile.user.image}
                  size={132}
                  className="ring-4 ring-card shadow-[0_18px_50px_rgba(10,10,11,0.14)]"
                />
                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      aria-label={profile.user.image ? "Change avatar" : "Upload avatar"}
                      className="absolute inset-0 grid place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 disabled:opacity-100"
                    >
                      {uploading ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <Camera className="size-5" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                    />
                  </>
                )}
              </div>

              {isOwner && (
                <div className="mt-4 flex justify-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-7 gap-1 px-2.5 text-[11px]"
                  >
                    {uploading ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : profile.user.image ? (
                      <Camera className="size-3" />
                    ) : (
                      <Upload className="size-3" />
                    )}
                    {profile.user.image ? "Change" : "Upload"}
                  </Button>
                  {profile.user.image && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={uploading}
                      className="h-7 gap-1 px-2.5 text-[11px] text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3" /> Remove
                    </Button>
                  )}
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div>
                  <p className="mono-label !text-[9px]">Focus</p>
                  <p className="mt-1 truncate text-[13px] font-medium">{topLanguage ?? "Code & craft"}</p>
                </div>
                <div>
                  <p className="mono-label !text-[9px]">Since</p>
                  <p className="mt-1 text-[13px] font-medium">
                    {new Date(profile.user.createdAt).getFullYear()}
                  </p>
                </div>
              </div>

              {isOwner && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                  <Ring value={completeness.pct} size={52} stroke={5} label={`${completeness.pct}`} />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold">Profile strength</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                      {completeness.missing.length === 0
                        ? "Complete. This page is doing its job."
                        : `Add ${completeness.missing.slice(0, 2).join(" and ")}.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </header>

        {/* ── edit panel ─────────────────────────────────────────────── */}
        {isOwner && editing && (
          <section ref={editRef} className="reveal mt-6 scroll-mt-24">
            <div className="card-surface p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mono-label">Editing</p>
                  <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.02em]">Profile details</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  aria-label="Close editor"
                  className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-name">Display name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                    maxLength={60}
                  />
                </div>
                <div className="flex items-end">
                  <p className="text-[12px] leading-snug text-muted-foreground">
                    This is the name shown at the top of your public profile. Your handle{" "}
                    <span className="font-mono text-primary">@{profile.user.username}</span> stays fixed.
                  </p>
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="edit-bio">Bio</Label>
                  <Textarea
                    id="edit-bio"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="What do you build? What are you learning right now?"
                    maxLength={280}
                    className="min-h-[96px]"
                  />
                  <p className="text-right text-[11px] text-muted-foreground">{editBio.length}/280</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving && <Loader2 className="size-3.5 animate-spin" />} Save changes
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setEditName(profile.user.name ?? "");
                    setEditBio(profile.user.bio ?? "");
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <span className="ml-auto text-[11.5px] text-muted-foreground">
                  Changes appear on your public page immediately.
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ── stats ──────────────────────────────────────────────────── */}
        <section className="reveal reveal-1 mt-7 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
            <Stat
              label={isOwner ? "Public snippets" : "Snippets"}
              value={profile.stats.publicSnippets}
              hint={isOwner ? `${Math.max(0, (profile.stats.totalSnippets ?? 0) - profile.stats.publicSnippets)} private` : "shared with the community"}
            />
            <Stat label="Courses finished" value={courses.length} hint={courses.length ? "certified progress" : "none yet"} />
            <Stat label="Tutorials" value={profile.stats.tutorials} hint="long-form writing" />
            <Stat
              label="Member since"
              value={new Date(profile.user.createdAt).getFullYear()}
              hint={joined}
            />
          </div>
        </section>

        {/* ── selected work ──────────────────────────────────────────── */}
        <section id="work" className="reveal reveal-2 mt-12 scroll-mt-24">
          <SectionHead
            index="01"
            title="Selected work"
            count={snippets?.length ?? 0}
            action={
              snippets && snippets.length > 6 ? (
                <ArrowLink href={`/codes/${username}`}>See all {snippets.length}</ArrowLink>
              ) : (
                <span className="mono-label !text-[10px]">most recent first</span>
              )
            }
          />

          {snippets === null ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[260px] animate-pulse rounded-2xl border border-border bg-muted/40" />
              ))}
            </div>
          ) : snippets.length === 0 ? (
            <Empty
              icon={FileCode2}
              title={isOwner ? "No snippets saved yet" : "Nothing public yet"}
              body={
                isOwner
                  ? "Your showcase is built from saved playground snippets. Write something and hit Save."
                  : "This profile has not shared any code publicly."
              }
              className="mt-6"
              action={
                isOwner ? (
                  <Link href="/playground" className="btn btn-ink">
                    Open playground
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {snippets.slice(0, 6).map((s, i) => {
                const code = codeMap[s.id];
                return (
                  <article
                    key={s.id}
                    className="card-surface card-hover group flex flex-col overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="mono-label !text-[9px]">{String(i + 1).padStart(2, "0")}</span>
                        <span className="size-3 rounded-full bg-border" />
                        <span className="mono-label truncate !text-[9.5px]">{s.language}</span>
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
                      <h3 className="truncate text-[15.5px] font-semibold tracking-[-0.01em]">{s.title}</h3>
                      <p className="mono-label mt-1 !text-[9px]">updated {dayMonth(s.updatedAt)}</p>

                      <div className="code-pane relative mt-4 max-h-[132px] flex-1 overflow-hidden">
                        <pre className="!p-3.5 text-[11px] leading-[1.65]">
                          {code
                            ? code.split("\n").slice(0, 7).join("\n")
                            : `// ${s.title}\n// ${s.language}\n\n// open to read the full snippet`}
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
                );
              })}
            </div>
          )}
        </section>

        {/* ── courses ────────────────────────────────────────────────── */}
        {(courses.length > 0 || isOwner) && (
          <section className="reveal reveal-3 mt-12">
            <SectionHead
              index="02"
              title="Courses finished"
              count={courses.length}
              action={<ArrowLink href="/learn">Course library</ArrowLink>}
            />
            {courses.length === 0 ? (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-border p-6">
                <div>
                  <p className="text-sm font-medium">No finished courses yet.</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    Finish every lesson in a course to stamp it here.
                  </p>
                </div>
                <Link href="/learn" className="btn btn-outline h-9 px-4 text-[12.5px]">
                  Start learning
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((c) => {
                  const course = COURSES.find((x) => x.slug === c.slug);
                  return (
                    <Link
                      key={c.slug}
                      href={`/learn/${c.slug}`}
                      className="card-surface card-hover flex items-center gap-3 p-3.5"
                      title={`${course?.title ?? c.slug} — completed ${new Date(c.completedAt).toLocaleDateString()}`}
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-xl text-[12px] font-bold",
                          course?.accent ?? "bg-primary/12 text-primary"
                        )}
                      >
                        {(course?.title ?? c.slug).slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{course?.title ?? c.slug}</p>
                        <p className="mono-label !text-[9px]">completed {monthYear(c.completedAt)}</p>
                      </div>
                      <Check className="size-4 shrink-0 text-emerald-500" />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── writing ────────────────────────────────────────────────── */}
        {(tutorials.length > 0 || isOwner) && (
          <section id="writing" className="reveal reveal-4 mt-12 scroll-mt-24">
            <SectionHead
              index="03"
              title="Writing"
              count={tutorials.length}
              action={
                isOwner ? (
                  <Link href="/blog/new" className="btn btn-outline h-8 px-3 text-[12px]">
                    <Pencil className="size-3.5" /> New tutorial
                  </Link>
                ) : (
                  <ArrowLink href="/blog">All tutorials</ArrowLink>
                )
              }
            />
            {tutorials.length === 0 ? (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-border p-6">
                <div>
                  <p className="text-sm font-medium">Nothing published yet.</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    Teach one thing clearly and it will live here.
                  </p>
                </div>
                <Link href="/blog/new" className="btn btn-outline h-9 px-4 text-[12.5px]">
                  Write a tutorial
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-3">
                {tutorials.map((t, i) => (
                  <Link
                    key={t.id}
                    href={`/blog/${t.id}`}
                    className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border py-4 transition-colors hover:bg-muted/30"
                  >
                    <span className="mono-label w-6 !text-[10px]">{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[16px] font-semibold tracking-[-0.01em] transition-colors group-hover:text-primary">
                        {t.title}
                      </h3>
                      <p className="mono-label mt-1 !text-[9px]">
                        {t.language ?? "general"} · {monthYear(t.createdAt)}
                      </p>
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── notebook (owner) ───────────────────────────────────────── */}
        {isOwner && (
          <section className="reveal reveal-5 mt-12">
            <SectionHead
              index="04"
              title="Notebook"
              action={<span className="mono-label !text-[10px]">private</span>}
            />
            <div className="mt-6">
              <AllNotesList />
            </div>
          </section>
        )}

        {/* ── analytics hand-off ─────────────────────────────────────── */}
        {isOwner && (
          <section className="mt-12 grid gap-4 overflow-hidden rounded-3xl bg-[var(--ink)] p-6 text-[var(--paper)] sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <p className="mono-label !text-[var(--paper)]/55">Practice analytics</p>
              <h2 className="display mt-2 text-[30px] leading-tight sm:text-[38px]">
                The charts live on your dashboard.
              </h2>
              <p className="mt-2 max-w-[52ch] text-[13.5px] leading-relaxed text-[var(--paper)]/65">
                Streak heatmap, interview score trend, pass rate and language mix — the numbers behind
                this profile.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--paper)] px-5 text-[13.5px] font-semibold text-[var(--ink)] transition-transform hover:-translate-y-0.5"
            >
              Open dashboard <LayoutDashboard className="size-4" />
            </Link>
          </section>
        )}

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="mono-label">
            <Sparkles className="mr-1 inline size-3" /> {displayName} on CodeVit
          </p>
          <div className="flex items-center gap-5 text-[12.5px] text-muted-foreground">
            <Link href="/explore" className="link-underline hover:text-foreground">
              Explore code
            </Link>
            <Link href="/learn" className="link-underline hover:text-foreground">
              Learn to code
            </Link>
            <Link href="/blog" className="link-underline hover:text-foreground">
              Read the blog
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
