"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Eye,
  HelpCircle,
  Lightbulb,
  Loader2,
  PenLine,
  Play,
  RotateCcw,
  Sparkles,
  Swords,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Exercise } from "@/data/courses";
import { useRunShortcut } from "@/lib/use-run-shortcut";

const normalize = (s: string) =>
  s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .trim();

/** free-text grading: trim, collapse inner spaces, ignore case and wrapping quotes */
const normalizeAnswer = (s: string) =>
  s
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

type RunState = {
  running: boolean;
  result: "pass" | "fail" | null;
  message: string | null;
};

async function runCode(code: string, language: string, input: string) {
  const res = await fetch("/api/runCode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language, input }),
  });
  const data = await res.json();
  const stdout: string = data?.data?.stdout ?? "";
  const stderr: string = data?.data?.stderr ?? "";
  if (stderr) throw new Error(stderr);
  return stdout;
}

function isExerciseLanguage(language: string): boolean {
  return language !== "assembly";
}

// ─── shared "correct / not quite" banner ──────────────────────────────────

function Verdict({
  tone,
  children,
}: {
  tone: "pass" | "fail";
  children: React.ReactNode;
}) {
  return (
    <p
      className={`mt-4 flex items-start gap-1.5 text-sm font-medium ${
        tone === "pass" ? "text-green-500" : "text-red-500"
      }`}
    >
      {tone === "pass" ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{children}</span>
    </p>
  );
}

// ─── answer box ─────────────────────────────────────────────────────────────

/**
 * A single-line answer gets a plain input; a multi-line one gets a textarea,
 * because `<input>` silently swallows the newlines in "0\n1\n2" and the learner
 * can never get it right.
 */
function AnswerBox({
  id,
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  checked,
  right,
  multiline,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  checked: boolean;
  right: boolean;
  /** the expected answer spans several lines */
  multiline?: boolean;
}) {
  const shared = {
    id,
    value,
    disabled,
    spellCheck: false,
    autoComplete: "off",
    placeholder,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    },
  };
  const tone = right
    ? "border-green-500/60"
    : checked
      ? "border-red-500/60"
      : "";

  if (multiline) {
    return (
      <Textarea
        {...shared}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-[70px] resize-y font-mono text-[13px] ${tone}`}
      />
    );
  }
  return (
    <Input
      {...shared}
      onChange={(e) => onChange(e.target.value)}
      className={`font-mono text-[13px] ${tone}`}
    />
  );
}

// ─── fill in the blanks (Sololearn style) ───────────────────────────────────

function FillBlankExercise({
  exercise,
  solved,
  onSolved,
}: {
  exercise: Extract<Exercise, { type: "fill-blank" }>;
  solved: boolean;
  onSolved: () => void;
}) {
  // a restored solution starts with the right answers already in place
  const [picked, setPicked] = useState<(string | null)[]>(() =>
    exercise.blanks.map((b) => (solved ? b.answer : null))
  );
  const [checked, setChecked] = useState(solved);

  const allFilled = picked.every((p) => p !== null);
  const correct = exercise.blanks.every((b, i) => picked[i] === b.answer);
  const justSolved = checked && correct && solved;

  const parts = useMemo(() => exercise.template.split("___"), [exercise.template]);

  return (
    <Card className="border-primary/25 bg-primary/[0.03]">
      <CardContent className="py-5">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <PenLine className="size-4 text-primary" /> Fill in the blanks
        </p>
        <p className="mb-4 text-sm text-muted-foreground">{exercise.prompt}</p>

        {/* code with slots — option chips per blank, Sololearn-style */}
        <div className="overflow-x-auto rounded-lg bg-[#1c1f26] px-4 py-4 font-mono text-[13px] leading-7 text-[#adbac7]">
          {parts.map((part, i) => (
            <span key={i}>
              <span className="whitespace-pre-wrap">{part}</span>
              {i < exercise.blanks.length &&
                (picked[i] ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (solved) return;
                      setPicked((p) => p.map((v, j) => (j === i ? null : v)));
                      setChecked(false);
                    }}
                    className={`mx-1 rounded px-2 py-0.5 text-[13px] transition-colors ${
                      solved
                        ? "bg-green-500/20 text-green-400"
                        : checked
                          ? "bg-red-500/20 text-red-400"
                          : "bg-primary/20 text-primary hover:bg-primary/30"
                    }`}
                  >
                    {picked[i]}
                  </button>
                ) : (
                  <span
                    className="mx-1 inline-block w-12 rounded border-b-2 border-primary/60 bg-primary/10 align-middle"
                    style={{ height: "1.4em" }}
                  />
                ))}
            </span>
          ))}
        </div>

        {!solved && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {exercise.blanks.map((b, bi) => (
              <span key={bi} className="flex flex-wrap items-center gap-2">
                {b.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={picked[bi] !== null}
                    onClick={() => {
                      setPicked((p) => p.map((v, j) => (j === bi ? opt : v)));
                      setChecked(false);
                    }}
                    className={`rounded-lg border px-3 py-1.5 font-mono text-[13px] transition-colors ${
                      picked[bi] === opt
                        ? "border-primary bg-primary/15 text-primary"
                        : picked[bi] !== null
                          ? "border-border opacity-40"
                          : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                {bi < exercise.blanks.length - 1 && (
                  <span className="mx-1 text-xs text-muted-foreground">·</span>
                )}
              </span>
            ))}
          </div>
        )}

        {justSolved ? (
          <div className="mt-4 space-y-1">
            <Verdict tone="pass">Correct!</Verdict>
            {exercise.explanation && (
              <p className="text-sm text-muted-foreground">{exercise.explanation}</p>
            )}
          </div>
        ) : checked && !solved ? (
          <Verdict tone="fail">Not quite — try again.</Verdict>
        ) : null}

        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            disabled={!allFilled || solved}
            onClick={() => {
              setChecked(true);
              if (correct) onSolved();
            }}
          >
            Check
          </Button>
          {checked && !solved && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPicked(exercise.blanks.map(() => null));
                setChecked(false);
              }}
            >
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── predict the output / play with code ────────────────────────────────────

