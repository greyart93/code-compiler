"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

/**
 * Delete control for a saved snippet, shown only to its owner.
 * First click arms the button ("Delete?"), a second click within four seconds
 * actually deletes — the same confirmation pattern used elsewhere in app.
 */
export function SnippetDeleteButton({
  id,
  title,
  onDeleted,
  className,
}: {
  id: string;
  title: string;
  onDeleted: () => void;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  const disarm = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setConfirming(false);
  };

  const handleClick = async () => {
    if (deleting) return;

    if (!confirming) {
      setConfirming(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setConfirming(false), 4000);
      return;
    }

    disarm();
    setDeleting(true);
    try {
      const res = await fetch(`/api/snippets?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
        toast(typeof data?.error === "string" ? data.error : "Could not delete snippet", {
          variant: "error",
        });
        return;
      }
      toast(`Deleted “${title}”`, { variant: "success" });
      onDeleted();
    } catch {
      toast("Could not delete snippet", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={confirming ? "sm" : "icon"}
      onClick={handleClick}
      disabled={deleting}
      aria-label={confirming ? `Confirm delete ${title}` : `Delete ${title}`}
      title={confirming ? "Click again to delete" : "Delete snippet"}
      className={cn(
        "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
        confirming &&
          "gap-1 bg-destructive/10 px-2.5 text-[11px] font-medium text-destructive hover:bg-destructive/15 hover:text-destructive",
        className
      )}
    >
      {deleting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
      {confirming && !deleting && <span>Delete?</span>}
    </Button>
  );
}
