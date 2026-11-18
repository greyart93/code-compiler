import { parseArgs, programFor } from "@/lib/code-run";
import type { CodeProblem, PracticeLanguage } from "@/data/code-tests/types";

/**
 * The single place tests are judged.
 *
 * Practice and the interview's coding round both ask the same question — did
 * the learner's function print what the problem expects? — so they build the
 * program, run it through `/api/runCode` and compare stdout here, once.
 */

export type CodeTestRow = {
  label: string;
  pass: boolean;
  got: string;
  want: string;
};

// /api/runCode forwards the glot mux payload, which nests the run under `data`
type RunResult = { stdout?: string | null; stderr?: string | null; error?: string | null };
type RunResponse = RunResult & { data?: RunResult };

/**
 * Run every stored test against `source` and return one row per test.
 *
 * Throws when the request itself fails (offline, non-JSON body); callers turn
 * that into their own message. A program that fails to build or run is not an
 * exception — it comes back as a failing row carrying the runner's error.
 */
export async function judgeProgram(
  problem: CodeProblem,
  language: PracticeLanguage,
  source: string
): Promise<CodeTestRow[]> {
  const rows: CodeTestRow[] = [];

  for (const testCase of problem.tests) {
    // The learner only wrote a function; the driver supplies the arguments and
    // prints the returned value, so nothing reads stdin.
    const program = programFor(problem, language, source, parseArgs(problem, testCase.input));
    const res = await fetch("/api/runCode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: program, language, input: "" }),
    });
    const payload = (await res.json()) as RunResponse;
    const data = payload.data ?? payload;
    const out = (data.stdout ?? "").trim();

    rows.push({
      label: testCase.label,
      pass: !data.error && out === testCase.expected,
      got: data.error ? String(data.error) : out,
      want: testCase.expected,
    });
  }

  return rows;
}
