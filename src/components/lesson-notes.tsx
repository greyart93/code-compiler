"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, StickyNote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";

type Note = { id: string; title: string; body: string; updatedAt: string };

/**
 * A "My notes" panel on the lesson page — the user writes a note while
 * learning; it saves to their profile. Collapsible so it never blocks the lesson.
 */
export function LessonNotes({
  courseSlug,
  lessonId,
}: {
  courseSlug: string;
  lessonId: string;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/notes")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) =>
        setNotes(
          (d.notes as Array<Note & { courseSlug: string | null; lessonId: string | null }>).filter(
            (n) => n.courseSlug === courseSlug && n.lessonId === lessonId
          )
        )
      )
      .catch(() => setNotes([]));
  };

  useEffect(() => {
    if (open) load();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/notes?id=${editingId}` : "/api/notes", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, courseSlug, lessonId }),
      });
      if (!res.ok) throw new Error();
      toast(editingId ? "Note updated" : "Note saved 📌", { variant: "success" });
      setEditingId(null);
      setTitle("");
      setBody("");
      load();
    } catch {
      toast("Could not save note", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
    setNotes((n) => (n ? n.filter((x) => x.id !== id) : n));
  };

  return (
    <div className="mt-6 rounded-lg border bg-background/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium"
      >
        <StickyNote className="size-4 text-primary" />
        My notes
        {notes !== null && notes.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({notes.length})
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {open ? "hide" : "take a note while you learn"}
        </span>
      </button>

      {open && (
        <div className="border-t px-4 py-3">
          <div className="grid gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title (optional)"
              maxLength={120}
              className="h-8 text-sm"
            />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write what you learned, questions you have, code snippets you want to remember…"
              className="min-h-[90px] text-sm"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={save} disabled={saving || !body.trim()}>
                {saving ? "Saving…" : editingId ? "Update note" : "Save note"}
              </Button>
              {editingId && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setTitle("");
                    setBody("");
                  }}
                >
                  <X className="size-3.5" /> Cancel
                </Button>
              )}
            </div>
          </div>

          {notes && notes.length > 0 && (
            <div className="mt-4 grid gap-2">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="group flex items-start gap-2 rounded-lg border bg-card px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="whitespace-pre-line text-xs text-muted-foreground">{n.body}</p>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label="Edit note"
                      onClick={() => {
                        setEditingId(n.id);
                        setTitle(n.title);
                        setBody(n.body);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive hover:text-destructive"
                      aria-label="Delete note"
                      onClick={() => remove(n.id)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Standalone notes page body — every note the user has saved, grouped by course. */
export function AllNotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notes")
      .then((r) => (r.ok ? r.json() : Promise.resolve({ notes: [] })))
      .then((d) => setNotes(d.notes ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (notes.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        No notes yet — open any lesson and take notes while you learn.
      </p>
    );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {notes.map((n) => (
        <div key={n.id} className="rounded-xl border bg-card p-4">
          <p className="font-medium">{n.title}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{n.body}</p>
        </div>
      ))}
    </div>
  );
}
