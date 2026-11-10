import { CODE_LEVEL_1_TO_3 } from "./code-1";
import { CODE_LEVEL_4_TO_6 } from "./code-2";
import { CODE_LEVEL_7_TO_10 } from "./code-3";
import { SQL_PROBLEMS } from "./sql";
import type { CodeProblem, Problem, SqlProblem, TrackId } from "./types";

export * from "./types";
export { JS_ANSWERS, answerFor } from "./answers";
export { PY_ANSWERS } from "./answers-py";
export { JAVA_ANSWERS } from "./answers-java";
export { CPP_ANSWERS } from "./answers-cpp";
export { CSHARP_ANSWERS } from "./answers-csharp";
export { GO_ANSWERS } from "./answers-go";
export { RUST_ANSWERS } from "./answers-rust";
export { KOTLIN_ANSWERS } from "./answers-kotlin";
export {
  PRACTICE_LANGUAGES,
  stubFor,
  fileFor,
  labelFor,
  aceMode,
  isPracticeLanguage,
  parseArgs,
  parseParams,
  programFor,
  describeSignature,
} from "@/lib/code-run";
export { SQL_TABLES, SQL_REFS, sqlSchemaSummary } from "./sql-data";

const byLevelKindTitle = (a: Problem, b: Problem) =>
  a.level - b.level ||
  Number(a.kind === "sql") - Number(b.kind === "sql") ||
  a.title.localeCompare(b.title);

export const CODE_PROBLEMS: CodeProblem[] = [
  ...CODE_LEVEL_1_TO_3,
  ...CODE_LEVEL_4_TO_6,
  ...CODE_LEVEL_7_TO_10,
].sort(byLevelKindTitle);

export const SQL_SET: SqlProblem[] = [...SQL_PROBLEMS].sort(
  (a, b) => a.level - b.level || a.title.localeCompare(b.title)
);

/** Everything, easiest first — the practice library and the timed test share this. */
export const PROBLEMS: Problem[] = [...CODE_PROBLEMS, ...SQL_SET].sort(byLevelKindTitle);

export const PROBLEM_BY_ID = new Map(PROBLEMS.map((problem) => [problem.id, problem]));

export function getProblem(id: string | undefined | null): Problem | undefined {
  return id ? PROBLEM_BY_ID.get(id) : undefined;
}

export function trackOf(problem: Problem): TrackId {
  return problem.kind === "sql" ? "sql" : trackForTopics(problem.topics);
}

const TOPIC_TRACKS: { track: TrackId; match: RegExp }[] = [
  { track: "recursion", match: /recursion|dynamic programming|trees|JSON/i },
  { track: "algorithms", match: /binary search|sorting|greedy|math|primes|bit manipulation|intervals|overflow|voting/i },
  { track: "strings", match: /strings|splitting|window/i },
  { track: "collections", match: /hashmap|set|objects|comparison/i },
  { track: "arrays", match: /arrays|two pointers|matrix|simulation|stack/i },
];

function trackForTopics(topics: string[]): TrackId {
  const joined = topics.join(" ");
  for (const entry of TOPIC_TRACKS) {
    if (entry.match.test(joined)) return entry.track;
  }
  return "foundations";
}

export function problemsInBand(min: number, max: number): Problem[] {
  return PROBLEMS.filter((problem) => problem.level >= min && problem.level <= max);
}

export function nextProblem(id: string): Problem | undefined {
  const index = PROBLEMS.findIndex((problem) => problem.id === id);
  if (index === -1) return undefined;
  return PROBLEMS[(index + 1) % PROBLEMS.length];
}

/** Deterministic shuffle so a timed test is reproducible per seed. */
export function shuffled<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let state = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) % 2147483648;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const TOTAL_SQL_PROBLEMS = SQL_SET.length;
