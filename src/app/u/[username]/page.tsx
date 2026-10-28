"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  CalendarDays,
  Camera,
  Check,
  Code2,
  FileCode2,
  Globe,
  GraduationCap,
  Loader2,
  Lock,
  Pencil,
  Trash2,
  Upload,
  X,
  Award,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SnippetActions } from "@/components/snippet-actions";
import { SiteHeader } from "@/components/site-header";
import { toast } from "@/components/ui/toaster";
import { COURSES } from "@/data/courses";

type Profile = {
  user: {
    id: string;
    username: string;
    name: string | null;
    bio: string | null;
    image: string | null;
    createdAt: string;
  };
  stats: { publicSnippets: number; totalSnippets?: number; tutorials: number };
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

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [notFound, setNotFound] = useState(false);

  // Profile editing (owner only)
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setTutorials((tData.tutorials ?? []).filter((t: { user: { username: string } }) => t.user.username === username));
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

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
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="flex justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 flex items-start gap-4"
        >
          {/* Avatar with upload overlay for the owner */}
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="group relative">
            {profile.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.user.image}
                alt={`${profile.user.username}'s avatar`}
                className="size-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {(profile.user.name ?? profile.user.username).charAt(0).toUpperCase()}
              </div>
            )}
            {profile.isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  aria-label={profile.user.image ? "Change avatar" : "Upload avatar"}
                  title={profile.user.image ? "Change avatar" : "Upload avatar"}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                >
                  {uploading ? (
                    <Loader2 className="size-5 animate-spin text-white" />
                  ) : (
                    <Camera className="size-5 text-white" />
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

            {/* always-visible photo control for the owner (the camera only shows on hover) */}
            {profile.isOwner && !editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-7 gap-1 px-2 text-xs"
              >
                {uploading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : profile.user.image ? (
                  <Camera className="size-3" />
                ) : (
                  <Upload className="size-3" />
                )}
                {profile.user.image ? "Change photo" : "Upload photo"}
              </Button>
            )}
          </div>

          <div className="flex-1">
            {!editing ? (
              <>
                <h1 className="text-2xl font-bold">
                  {profile.user.name ?? profile.user.username}
                </h1>
                <p className="text-sm text-muted-foreground">@{profile.user.username}</p>
                {profile.user.bio && (
                  <p className="mt-2 whitespace-pre-line text-sm">{profile.user.bio}</p>
                )}
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  Joined {new Date(profile.user.createdAt).toLocaleDateString()}
                </p>
              </>
            ) : (
              <div className="grid gap-3">
                {/* Profile photo */}
                <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  {profile.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.user.image}
                      alt="Your avatar"
                      className="size-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(profile.user.name ?? profile.user.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Profile photo</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or WebP — resized to 256px automatically
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-8 gap-1.5"
                  >
                    {uploading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : profile.user.image ? (
                      <Camera className="size-3.5" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    {profile.user.image ? "Change" : "Upload"}
                  </Button>
                  {profile.user.image && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveAvatar}
                      disabled={uploading}
                      className="h-8 text-destructive hover:text-destructive"
                      aria-label="Remove profile photo"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="edit-name" className="text-xs">Display name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                    maxLength={60}
                    className="h-8"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="edit-bio" className="text-xs">Bio</Label>
                  <Textarea
                    id="edit-bio"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tell the community about yourself…"
                    maxLength={280}
                    className="min-h-[64px] text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="size-3.5 animate-spin" />} Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(false);
                      setEditName(profile.user.name ?? "");
                      setEditBio(profile.user.bio ?? "");
                    }}
                    disabled={saving}
                  >
                    <X className="size-3.5" /> Cancel
                  </Button>
                  {profile.user.image && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveAvatar}
                      disabled={uploading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" /> Remove avatar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {profile.isOwner && (
            <div className="flex shrink-0 flex-col items-end gap-2">
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="gap-1.5"
                >
                  <Pencil className="size-3.5" /> Edit profile
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">My snippets</Link>
              </Button>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[
            {
              label: profile.isOwner ? "Public snippets" : "Snippets",
              value: profile.stats.publicSnippets,
            },
            ...(profile.isOwner
              ? [{ label: "Private snippets", value: (profile.stats.totalSnippets ?? 0) - profile.stats.publicSnippets }]
              : []),
            { label: "Tutorials", value: profile.stats.tutorials },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completed courses */}
        {profile.completedCourses.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Award className="size-4 text-primary" /> Completed courses
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {profile.completedCourses.map((c) => {
                const course = COURSES.find((x) => x.slug === c.slug);
                return (
                  <Link
                    key={c.slug}
                    href={`/learn/${c.slug}`}
                    className="flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/5 py-1.5 pl-1.5 pr-3.5 transition-colors hover:border-primary/60 hover:bg-primary/10"
                    title={
                      course
                        ? `${course.title} — completed ${new Date(c.completedAt).toLocaleDateString()}`
                        : c.slug
                    }
                  >
                    <span
                      className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${course?.accent ?? "bg-primary/15 text-primary"}`}
                    >
                      {course?.icon ?? c.slug.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium">{course?.title ?? c.slug}</span>
                    <Check className="size-3.5 text-green-500" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Snippet showcase — top 6 recently saved */}
        <section className="mb-10">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <FileCode2 className="size-4 text-primary" /> Code showcase
            <span className="text-xs font-normal text-muted-foreground">
              {snippets && snippets.length > 6 ? `${Math.min(6, snippets.length)} of ${snippets.length}` : ""}
            </span>
          </h2>
          {snippets === null ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : snippets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No public snippets yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {snippets.slice(0, 6).map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="py-4">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{s.title}</p>
                        {profile.isOwner ? (
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
                      <div className="mt-3 flex items-center justify-between">
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
          {snippets !== null && snippets.length > 6 && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href={`/codes/${username}`}>
                  See all {snippets.length} saved codes <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* Tutorials */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <GraduationCap className="size-4 text-primary" /> Tutorials
          </h2>
          {tutorials.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No tutorials published yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {tutorials.map((t) => (
                <Card key={t.id} className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center gap-3 py-3.5">
                    <Code2 className="size-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/blog/${t.id}`} className="truncate font-medium hover:underline">
                        {t.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {t.language ?? "general"} ·{" "}
                        {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
