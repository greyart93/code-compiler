"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  Loader2,
  ArrowLeft,
  Terminal,
  Code2,
  CornerDownLeft,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SnippetActions } from "@/components/snippet-actions";
import { SaveButton } from "@/components/save-button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { SqlWorkspace, type SqlWorkspaceHandle } from "@/components/sql-workspace";
import { useCodeStore } from "@/store/code-store";
import { LANGUAGES, FILE_NAME, aceModeFor, resolveLanguage } from "@/lib/language";
import { compileReactPreview } from "@/lib/react-preview";
import { useRunShortcut } from "@/lib/use-run-shortcut";
import codeSnippets from "../_editor/code-snippets";
import { toast } from "@/components/ui/toaster";
import { getJson, peek } from "@/lib/api-cache";
import { cn } from "@/lib/utils";

// Marks the duplicate history entry used to guard Back where the Navigation API is missing
const HISTORY_GUARD_KEY = "codevitSnippetGuard";

// Ace mode names differ from our language keys (go→golang, bash→sh, assembly→assembly_x86…)
const aceMode = (language: string) => aceModeFor(language);

const AceEditor = dynamic(() => import("../_editor/(AceEditor)/page"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading editor…
    </div>
  ),
});

export default function Playground() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PlaygroundInner />
    </Suspense>
  );
}

