"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { Play, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SnippetActions } from "@/components/snippet-actions";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { useCodeStore } from "@/store/code-store";
import { LANGUAGES, FILE_NAME, aceModeFor } from "@/lib/language";
import { useRunShortcut } from "@/lib/use-run-shortcut";
import codeSnippets from "../_editor/code-snippets";
import { toast } from "@/components/ui/toaster";

// 👇 Dark app mode → dark editor themes only; light app mode → light editor themes
const DARK_THEMES = ["monokai", "dracula", "cobalt"];
const LIGHT_THEMES = ["chrome", "dawn", "eclipse"];

// Ace mode names differ from our language keys (go→golang, bash→sh, assembly→assembly_x86…)
const aceMode = (language: string) => aceModeFor(language);

const AceEditor = dynamic(() => import("../_editor/(AceEditor)/page"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const editorThemes = mounted && resolvedTheme === "light" ? LIGHT_THEMES : DARK_THEMES;
  const [aceTheme, setAceTheme] = useState("monokai");

  // 👇 If the app theme flips and the current editor theme isn't allowed, follow along
  useEffect(() => {
    if (!editorThemes.includes(aceTheme)) setAceTheme(editorThemes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, resolvedTheme]);

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
        if (typeof s.language === "string") updateLanguage(s.language);
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
    if (langParam && LANGUAGES.some((l) => l.value === langParam)) {
      updateLanguage(langParam);
    }
    updateCode(codeParam);
    setSnippetTitle(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam, langParam]);

  const [output, setOutput] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [running, setRunning] = useState(false);

  const langMeta = useMemo(
    () => LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[1],
    [language]
  );

  const handleLanguageChange = (value: string) => {
    const snippet = codeSnippets[value as keyof typeof codeSnippets];
    updateLanguage(value);
    if (snippet !== undefined) updateCode(snippet);
  };

  const handleRun = async () => {
    if (running) return; // ⌘/Ctrl+Enter shouldn't stack runs
    setRunning(true);
    setIsError(false);
    setOutput(null);
    try {
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
    } catch {
      setIsError(true);
      setOutput("Failed to reach the run API");
    } finally {
      setRunning(false);
    }
  };

  // ⌘/Ctrl + Enter runs, exactly like every other code editor
  useRunShortcut(() => void handleRun());

  return (
    <div className="min-h-screen">
      <SiteHeader canSave />
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6">
        {/* Top bar: language + editor theme pickers */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-4 flex items-center justify-between gap-2"
        >
          {/* 👈 back to the lesson we came from (?from=/learn/<slug>/<lessonId>) */}
          <div className="min-w-0">
            {fromParam && fromParam.startsWith("/learn/") && (
              <Button variant="ghost" size="sm" asChild className="gap-1.5">
                <Link href={fromParam}>
                  <ArrowLeft className="size-4" /> Back to lesson
                </Link>
              </Button>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[160px]">
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
          <Select value={aceTheme} onValueChange={setAceTheme}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              {editorThemes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </motion.div>

        {/* Editor card with filename + Run */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-1">
                {snippetTitle && (
                  <span
                    className="mr-1 max-w-[220px] truncate rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    title={`Loaded: ${snippetTitle}`}
                  >
                    {snippetTitle}
                  </span>
                )}
                <span className="font-mono text-sm text-muted-foreground">
                  {FILE_NAME[language] ?? "main.txt"}
                </span>
                <SnippetActions language={language} code={code ?? ""} />
              </div>
              <Button size="sm" onClick={handleRun} disabled={running} className="gap-1.5">
                {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                Run
                <kbd className="ml-1 hidden rounded border border-current/30 px-1 py-px font-sans text-[10px] opacity-70 sm:inline">
                  Ctrl ↵
                </kbd>
              </Button>
            </div>
            <AceEditor
              language={aceMode(language)}
              theme={aceTheme}
              defaultCode={codeSnippets[language as keyof typeof codeSnippets] ?? ""}
              scode={code ?? ""}
              onValueChange={updateCode}
              onRun={() => void handleRun()}
            />
          </Card>
        </motion.div>

        {/* Input + Output row */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-4">
              <label className="mb-2 block text-sm text-muted-foreground">Input</label>
              <Textarea
                value={typeof input === "string" ? input : ""}
                onChange={(e) => updateInput(e.target.value)}
                placeholder="stdin for your program (one value per line)"
                className="min-h-[140px] resize-y bg-muted/40 font-mono text-sm"
              />
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Card className="flex h-full flex-col p-4">
              <span className="mb-2 text-sm text-muted-foreground">Output</span>
              <pre
                className={`min-h-[140px] flex-1 overflow-auto rounded-md bg-muted/40 p-3 font-mono text-sm ${
                  isError ? "text-destructive" : ""
                }`}
              >
                {running ? "Running…" : (output ?? "Run your code to see output here")}
              </pre>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
