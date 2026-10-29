"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Eye, Loader2, Pencil, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site-header";
import { PostBody } from "@/components/post-body";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";

export default function AskQuestionPage() {
  const router = useRouter();
  const { me, loaded } = useMe();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, tags }),
      });
      const d = await res.json();
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError(d.error ?? "Failed to post question");
        return;
      }
      router.push(`/discuss/${d.question.id}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <header className="reveal border-b border-border pb-7">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mono-label">Discuss · new thread</p>
              <h1 className="display mt-3 text-[clamp(38px,6.4vw,74px)]">Ask a question.</h1>
              <p className="mt-4 max-w-[62ch] text-[14.5px] leading-relaxed text-muted-foreground sm:text-[15px]">
                The best questions are specific: what you tried, what you expected, and what actually
                happened. Paste the smallest failing snippet.
              </p>
            </div>
            <Link href="/discuss" className="btn btn-outline">
              <ArrowLeft className="size-4" /> All threads
            </Link>
          </div>
        </header>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <form onSubmit={handleSubmit} className="reveal reveal-1 min-w-0">
            <div className="card-surface overflow-hidden">
              <div className="border-b border-border px-5 py-4 sm:px-6">
                <Label htmlFor="title" className="mono-label !text-[10px]">
                  Title
                </Label>
                <Input
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Why does typeof NaN return 'number'?"
                  maxLength={180}
                  className="mt-2 h-auto border-0 bg-transparent px-0 text-[22px] font-semibold tracking-[-0.02em] shadow-none focus-visible:ring-0 sm:text-[26px]"
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11.5px] text-muted-foreground">
                    One sentence. Name the language or tool if it matters.
                  </p>
                  <span className="mono-label shrink-0 !text-[9px]">{title.length}/180</span>
                </div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="body" className="mono-label !text-[10px]">
                    Question
                  </Label>
                  <div className="flex items-center rounded-full border border-border bg-card p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreview(false)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                        !preview
                          ? "bg-[var(--ink)] text-[var(--paper)]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Pencil className="size-3" /> Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreview(true)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                        preview
                          ? "bg-[var(--ink)] text-[var(--paper)]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Eye className="size-3" /> Preview
                    </button>
                  </div>
                </div>

                {preview ? (
                  <div className="mt-3 min-h-[200px] rounded-xl border border-border bg-muted/20 p-4">
                    {body.trim() ? (
                      <PostBody body={body} />
                    ) : (
                      <p className="text-[13px] text-muted-foreground">Nothing to preview yet.</p>
                    )}
                  </div>
                ) : (
                  <Textarea
                    id="body"
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={
                      "Describe the problem.\n\nWhat did you try?\nWhat did you expect?\nWhat happened instead?\n\n```js\n// smallest failing snippet\n```"
                    }
                    className="mt-3 min-h-[220px] font-mono text-[13px] leading-relaxed"
                  />
                )}
                <p className="mt-2 text-[11.5px] text-muted-foreground">
                  Wrap code in triple backticks and name the language:{" "}
                  <span className="font-mono text-foreground/70">```js … ```</span>
                </p>
              </div>

              <div className="border-t border-border px-5 py-5 sm:px-6">
                <Label htmlFor="tags" className="mono-label !text-[10px]">
                  Tags <span className="normal-case tracking-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="javascript, react, promises"
                  className="mt-2"
                />
                <p className="mt-2 text-[11.5px] text-muted-foreground">
                  Comma separated. Two or three precise tags beat ten broad ones.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
                <Button type="submit" disabled={busy || !title.trim() || !body.trim()} className="gap-1.5">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Post question
                </Button>
                <Button type="button" variant="ghost" asChild>
                  <Link href="/discuss">Cancel</Link>
                </Button>
                {error && <p className="text-[12.5px] text-destructive">{error}</p>}
                {loaded && !me && (
                  <p className="ml-auto text-[11.5px] text-muted-foreground">
                    You will be asked to sign in.
                  </p>
                )}
              </div>
            </div>
          </form>

          <aside className="reveal reveal-2 grid gap-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-dashed border-border p-5">
              <p className="mono-label">A good question</p>
              <ol className="mt-3 space-y-3">
                {[
                  ["01", "State the goal", "What are you trying to make happen?"],
                  ["02", "Show the attempt", "The smallest snippet that fails."],
                  ["03", "Name the error", "Paste the exact message, not a summary."],
                  ["04", "Say the version", "Language, framework, browser."],
                ].map(([n, head, body]) => (
                  <li key={n} className="flex gap-2.5">
                    <span className="mono-label shrink-0 !text-[9px] text-primary">{n}</span>
                    <div>
                      <p className="text-[12.5px] font-medium leading-snug">{head}</p>
                      <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl bg-[var(--ink)] p-5 text-[var(--paper)]">
              <p className="mono-label !text-[var(--paper)]/50">Already answered?</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--paper)]/70">
                Search the archive first — someone may have hit the same wall.
              </p>
              <div className="mt-4 grid gap-2">
                <Link
                  href="/discuss"
                  className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-white/15"
                >
                  Browse threads <ArrowUpRight className="size-3.5" />
                </Link>
                <Link
                  href="/blog"
                  className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-white/15"
                >
                  Read the blog <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