function PlaygroundInner() {
  const { code, updateCode, language, updateLanguage, input, updateInput } =
    useCodeStore();
  // The editor is always dark — the code slab is the one constant across themes.

  // 👇 ?snippet=<id> — open a shared snippet (from Explore, Dashboard, profile…)
  // 👇 ?code=&lang=&from= — open code straight from a Learn lesson (with a back link)
  const searchParams = useSearchParams();
  const snippetId = searchParams.get("snippet");
  const codeParam = searchParams.get("code");
  const langParam = searchParams.get("lang");
  const fromParam = searchParams.get("from");
  const [snippetTitle, setSnippetTitle] = useState<string | null>(null);
  // Set only when the open snippet belongs to the viewer, so Save becomes Update
  const [ownedSnippet, setOwnedSnippet] = useState<{ id: string; title: string } | null>(null);
  // What was last saved for that snippet — compared against the live editor
  const [savedVersion, setSavedVersion] = useState<{
    code: string;
    input: string;
    language: string;
    title: string;
  } | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  // While a shared snippet is still on its way, the editor must not show the
  // default Python starter first — that swap is what confused people.
  const [snippetLoading, setSnippetLoading] = useState(
    () => Boolean(snippetId) && peek(`/api/snippets?id=${snippetId}`) === undefined
  );
  // Where the user tried to go while dirty: another page, or the Back button
  const [pendingNav, setPendingNav] = useState<{ href: string } | { back: true } | null>(null);
  const allowBackRef = useRef(false);
  const router = useRouter();
  const loadedSnippetRef = useRef<string | null>(null);
  const loadedCodeRef = useRef<string | null>(null);

  // 👇 Hydrate the store with the visible starter snippet so Save/Run work immediately
  //    (skipped when a snippet or lesson code from the URL is about to take over)
  useEffect(() => {
    if (snippetId || codeParam) return;
    // ?lang=react (without code) should still select React and show its starter.
    const fromUrl = resolveLanguage(langParam);
    if (fromUrl) {
      updateLanguage(fromUrl);
      if (!code) updateCode(codeSnippets[fromUrl] ?? "");
      return;
    }
    if (!code) {
      updateCode(codeSnippets[language as keyof typeof codeSnippets] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!snippetId) {
      setSnippetLoading(false);
      return;
    }
    if (loadedSnippetRef.current === snippetId) return;
    loadedSnippetRef.current = snippetId;
    const fallbackToStarter = () => {
      if (!useCodeStore.getState().code) {
        updateCode(codeSnippets[useCodeStore.getState().language as keyof typeof codeSnippets] ?? "");
      }
    };
    // Already fetched this session (hover prefetch or a previous visit): no spinner
    if (peek(`/api/snippets?id=${snippetId}`) === undefined) setSnippetLoading(true);
    (async () => {
      try {
        const data = await getJson<{
          snippet?: { id: string; title: string; language: string; code: string; input?: string };
          mine?: boolean;
        }>(`/api/snippets?id=${snippetId}`);
        const s = data?.snippet;
        if (!s) {
          fallbackToStarter();
          return;
        }
        if (typeof s.language === "string") {
          updateLanguage(resolveLanguage(s.language) ?? s.language);
        }
        updateCode(s.code ?? "");
        if (typeof s.input === "string") updateInput(s.input);
        setSnippetTitle(s.title ?? null);
        setOwnedSnippet(
          data?.mine ? { id: s.id ?? snippetId, title: s.title ?? "Untitled snippet" } : null
        );
        setSavedVersion(
          data?.mine
            ? {
                code: s.code ?? "",
                input: typeof s.input === "string" ? s.input : "",
                language: resolveLanguage(s.language) ?? s.language ?? "",
                title: s.title ?? "Untitled snippet",
              }
            : null
        );
        setJustSaved(false);
      } catch {
        toast("Snippet not found", {
          description: "It may be private or deleted.",
          variant: "error",
        });
        fallbackToStarter();
      } finally {
        setSnippetLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snippetId]);

  // Leaving the snippet URL (a plain /playground visit) must not keep updating it
  useEffect(() => {
    if (!snippetId) {
      setOwnedSnippet(null);
      setSavedVersion(null);
    }
  }, [snippetId]);

  // 👇 ?code=<text>&lang=<value> — load lesson code into the editor (once per param)
  useEffect(() => {
    if (!codeParam || loadedCodeRef.current === codeParam) return;
    loadedCodeRef.current = codeParam;
    const resolved = resolveLanguage(langParam);
    if (resolved) {
      updateLanguage(resolved);
    }
    updateCode(codeParam);
    setSnippetTitle(null);
    setOwnedSnippet(null);
    setSavedVersion(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam, langParam]);

  const [output, setOutput] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [running, setRunning] = useState(false);
  const [ranOnce, setRanOnce] = useState(false);
  const [pane, setPane] = useState<"output" | "input">("output");
  const [reactPreview, setReactPreview] = useState<string | null>(null);
  const [sqlRunning, setSqlRunning] = useState(false);
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const sqlRef = useRef<SqlWorkspaceHandle | null>(null);

  const handleLanguageChange = (value: string) => {
    const snippet = codeSnippets[value as keyof typeof codeSnippets];
    updateLanguage(value);
    setReactPreview(null);
    setOutput(null);
    setIsError(false);
    setRanOnce(false);
    setSqlRunning(false);
    setEditorFullscreen(false);
    setOutputOpen(false);
    if (snippet !== undefined) updateCode(snippet);
  };

  const handleRun = async () => {
    if (running) return;
    setOutputOpen(true); // ⌘/Ctrl+Enter shouldn't stack runs
    setRunning(true);
    setIsError(false);
    setOutput(null);
    setReactPreview(null);
    try {
      if (language === "react") {
        setRanOnce(true);
        const preview = await compileReactPreview(code ?? "");
        setReactPreview(preview);
        setPane("output");
        return;
      }

      const res = await fetch("/api/runCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, input }),
      });
      const data = await res.json();
      const stdout: string = data?.data?.stdout ?? "";
      const stderr: string = data?.data?.stderr ?? "";
      if (stderr) {
        setIsError(true);
        setOutput(stderr);
      } else {
        setOutput(stdout || "(no output)");
      }
      setRanOnce(true);
      setPane("output");
    } catch (error) {
      setIsError(true);
      setOutput(
        language === "react"
          ? error instanceof Error
            ? error.message
            : "Could not compile React"
          : "Failed to reach the run API"
      );
      setRanOnce(true);
      setPane("output");
    } finally {
      setRunning(false);
    }
  };

  // ⌘/Ctrl + Enter runs, exactly like every other code editor
  const runCurrent = () => {
    if (language === "sql") {
      sqlRef.current?.run();
      return;
    }
    void handleRun();
  };
  useRunShortcut(runCurrent);

  // ── drag-to-resize split ────────────────────────────────────────────────
  const splitRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  // editor pane width as a % of the split row (desktop only)
  const [editorPct, setEditorPct] = useState(62);

  // restore the last used split
  useEffect(() => {
    const saved = Number(window.localStorage.getItem("pg-split"));
    if (saved >= 25 && saved <= 88) setEditorPct(saved);
  }, []);

  // Fullscreen editor: lock the page behind it and let Escape close it.
  useEffect(() => {
    if (!editorFullscreen) return;
    const html = document.documentElement;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditorFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editorFullscreen]);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !splitRef.current) return;
    const rect = splitRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setEditorPct(Math.min(88, Math.max(25, pct)));
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    window.localStorage.setItem("pg-split", String(Math.round(editorPct)));
  };

  const lineCount = (code ?? "").split("\n").length;
  const langLabel = LANGUAGES.find((l) => l.value === language)?.label ?? language;

  // Only meaningful for a snippet the viewer owns: has the editor drifted from what's saved?
  const currentInput = typeof input === "string" ? input : "";
  const snippetDirty = Boolean(
    savedVersion &&
      ((code ?? "") !== savedVersion.code ||
        currentInput !== savedVersion.input ||
        language !== savedVersion.language)
  );
  // Reset the “Saved” flash whenever the editor starts changing again
  useEffect(() => {
    if (snippetDirty) setJustSaved(false);
  }, [snippetDirty]);

  // ── leave guard: don't walk away from unsaved edits to a snippet ─────────
  useEffect(() => {
    if (!snippetDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [snippetDirty]);

  // Catch in-app links in the capture phase so they beat Next's own handler
  useEffect(() => {
    if (!snippetDirty) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest?.(
        "a[href]"
      ) as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }
      event.preventDefault();
      setPendingNav({ href: `${url.pathname}${url.search}${url.hash}` });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [snippetDirty]);

  // Back/Forward: cancel the traversal and ask instead. Only the Navigation API can
  // stop an App Router traversal; browsers without it use the sentinel entry below.
  useEffect(() => {
    if (!snippetDirty) return;
    type NavigateEvent = Event & { navigationType?: string };
    type NavigationLike = {
      addEventListener: (type: "navigate", listener: (event: NavigateEvent) => void) => void;
      removeEventListener: (type: "navigate", listener: (event: NavigateEvent) => void) => void;
    };
    const nav = (window as unknown as { navigation?: NavigationLike }).navigation;
    if (!nav) return;
    const onNavigate = (event: NavigateEvent) => {
      if (allowBackRef.current) return;
      if (event.navigationType !== "traverse") return;
      if (!event.cancelable) return;
      event.preventDefault();
      setPendingNav({ back: true });
    };
    nav.addEventListener("navigate", onNavigate);
    return () => nav.removeEventListener("navigate", onNavigate);
  }, [snippetDirty]);

  // Fallback for browsers without the Navigation API (e.g. Firefox today): park a
  // duplicate history entry on top so Back lands back on this same URL, where a
  // popstate listener can intercept it.
  useEffect(() => {
    if (!snippetDirty) return;
    if ((window as unknown as { navigation?: unknown }).navigation) return;

    const pushSentinel = () => {
      const state = { ...(window.history.state ?? {}), [HISTORY_GUARD_KEY]: true };
      window.history.pushState(state, "", window.location.href);
    };
    pushSentinel();

    const onPopState = () => {
      if (allowBackRef.current) return;
      // Back landed on the sentinel's twin — hold the entry and ask instead
      pushSentinel();
      setPendingNav({ back: true });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [snippetDirty]);

  // Once the edits are saved or reverted the sentinel is no longer needed. Step back
  // onto its twin — same URL and same router state, so nothing visibly moves — so the
  // duplicate entry doesn't swallow the next Back press.
  useEffect(() => {
    if (snippetDirty) return;
    if ((window as unknown as { navigation?: unknown }).navigation) return;
    const state = window.history.state as Record<string, unknown> | null;
    if (state && state[HISTORY_GUARD_KEY]) {
      window.history.back();
    }
  }, [snippetDirty]);

  useEffect(() => {
    if (!pendingNav) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPendingNav(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [pendingNav]);

  if (snippetId && snippetLoading) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="mx-auto flex h-[calc(100svh-84px)] min-h-[560px] w-full flex-col items-center justify-center gap-3 px-3 pb-3 pt-2 sm:px-5">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <p className="text-[13px] text-muted-foreground">Opening snippet…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SiteHeader hidden={editorFullscreen} />

      <main className="mx-auto flex h-[calc(100svh-84px)] min-h-[560px] w-full flex-col px-3 pb-3 pt-2 sm:px-5">
        {fromParam && fromParam.startsWith("/learn/") && (
          <Link
            href={fromParam}
            className="mb-2 inline-flex w-fit items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to lesson
          </Link>
        )}

        {/* ── app bar ───────────────────────────────────────────────── */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 sm:flex">
              <Code2 className="size-3.5 text-muted-foreground" />
              <span className="mono-label !text-[9px]">Workspace</span>
            </span>
            <span className="hidden h-3.5 w-px bg-border sm:block" />
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="h-8 w-[116px] rounded-full border-border bg-card text-[12px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="whitespace-nowrap font-mono text-[11.5px] text-muted-foreground">
              {FILE_NAME[language] ?? "main.txt"}
            </span>
            {snippetTitle && (
              <span className="chip max-w-[110px] truncate !text-[10px] sm:max-w-[180px]" title={`Loaded: ${snippetTitle}`}>
                {snippetTitle}
              </span>
            )}
            {ownedSnippet && (snippetDirty || justSaved) && (
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em]",
                  snippetDirty
                    ? "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                )}
                title={
                  snippetDirty
                    ? "Edited since the last save — hit Update to keep these changes"
                    : "All changes are saved"
                }
                aria-live="polite"
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    snippetDirty ? "bg-amber-500" : "bg-emerald-500"
                  )}
                />
                {snippetDirty ? "Unsaved" : "Saved"}
              </span>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <SnippetActions language={language} code={code ?? ""} />
            <SaveButton
              snippet={ownedSnippet}
              onSaved={(title, id) => {
                setSnippetTitle(title);
                setOwnedSnippet({ id, title });
                setSavedVersion({
                  code: code ?? "",
                  input: currentInput,
                  language,
                  title,
                });
                setJustSaved(true);
                window.setTimeout(() => setJustSaved(false), 2500);
                // Adopt the snippet in the URL so later saves update it instead of
                // creating another copy. Mark it loaded so the code isn't re-fetched.
                if (snippetId !== id) {
                  loadedSnippetRef.current = id;
                  router.replace(`/playground?snippet=${encodeURIComponent(id)}`, {
                    scroll: false,
                  });
                }
              }}
            />
            <Button
              onClick={runCurrent}
              disabled={running || sqlRunning}
              className="h-9 shrink-0 gap-1.5 px-4"
            >
              {running || sqlRunning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              Run
              <kbd className="hidden rounded border border-current/25 px-1 py-px font-sans text-[9.5px] opacity-60 sm:inline">
                Ctrl ↵
              </kbd>
            </Button>
          </div>
        </div>

        {/* ── the dark slab: editor + console ───────────────────────── */}
        {language === "sql" ? (
          <SqlWorkspace
            ref={sqlRef}
            query={code ?? ""}
            onQueryChange={updateCode}
            onRunningChange={setSqlRunning}
          />
        ) : (
        <div
          ref={splitRef}
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0b0c0f]",
            editorFullscreen
              ? "fixed inset-0 z-40 rounded-none border-0 shadow-none"
              : "rounded-2xl border border-border shadow-[0_24px_70px_-45px_rgba(0,0,0,0.55)] lg:flex-row",
            dragging && "cursor-col-resize select-none"
          )}
        >
          <section
            className={cn(
              "flex min-h-0 min-w-0 flex-col",
              editorFullscreen
                ? "w-full flex-1"
                : "w-full flex-1 lg:w-[var(--editor-w)] lg:flex-none"
            )}
            style={{ "--editor-w": `${editorPct}%` } as CSSProperties}
          >
            <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex items-center gap-1.5" aria-hidden>
                  <span className="size-2 rounded-full bg-[#ff5f57]/80" />
                  <span className="size-2 rounded-full bg-[#febc2e]/80" />
                  <span className="size-2 rounded-full bg-[#28c840]/80" />
                </span>
                <span className="ml-1 truncate font-mono text-[11px] text-white/45">
                  {FILE_NAME[language] ?? "main.txt"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="mono-label hidden !text-[8.5px] !text-white/25 sm:inline">
                  ace · {langLabel}
                </span>
                {editorFullscreen && (
                  <button
                    type="button"
                    onClick={() => setOutputOpen((value) => !value)}
                    className={cn(
                      "inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-1.5 text-[10.5px] font-medium transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
                      outputOpen ? "bg-white/[0.07] text-white/70" : "text-white/45"
                    )}
                    aria-expanded={outputOpen}
                    aria-controls="editor-output"
                    title={outputOpen ? "Hide output" : "Show output"}
                  >
                    <Terminal className="size-3" />
                    Output
                    {outputOpen ? (
                      <ChevronDown className="size-3" />
                    ) : (
                      <ChevronUp className="size-3" />
                    )}
                  </button>
                )}
                {editorFullscreen && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleRun()}
                    disabled={running}
                    className="h-7 gap-1 px-2.5 text-[11px]"
                  >
                    {running ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Play className="size-3" />
                    )}
                    Run
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!editorFullscreen) {
                      setOutputOpen(Boolean(ranOnce || output || reactPreview));
                    }
                    setEditorFullscreen((value) => !value);
                  }}
                  className="grid size-7 shrink-0 place-items-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
                  aria-label={editorFullscreen ? "Exit fullscreen editor" : "Fullscreen editor"}
                  title={editorFullscreen ? "Exit fullscreen" : "Fullscreen editor"}
                >
                  {editorFullscreen ? (
                    <Minimize2 className="size-3.5" />
                  ) : (
                    <Maximize2 className="size-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0 overflow-hidden">
                <AceEditor
                  language={aceMode(language)}
                  theme="monokai"
                  defaultCode={codeSnippets[language as keyof typeof codeSnippets] ?? ""}
                  scode={code ?? ""}
                  onValueChange={updateCode}
                  onRun={() => void handleRun()}
                  height="100%"
                />
              </div>
            </div>
          </section>

          {/* drag divider */}
          <div
            aria-hidden
            onPointerDown={startDrag}
            onPointerMove={onDragMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            data-active={dragging}
            className={cn(
              "w-px shrink-0 cursor-col-resize touch-none self-stretch bg-white/10 transition-colors hover:bg-primary/60 data-[active=true]:bg-primary/70",
              editorFullscreen ? "hidden" : "hidden lg:block"
            )}
            title="Drag to resize"
          />

          <section
            id="editor-output"
            className={cn(
              "flex min-h-0 min-w-0 flex-col overflow-hidden border-t border-white/10",
              editorFullscreen
                ? outputOpen
                  ? "h-[38dvh] shrink-0"
                  : "hidden"
                : "flex-1 lg:border-t-0"
            )}
          >
            <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-3">
              <div className="flex gap-0.5">
                {(["output", "input"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPane(t)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
                      pane === t
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/80"
                    )}
                  >
                    {t === "output" && reactPreview ? "preview" : t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    running
                      ? "animate-pulse bg-amber-400"
                      : isError
                        ? "bg-red-400"
                        : ranOnce
                          ? "bg-emerald-400"
                          : "bg-white/25"
                  )}
                  aria-hidden
                />
                <span className="mono-label !text-[8.5px] !text-white/35">
                  {running ? "running…" : ranOnce ? "done" : "ready"}
                </span>
                <button
                  type="button"
                  className="rounded px-1.5 py-0.5 text-[10.5px] text-white/35 transition-colors hover:text-white"
                  onClick={() => {
                    setOutput(null);
                    setIsError(false);
                    setRanOnce(false);
                    setReactPreview(null);
                    setPane("input");
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {pane === "input" ? (
                <Textarea
                  value={typeof input === "string" ? input : ""}
                  onChange={(e) => updateInput(e.target.value)}
                  placeholder="stdin for your program — one value per line"
                  className="h-full w-full resize-none rounded-none border-0 bg-transparent p-4 font-mono text-[12.5px] leading-relaxed text-white/80 placeholder:text-white/25 focus-visible:ring-0"
                />
              ) : ranOnce ? (
                reactPreview ? (
                  <iframe
                    title="React preview"
                    srcDoc={reactPreview}
                    sandbox="allow-scripts"
                    className="h-full w-full border-0 bg-[#0b0c0f]"
                  />
                ) : (
                  <pre
                    className={cn(
                      "h-full w-full overflow-auto p-4 font-mono text-[12.5px] leading-relaxed",
                      isError ? "text-red-300" : "text-white/75"
                    )}
                  >
                    {running ? "Running…" : (output ?? "(no output)")}
                  </pre>
                )
              ) : (
                <div className="grid h-full place-items-center p-6">
                  <div className="text-center">
                    <span className="mx-auto grid size-11 place-items-center rounded-xl bg-white/[0.06] text-white/35">
                      <Terminal className="size-5" />
                    </span>
                    <p className="mt-3 text-[12.5px] text-white/45">Output appears here.</p>
                    <p className="mono-label mt-1.5 !text-[8.5px] !text-white/20">
                      Ctrl + Enter to run
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden shrink-0 items-center justify-between border-t border-white/10 px-3 py-1.5 sm:flex">
              <span className="mono-label !text-[8px] !text-white/20">
                {language === "react" ? "browser sandbox" : "stdin"}
              </span>
              <span className="mono-label !text-[8px] !text-white/20">
                {language === "react"
                  ? "React 19 · iframe"
                  : `${typeof input === "string" ? input.length : 0} chars`}
              </span>
            </div>
          </section>
        </div>
        )}

        <div className="mt-2 hidden shrink-0 flex-wrap items-center justify-between gap-2 sm:flex">
          <span className="mono-label !text-[9px]">
            {language === "sql"
              ? `SQL lab · ${lineCount} query lines · DBML + data`
              : `${langLabel} · ${lineCount} lines`}
          </span>
          <span className="mono-label !text-[9px]">
            {language === "sql"
              ? "Ctrl + Enter runs the query · schema + data saved locally"
              : "Ctrl + Enter to run · local draft"}
          </span>
        </div>
      </main>

      {pendingNav && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-foreground/25 p-4 backdrop-blur-[2px] sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPendingNav(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-guard-heading"
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-[0_24px_60px_rgba(10,10,11,0.18)]"
          >
            <h2 id="leave-guard-heading" className="text-[15px] font-semibold tracking-[-0.01em]">
              Discard unsaved changes?
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              “{snippetTitle ?? "This snippet"}” has edits you haven&apos;t saved yet. Leaving
              now drops them.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPendingNav(null)}>
                Stay here
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  const target = pendingNav;
                  setPendingNav(null);
                  if ("href" in target) {
                    router.push(target.href);
                  } else {
                    allowBackRef.current = true;
                    // Without the Navigation API the dialog was opened from a
                    // duplicated entry, so step over both copies.
                    if ((window as unknown as { navigation?: unknown }).navigation) {
                      window.history.back();
                    } else {
                      window.history.go(-2);
                    }
                    // Re-arm if the traversal never happens
                    window.setTimeout(() => {
                      allowBackRef.current = false;
                    }, 1500);
                  }
                }}
              >
                Discard and leave
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
