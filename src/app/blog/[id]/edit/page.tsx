"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { TutorialForm } from "@/components/tutorial-editor-form";

type Tutorial = {
  id: string;
  title: string;
  content: string;
  language: string | null;
  user: { id: string };
};

export default function EditTutorialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [notAllowed, setNotAllowed] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/tutorials?id=${id}`).then(async (r) => {
        if (!r.ok) throw new Error("notfound");
        return r.json();
      }),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([tData, meData]) => {
        const t = tData.tutorial;
        if (!t) {
          setNotFound(true);
          return;
        }
        setTutorial(t);
        if (meData.user?.id !== t.user.id) setNotAllowed(true);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const handleSave = async (data: { title: string; content: string; language: string }) => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/tutorials?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        setError(resData.error ?? "Failed to save");
        return;
      }
      router.push(`/blog/${id}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-24">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
            <p className="mono-label">404 · essay</p>
            <h1 className="display mt-4 text-[42px]">That page is blank.</h1>
            <Button variant="outline" className="mt-6 gap-1.5" asChild>
              <Link href="/blog">
                <ArrowLeft className="size-4" /> Back to the blog
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (notAllowed) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-24">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
              <ShieldX className="size-5" />
            </span>
            <h1 className="display mt-5 text-[36px]">Only the author can edit this.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You can still read the essay — you just cannot change it.
            </p>
            <Button variant="outline" className="mt-6 gap-1.5" asChild>
              <Link href={`/blog/${id}`}>
                <ArrowLeft className="size-4" /> Back to the essay
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <div className="page-wrap grid place-items-center py-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-24 pt-6 sm:pt-8">
        <header className="reveal flex flex-wrap items-end justify-between gap-6 border-b border-border pb-7">
          <div className="min-w-0">
            <p className="mono-label">Editing essay</p>
            <h1 className="display mt-3 line-clamp-2 text-[clamp(32px,5vw,56px)]">{tutorial.title}</h1>
            <p className="mt-3 text-[13px] text-muted-foreground">
              Changes go live the moment you save.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/blog/${id}`} className="btn btn-outline">
              <ArrowLeft className="size-4" /> Back to essay
            </Link>
          </div>
        </header>

        <div className="reveal reveal-1 mx-auto mt-8 w-full max-w-[880px]">
          <TutorialForm
            key={tutorial.id}
            initialTitle={tutorial.title}
            initialLanguage={tutorial.language ?? "general"}
            initialContent={tutorial.content}
            submitLabel={busy ? "Saving…" : "Save changes"}
            busy={busy}
            error={error}
            onSubmit={handleSave}
            onCancel={() => router.push(`/blog/${id}`)}
          />
        </div>
      </main>
    </div>
  );
}
