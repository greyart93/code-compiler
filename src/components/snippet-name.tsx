"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const MAX_TITLE = 120;

/** Small modal that asks for a snippet name. Used when saving and when renaming. */
export function SnippetNameDialog({
  open,
  heading,
  description,
  initialName,
  confirmLabel = "Save",
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  heading: string;
  description?: string;
  initialName: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [open, initialName]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const trimmed = name.trim().slice(0, MAX_TITLE);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-foreground/25 p-4 backdrop-blur-[2px] sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${fieldId}-heading`}
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy && trimmed) onConfirm(trimmed);
        }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-[0_24px_60px_rgba(10,10,11,0.18)]"
      >
        <h2 id={`${fieldId}-heading`} className="text-[15px] font-semibold tracking-[-0.01em]">
          {heading}
        </h2>
        {description && (
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
        )}
        <div className="mt-4">
          <Label htmlFor={fieldId} className="mono-label !text-[9px]">
            Name
          </Label>
          <Input
            id={fieldId}
            ref={inputRef}
            value={name}
            maxLength={MAX_TITLE}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Monthly revenue by plan"
            className="mt-2 h-9 rounded-lg px-3 font-mono text-[12.5px]"
          />
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <span className="text-[11px] text-muted-foreground">
              Shown on your dashboard and profile.
            </span>
            <span className="mono-label shrink-0 !text-[9px]">
              {trimmed.length}/{MAX_TITLE}
            </span>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={busy || !trimmed} className="gap-1.5">
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Click-to-edit snippet title. A second, quicker way to rename alongside the
 * dialog button; committing on Enter or blur, reverting on Escape.
 */
export function InlineSnippetTitle({
  id,
  title,
  onRenamed,
  className,
}: {
  id: string;
  title: string;
  onRenamed: (title: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!editing) setValue(title);
  }, [title, editing]);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const startEditing = () => {
    busyRef.current = false;
    setValue(title);
    setEditing(true);
  };

  const cancel = () => {
    setValue(title);
    setEditing(false);
  };

  const commit = async () => {
    if (busyRef.current) return;
    const next = value.trim().slice(0, MAX_TITLE);
    if (!next || next === title) {
      cancel();
      return;
    }
    busyRef.current = true;
    setSaving(true);
    try {
      const res = await fetch(`/api/snippets?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
        toast(typeof data?.error === "string" ? data.error : "Could not rename snippet", {
          variant: "error",
        });
        // Stay in edit mode so the typed name isn't thrown away
        busyRef.current = false;
        return;
      }
      onRenamed(next);
      setEditing(false);
      toast(`Renamed to “${next}”`, { variant: "success" });
    } catch {
      toast("Could not rename snippet", { variant: "error" });
      busyRef.current = false;
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        maxLength={MAX_TITLE}
        disabled={saving}
        aria-label="Snippet name"
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void commit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
        className={cn(
          "h-6 w-full min-w-0 rounded-md border border-input bg-card px-1.5 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60",
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      title="Click to rename"
      className={cn("group min-w-0 cursor-text text-left", className)}
    >
      <span className="block truncate text-[13px] font-medium group-hover:underline group-hover:decoration-dotted group-hover:underline-offset-[3px]">
        {title}
      </span>
    </button>
  );
}

/** Rename control for a saved snippet, shown only to its owner. */
export function SnippetRenameButton({
  id,
  title,
  onRenamed,
  className,
}: {
  id: string;
  title: string;
  onRenamed: (title: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const rename = async (next: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/snippets?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
        toast(typeof data?.error === "string" ? data.error : "Could not rename snippet", {
          variant: "error",
        });
        return;
      }
      toast(`Renamed to “${next}”`, { variant: "success" });
      onRenamed(next);
      setOpen(false);
    } catch {
      toast("Could not rename snippet", { variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Rename ${title}`}
        title="Rename snippet"
        className={cn("text-muted-foreground hover:text-foreground", className)}
      >
        <Pencil className="size-4" />
      </Button>
      <SnippetNameDialog
        open={open}
        heading="Rename snippet"
        description="Give it a name you'll recognise later."
        initialName={title}
        confirmLabel="Rename"
        busy={busy}
        onCancel={() => {
          if (!busy) setOpen(false);
        }}
        onConfirm={rename}
      />
    </>
  );
}
