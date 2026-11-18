import { getProblem, type CodeProblem, type PracticeLanguage } from "@/data/code-tests";

/**
 * The technical interview's coding round.
 *
 * A spoken interview can't tell whether a candidate can actually write the
 * code, so the technical round ends with one real problem from the practice
 * library: embedded editor, the problem's own tests as the judge, and a score
 * that lands in the same session average as the spoken answers.
 */

/** Which practice problem each spoken topic finishes with. */
const CODING_ROUND_BY_TOPIC: Record<string, string> = {
  javascript: "two-sum",
  react: "best-time-stock",
  nextjs: "group-anagrams",
  sql: "freq-count",
  mongodb: "key-value-zip",
  prisma: "rotate-k",
};

const FALLBACK_PROBLEM = "two-sum";

/** The coding problem for this kind/topic, or null for English interviews. */
export function codingProblemFor(kind: string, topic: string): CodeProblem | null {
  if (kind === "english" || topic === "english") return null;

  const problem = getProblem(CODING_ROUND_BY_TOPIC[topic] ?? FALLBACK_PROBLEM);
  if (!problem || problem.kind === "sql") return null;
  return problem;
}

export type CodeTestResult = {
  label: string;
  pass: boolean;
  got: string;
  want: string;
};

/** Code the interview carries for its coding question. Stored with the session. */
export type CodeRound = {
  problemId: string;
  language: PracticeLanguage;
  source: string;
  results?: CodeTestResult[];
};

const short = (value: string, max = 40) => {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return "(nothing)";
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

/**
 * Turn a test run into the same `{ score, feedback }` shape spoken answers use,
 * so the coding question joins the session average without special cases.
 * Deterministic on purpose: the tests are the judge, and a passing run is 10.
 */
export function codeEval(results: CodeTestResult[]): {
  score: number;
  feedback: string;
  simulated: boolean;
} {
  const total = results.length;
  const passed = results.filter((result) => result.pass).length;

  if (!total) {
    return {
      score: 0,
      feedback: "No tests ran — run the tests before submitting.",
      simulated: false,
    };
  }

  const score = Math.max(0, Math.min(10, Math.round((passed / total) * 10)));

  if (passed === total) {
    return {
      score: 10,
      feedback: `All ${total} tests passed with a working solution.`,
      simulated: false,
    };
  }

  const failing = results
    .filter((result) => !result.pass)
    .slice(0, 2)
    .map((result) => `${result.label} (got ${short(result.got)}, want ${short(result.want)})`)
    .join("; ");

  return {
    score,
    feedback:
      passed === 0
        ? `No tests passed yet: ${failing}.`
        : `${passed}/${total} tests passed. Still failing: ${failing}.`,
    simulated: false,
  };
}
