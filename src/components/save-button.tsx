"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCodeStore } from "@/store/code-store";
import { toast } from "@/components/ui/toaster";

export function SaveButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter();
  const { code, language, input } = useCodeStore();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "signin" | "error">("idle");

  const handleSave = async () => {
    if (!code?.trim()) return;
    setState("saving");
    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${language} snippet`,
          language,
          code,
          input: typeof input === "string" ? input : null,
          isPublic: true,
        }),
      });
      if (res.status === 401) {
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
      setState("saved");
      toast("Snippet saved!", { description: "Find it on your dashboard.", variant: "success" });
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleSave} disabled={state === "saving"}>
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
          {state === "saved" ? "Saved!" : state === "error" ? "Failed" : "Save"}
        </span>
      )}
    </Button>
  );
}
