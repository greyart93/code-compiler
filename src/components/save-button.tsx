"use client";

import { useState } from "react";
import { Save, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SnippetNameDialog } from "@/components/snippet-name";
import { useCodeStore } from "@/store/code-store";
import { toast } from "@/components/ui/toaster";

export type EditableSnippet = { id: string; title: string };

export function SaveButton({
  iconOnly = false,
  snippet = null,
  onSaved,
}: {
  iconOnly?: boolean;
  /** The snippet currently open in the editor, when the viewer owns it */
  snippet?: EditableSnippet | null;
  /** Called with the final name and the snippet id (created or updated) */
  onSaved?: (title: string, id: string) => void;
}) {
  const { code, language, input } = useCodeStore();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "signin" | "error">("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  // Which action just finished, so a brand-new snippet doesn't claim to be “Updated”
  const [lastAction, setLastAction] = useState<"create" | "update" | null>(null);

  const editing = Boolean(snippet);
  const label = editing ? "Update" : "Save";

  const openDialog = () => {
    if (!code?.trim() || state === "saving") return;
    setName(snippet?.title ?? `${language} snippet`);
    setDialogOpen(true);
  };

  const handleSave = async (title: string) => {
    if (!code?.trim()) return;
    setLastAction(editing ? "update" : "create");
    setState("saving");
    try {
      const res = await fetch(editing ? `/api/snippets?id=${snippet!.id}` : "/api/snippets", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          language,
          code,
          input: typeof input === "string" ? input : null,
          ...(editing ? {} : { isPublic: true }),
        }),
      });
      if (res.status === 401) {
        setDialogOpen(false);
        toast("Login to save", {
          description: "Sign in to save this code to your account.",
          variant: "error",
          actionLabel: "Sign in",
          actionHref: "/login",
        });
        setState("idle");
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json().catch(() => null)) as
        | { snippet?: { id?: string } }
        | null;
      setDialogOpen(false);
      setState("saved");
      toast(editing ? `Updated “${title}”` : `Saved “${title}”`, {
        description: editing
          ? "Your changes are live wherever this snippet is shared."
          : "Find it on your dashboard.",
        variant: "success",
      });
      const savedId = editing ? snippet!.id : data?.snippet?.id;
      if (savedId) onSaved?.(title, savedId);
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={openDialog}
        disabled={state === "saving"}
        title={editing ? "Update this snippet with the current code" : "Save this code as a snippet"}
      >
        {state === "saving" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : state === "saved" ? (
          <Check className="size-4" />
        ) : (
          <Save className="size-4" />
        )}
        {/* icon-only mode for the collapsed rail; label shown when expanded */}
        {!iconOnly && (
          <span>
            {state === "saved"
              ? lastAction === "update"
                ? "Updated!"
                : "Saved!"
              : state === "error"
                ? "Failed"
                : label}
          </span>
        )}
      </Button>
      <SnippetNameDialog
        open={dialogOpen}
        heading={editing ? "Update this snippet" : "Name this snippet"}
        description={
          editing ? `${language} · overwrites the saved version` : `${language} · saved to your account`
        }
        initialName={name}
        confirmLabel={editing ? "Update snippet" : "Save snippet"}
        busy={state === "saving"}
        onCancel={() => {
          if (state !== "saving") setDialogOpen(false);
        }}
        onConfirm={handleSave}
      />
    </>
  );
}