function OutputExercise({
  exercise,
  language,
  solved,
  onSolved,
}: {
  exercise: Extract<Exercise, { type: "output" }>;
  language: string;
  solved: boolean;
  onSolved: () => void;
}) {
  const [code, setCode] = useState(exercise.starterCode);
  // restored solutions show the expected output rather than an empty box
  const [answer, setAnswer] = useState(() =>
    solved ? exercise.expectedOutput : ""
  );
  const [answerChecked, setAnswerChecked] = useState(solved);
  const [state, setState] = useState<RunState>({
    running: false,
    result: null,
    message: null,
  });
  const [showHint, setShowHint] = useState(false);

  const canRun = isExerciseLanguage(language);
  // a multi-line expectation needs a real textarea, not an <input>
  const multiline = exercise.expectedOutput.includes("\n");

  // typing your own answer is enough — you don't have to run the code
  const justSolved = solved && answerChecked;

  const checkAnswer = () => {
    if (!answer.trim()) return;
    setAnswerChecked(true);
    if (normalize(answer) === normalize(exercise.expectedOutput)) onSolved();
  };

  const handleRun = async () => {
    if (!canRun || state.running) return;
    setState({ running: true, result: null, message: null });
    try {
      const stdout = await runCode(code, language, "");
      const pass = normalize(stdout) === normalize(exercise.expectedOutput);
      // running it and matching counts too, but the typed answer is the point
      setAnswer(stdout);
      setAnswerChecked(true);
      if (pass) onSolved();
      setState({
        running: false,
        result: pass ? "pass" : "fail",
        message: pass ? stdout : null,
      });
    } catch (e) {
      setState({
        running: false,
        result: "fail",
        message: e instanceof Error ? e.message : "Run failed",
      });
    }
  };

  // ⌘/Ctrl + Enter runs the code
  useRunShortcut(() => void handleRun());

  return (
    <Card className="border-primary/25 bg-primary/[0.03]">
      <CardContent className="py-5">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Eye className="size-4 text-primary" /> Find the output
        </p>
        <p className="mb-3 text-sm text-muted-foreground">{exercise.prompt}</p>

        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="min-h-[110px] resize-y bg-[#1c1f26] font-mono text-[13px] text-[#adbac7]"
        />

        {/* the learner's own answer */}
        <div className="mt-4">
          <label
            htmlFor="output-answer"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {exercise.answerLabel ?? "What does this print?"}
          </label>
          <div className="flex gap-2">
            <AnswerBox
              id="output-answer"
              value={answer}
              onChange={(v) => {
                setAnswer(v);
                setAnswerChecked(false);
              }}
              onSubmit={checkAnswer}
              placeholder={multiline ? "one value per line…" : "type your answer…"}
              disabled={solved}
              checked={answerChecked}
              right={justSolved}
              multiline={multiline}
            />
            <Button
              size="sm"
              onClick={checkAnswer}
              disabled={!answer.trim() || solved}
              className="shrink-0 self-start"
            >
              Check
            </Button>
          </div>
          {multiline && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              One value per line — newlines are compared exactly.
            </p>
          )}
        </div>

        {showHint && exercise.hint && (
          <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-yellow-500" /> {exercise.hint}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={handleRun} disabled={state.running || !canRun} className="gap-1.5">
            {state.running ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5" />
            )}
            Run &amp; check
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCode(exercise.starterCode);
              setAnswer("");
              setAnswerChecked(false);
              setState({ running: false, result: null, message: null });
            }}
          >
            <RotateCcw className="size-3.5" /> Reset
          </Button>
          {exercise.hint && !justSolved && (
            <Button size="sm" variant="ghost" onClick={() => setShowHint((s) => !s)}>
              <Lightbulb className="size-3.5" /> {showHint ? "Hide hint" : "Hint"}
            </Button>
          )}
        </div>

        {justSolved ? (
          <Verdict tone="pass">
            Correct — the code printed{" "}
            <code className="rounded bg-green-500/10 px-1 py-0.5 font-mono text-[12px]">
              {exercise.expectedOutput}
            </code>
            .
          </Verdict>
        ) : answerChecked && !solved ? (
          <Verdict tone="fail">That doesn&apos;t match — try running it to see the output.</Verdict>
        ) : null}

        {state.message !== null && (
          <pre
            className={`mt-3 max-h-40 overflow-auto rounded-lg p-3 font-mono text-[13px] ${
              state.result === "pass"
                ? "bg-green-500/10 text-green-500"
                : "bg-muted/50 text-foreground"
            }`}
          >
            {state.result === "pass" ? `✓ ${state.message}` : state.message}
          </pre>
        )}
        {state.result === "fail" && !state.message && (
          <p className="mt-3 text-sm text-red-500">
            Output didn&apos;t match the expectation — edit the code and try again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── free-text quiz: type a value, get graded ───────────────────────────────

function QuizExercise({
  exercise,
  solved,
  onSolved,
}: {
  exercise: Extract<Exercise, { type: "quiz" }>;
  solved: boolean;
  onSolved: () => void;
}) {
  // a restored solution shows the answer it was graded against
  const [answer, setAnswer] = useState(() => (solved ? exercise.answers[0] : ""));
  const [checked, setChecked] = useState(solved);
  const [showHint, setShowHint] = useState(false);

  const right = checked && solved;

  const check = () => {
    if (!answer.trim()) return;
    setChecked(true);
    const accepted = exercise.answers.some(
      (a) => normalizeAnswer(a) === normalizeAnswer(answer)
    );
    if (accepted) onSolved();
  };

  return (
    <Card className="border-primary/25 bg-primary/[0.03]">
      <CardContent className="py-5">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <HelpCircle className="size-4 text-primary" /> Quick check
        </p>
        <p className="mb-3 text-sm text-muted-foreground">{exercise.prompt}</p>

        {exercise.snippet && (
          <pre className="mb-3 overflow-x-auto rounded-lg bg-[#1c1f26] px-4 py-3 font-mono text-[13px] leading-6 text-[#adbac7]">
            {exercise.snippet}
          </pre>
        )}

        <div className="flex gap-2">
          <AnswerBox
            value={answer}
            onChange={(v) => {
              setAnswer(v);
              setChecked(false);
            }}
            onSubmit={check}
            placeholder={exercise.placeholder ?? "type your answer…"}
            disabled={solved}
            checked={checked}
            right={right}
            multiline={exercise.answers.some((a) => a.includes("\n"))}
          />
          <Button
            size="sm"
            onClick={check}
            disabled={!answer.trim() || solved}
            className="shrink-0 self-start"
          >
            Check
          </Button>
        </div>

        {showHint && exercise.hint && !right && (
          <p className="mt-2.5 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-yellow-500" /> {exercise.hint}
          </p>
        )}

        {right ? (
          <div className="mt-3 space-y-1">
            <Verdict tone="pass">Correct!</Verdict>
            {exercise.explanation && (
              <p className="text-sm text-muted-foreground">{exercise.explanation}</p>
            )}
          </div>
        ) : checked && !solved ? (
          <Verdict tone="fail">Not quite — check the spelling and try again.</Verdict>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          {exercise.hint && !right && (
            <Button size="sm" variant="ghost" onClick={() => setShowHint((s) => !s)}>
              <Lightbulb className="size-3.5" /> {showHint ? "Hide hint" : "Hint"}
            </Button>
          )}
          {checked && !solved && (
            <Button size="sm" variant="outline" onClick={() => {
              setChecked(false);
              setAnswer("");
            }}>
              <RotateCcw className="size-3.5" /> Try again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── LeetCode-style challenge with test cases ───────────────────────────────

function ChallengeExercise({
  exercise,
  language,
  solved,
  onSolved,
}: {
  exercise: Extract<Exercise, { type: "challenge" }>;
  language: string;
  solved: boolean;
  onSolved: () => void;
}) {
  const [code, setCode] = useState(exercise.starterCode);
  const [results, setResults] = useState<
    { label: string; expected: string; actual: string; pass: boolean }[] | null
  >(null);
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const canRun = isExerciseLanguage(language);

  const handleRun = async () => {
    if (!canRun || running) return;
    setRunning(true);
    setResults(null);
    const out: typeof results = [];
    for (const t of exercise.tests) {
      try {
        const actual = await runCode(code, language, t.input ?? "");
        out.push({
          label: t.label ?? t.input ?? "",
          expected: t.expected,
          actual,
          pass: normalize(actual) === normalize(t.expected),
        });
      } catch (e) {
        out.push({
          label: t.label ?? t.input ?? "",
          expected: t.expected,
          actual: e instanceof Error ? e.message : "Run failed",
          pass: false,
        });
      }
    }
    setResults(out);
    if (out.every((r) => r.pass)) onSolved();
    setRunning(false);
  };

  // ⌘/Ctrl + Enter runs all test cases
  useRunShortcut(() => void handleRun());

  return (
    <Card className="border-primary/25 bg-primary/[0.03]">
      <CardContent className="py-5">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Swords className="size-4 text-primary" /> Coding challenge
        </p>

        {/* problem statement (markdown-lite: **bold** + newlines) */}
        <div className="mb-3 whitespace-pre-line text-sm leading-relaxed">
          {exercise.problem.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
            chunk.startsWith("**") && chunk.endsWith("**") ? (
              <strong key={i}>{chunk.slice(2, -2)}</strong>
            ) : (
              <span key={i}>{chunk}</span>
            )
          )}
        </div>

        {/* visible test cases */}
        <div className="mb-3 grid gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Test cases
          </p>
          {exercise.tests.map((t, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5 font-mono text-xs ${
                results
                  ? results[i].pass
                    ? "border-green-500/40 bg-green-500/10"
                    : "border-red-500/40 bg-red-500/10"
                  : "border-border"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {t.label ?? t.input ?? `case ${i + 1}`}
              </span>
              <span className="shrink-0">
                {results ? (
                  results[i].pass ? (
                    <CheckCircle2 className="size-3.5 text-green-500" />
                  ) : (
                    <XCircle className="size-3.5 text-red-500" />
                  )
                ) : (
                  <span className="text-muted-foreground">= {t.expected}</span>
                )}
              </span>
            </div>
          ))}
        </div>

        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="min-h-[130px] resize-y bg-[#1c1f26] font-mono text-[13px] text-[#adbac7]"
        />

        {showHint && exercise.hint && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-yellow-500" /> {exercise.hint}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={handleRun} disabled={running || !canRun} className="gap-1.5">
            {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            {running ? "Running…" : "Run tests"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCode(exercise.starterCode);
              setResults(null);
            }}
          >
            <RotateCcw className="size-3.5" /> Reset
          </Button>
          {exercise.hint && !solved && (
            <Button size="sm" variant="ghost" onClick={() => setShowHint((s) => !s)}>
              <Lightbulb className="size-3.5" /> {showHint ? "Hide hint" : "Hint"}
            </Button>
          )}
        </div>

        {results && (
          <div className="mt-3 grid gap-1.5">
            {results.map((r, i) =>
              r.pass ? null : (
                <div key={i} className="rounded-lg bg-muted/50 p-2.5 font-mono text-xs">
                  <p className="mb-1 font-sans font-medium">{r.label}</p>
                  <p className="text-red-500">expected: {r.expected}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">got: {r.actual}</p>
                </div>
              )
            )}
            {results.every((r) => r.pass) && (
              <Verdict tone="pass">All tests passed — nice!</Verdict>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── one exercise ───────────────────────────────────────────────────────────

export function LessonExercise({
  exercise,
  language,
  solved,
  onSolved,
}: {
  exercise: Exercise;
  language: string;
  /** this exercise is already solved (restored from storage) */
  solved: boolean;
  /** fired when the learner gets it right */
  onSolved: () => void;
}) {
  if (!isExerciseLanguage(language)) {
    return (
      <Card>
        <CardContent className="py-5 text-sm text-muted-foreground">
          Interactive exercises aren&apos;t available for Assembly lessons yet.
        </CardContent>
      </Card>
    );
  }
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-5"
    >
      {exercise.type === "fill-blank" && (
        <FillBlankExercise exercise={exercise} solved={solved} onSolved={onSolved} />
      )}
      {exercise.type === "output" && (
        <OutputExercise
          exercise={exercise}
          language={language}
          solved={solved}
          onSolved={onSolved}
        />
      )}
      {exercise.type === "quiz" && (
        <QuizExercise exercise={exercise} solved={solved} onSolved={onSolved} />
      )}
      {exercise.type === "challenge" && (
        <ChallengeExercise
          exercise={exercise}
          language={language}
          solved={solved}
          onSolved={onSolved}
        />
      )}
    </motion.section>
  );
}

// ─── every exercise on a lesson, with a completion meter ─────────────────────

export function LessonExercises({
  exercises,
  language,
  solved,
  onSolved,
}: {
  exercises: Exercise[];
  language: string;
  /** indices of already-solved exercises */
  solved: Set<number>;
  /** fired with the exercise's index the first time it is solved */
  onSolved: (index: number) => void;
}) {
  const done = exercises.filter((_, i) => solved.has(i)).length;

  if (!exercises.length) return null;

  return (
    <section className="mt-8 border-t pt-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" />
          Check your understanding
        </h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${
            done === exercises.length
              ? "bg-green-500/15 text-green-500"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {done} / {exercises.length} solved
        </span>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        {done === exercises.length
          ? "All done — this lesson counts as complete."
          : "Answer each one to complete this lesson automatically."}
      </p>

      {exercises.map((ex, i) => (
        <LessonExercise
          key={i}
          exercise={ex}
          language={language}
          solved={solved.has(i)}
          onSolved={() => onSolved(i)}
        />
      ))}
    </section>
  );
}