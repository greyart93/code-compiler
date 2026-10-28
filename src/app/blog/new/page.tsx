"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { TutorialForm } from "@/components/tutorial-editor-form";
import { EditorTourButton } from "@/components/tour/editor-tour-button";

export default function NewTutorialPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async (data: {
    title: string;
    content: string;
    language: string;
  }) => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/tutorials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError(resData.error ?? "Failed to publish");
        return;
      }
      router.push(`/blog/${resData.tutorial.id}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      {/* Medium's editor is a single wide column with no page furniture */}
      <main className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-8 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-4 flex justify-end">
            <EditorTourButton />
          </div>
          <TutorialForm
            initialTitle=""
            initialLanguage="general"
            initialContent="<p></p>"
            submitLabel={busy ? "Publishing…" : "Publish"}
            busy={busy}
            error={error}
            onSubmit={handlePublish}
            onCancel={() => router.back()}
          />
          {busy && (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Saving…
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
