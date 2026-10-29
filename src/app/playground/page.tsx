"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
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
import { cn } from "@/lib/utils";

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
    if (!snippetId || loadedSnippetRef.current === snippetId) return;
    loadedSnippetRef.current = snippetId;
    const fallbackToStarter = () => {
      if (!useCodeStore.getState().code) {
        updateCode(codeSnippets[useCodeStore.getState().language as keyof typeof codeSnippets] ?? "");
      }
    };
    (async () => {
      try {
        const res = await fetch(`/api/snippets?id=${snippetId}`);
        if (!res.ok) {
          toast("Snippet not found", {
            description: "It may be private or deleted.",
            variant: "error",
          });
          fallbackToStarter();
          return;
        }
        const s = (await res.json())?.snippet;
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
      } catch {
        toast("Could not load snippet", { variant: "error" });
        fallbackToStarter();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <SnippetActions language={language} code={code ?? ""} />
            <SaveButton />
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
    </div>
  );
}
