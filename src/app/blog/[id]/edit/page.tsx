"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { TutorialForm } from "@/components/tutorial-editor-form";
import { EditorTourButton } from "@/components/tour/editor-tour-button";

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

  const handleSave = async (data: {
    title: string;
    content: string;
    language: string;
  }) => {
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
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Post not found</h1>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/blog">
              <ArrowLeft className="size-4" /> Back to Blog
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  if (notAllowed) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <ShieldX className="mx-auto mb-3 size-10 text-destructive" />
          <h1 className="text-2xl font-bold">Only the author can edit this post</h1>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={`/blog/${id}`}>
              <ArrowLeft className="size-4" /> Back to post
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  if (!tutorial) {
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
      {/* Medium's editor is a single wide column with no page furniture */}
      <main className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-8 sm:px-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/blog/${id}`}>
              <ArrowLeft className="size-4" /> Back to post
            </Link>
          </Button>
          <EditorTourButton />
        </div>
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
      </main>
    </div>
  );
}
