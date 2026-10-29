"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { TutorialForm } from "@/components/tutorial-editor-form";

export default function NewTutorialPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async (data: { title: string; content: string; language: string }) => {
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
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-24 pt-6 sm:pt-8">
        <header className="reveal flex flex-wrap items-end justify-between gap-6 border-b border-border pb-7">
          <div className="min-w-0">
            <p className="mono-label">New essay · free to publish</p>
            <h1 className="display mt-3 text-[clamp(36px,6vw,70px)]">Write something useful.</h1>
            <p className="mt-4 max-w-[62ch] text-[14.5px] leading-relaxed text-muted-foreground sm:text-[15px]">
              One clear idea, a working example, and the trade-off you learned the hard way. That is
              enough for a good tutorial.
            </p>
          </div>
          <Link href="/blog" className="btn btn-outline">
            <ArrowLeft className="size-4" /> The blog
          </Link>
        </header>

        <div className="reveal reveal-1 mx-auto mt-8 w-full max-w-[880px]">
          <TutorialForm
            initialTitle=""
            initialLanguage="general"
            initialContent="<p></p>"
            submitLabel={busy ? "Publishing…" : "Publish essay"}
            busy={busy}
            error={error}
            onSubmit={handlePublish}
            onCancel={() => router.back()}
          />
          {busy && (
            <p className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Publishing…
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
