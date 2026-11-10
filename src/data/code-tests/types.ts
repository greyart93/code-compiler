// Shared shape for the practice library and the timed test.
//
// Every problem is graded by running code against stdin → stdout tests, so the
// same tests work for every language. `level` is the difficulty on a 0–100
// scale (level 1 = 10/100, level 10 = 100/100).

export type Difficulty = "easy" | "medium" | "hard";

export type PracticeLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "c_cpp"
  | "csharp"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "kotlin"
  | "dart"
  | "swift"
  | "lua";

/**
 * Practice problems are LeetCode-shaped: the learner writes one function and
 * returns a value. The runner supplies the arguments and prints the result, so
 * nobody has to touch stdin or file handles.
 *
 * `params` is a compact spec: "nums:ints", "a:ints,b:ints", "text:string".
 */
export type ParamType = "int" | "ints" | "string" | "words" | "lines" | "matrix";
export type ReturnType = "int" | "bool" | "string" | "ints" | "words" | "lines" | "matrix" | "float1";

export type TestCase = {
  /** stdin for one run */
  input: string;
  /** trimmed stdout that counts as a pass */
  expected: string;
  label: string;
};

type BaseProblem = {
  id: string;
  title: string;
  /** 1 (first hour of code) … 10 (interview-hard) — shown as level × 10 */
  level: number;
  blurb: string;
  /** short prose brief; **bold** and `code` render */
  statement: string;
  topics: string[];
  /** progressive nudges, easiest first */
  hints: string[];
  /** one-line TODO that generated starters end with */
  task: string;
};

export type CodeProblem = BaseProblem & {
  /** omitted in the data files for brevity */
  kind?: "code";
  /** name of the function the learner writes */
  fn: string;
  /** argument spec, e.g. "nums:ints" or "a:ints,b:ints" */
  params: string;
  /** what the function returns, which decides how the runner prints it */
  returns: ReturnType;
  tests: TestCase[];
  /** worked answer per language; JS is the fallback */
  solution?: Partial<Record<PracticeLanguage, string>>;
};

export type SqlProblem = BaseProblem & {
  kind: "sql";
  /** reference query — the learner's result is compared with this one */
  solution: string;
  /** false when the question asks for a set and row order should not matter */
  ordered?: boolean;
};

export type Problem = CodeProblem | SqlProblem;

export type TrackId =
  | "foundations"
  | "arrays"
  | "strings"
  | "collections"
  | "recursion"
  | "algorithms"
  | "sql";

export const TRACKS: { id: TrackId; label: string; blurb: string }[] = [
  { id: "foundations", label: "Foundations", blurb: "Input, output, numbers, loops" },
  { id: "arrays", label: "Arrays", blurb: "Scan, filter, move, merge" },
  { id: "strings", label: "Strings", blurb: "Count, compare, parse" },
  { id: "collections", label: "Maps & sets", blurb: "Counters, lookups, dedupe" },
  { id: "recursion", label: "Recursion", blurb: "Trees, sequences, divide" },
  { id: "algorithms", label: "Algorithms", blurb: "Sorting, searching, DP" },
  { id: "sql", label: "SQL", blurb: "Postgres on real tables" },
];

export const LEVEL_BANDS = [
  { id: "starter", label: "10–20", min: 1, max: 2, hint: "Start here" },
  { id: "beginner", label: "30–40", min: 3, max: 4, hint: "First week" },
  { id: "intermediate", label: "50–60", min: 5, max: 6, hint: "Getting real" },
  { id: "advanced", label: "70–80", min: 7, max: 8, hint: "Interview shape" },
  { id: "expert", label: "90–100", min: 9, max: 10, hint: "Deep end" },
] as const;

export type LevelBandId = (typeof LEVEL_BANDS)[number]["id"];

export function difficultyFor(level: number): Difficulty {
  if (level <= 4) return "easy";
  if (level <= 7) return "medium";
  return "hard";
}

export function levelScore(level: number): number {
  return Math.round(level * 10);
}
