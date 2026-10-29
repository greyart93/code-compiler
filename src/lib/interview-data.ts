import "server-only";

/** A question: static seed question + per-question scoring guidance. */
export type BankQuestion = {
  q: string;
  /** what a good answer covers — used for fallback scoring */
  keywords: string[];
};

/** The behavior script for one interview kind/topic. */
export type InterviewScript = {
  /** arranges questions + wraps each question in IRIS's voice */
  intro: string;
  outro: string;
  /** evaluation system prompt for this kind */
  evalSystem: string;
};

export const TECH_TOPICS: Record<string, string> = {
  javascript: "JavaScript",
  react: "React",
  nextjs: "Next.js",
  sql: "SQL & relational databases",
  mongodb: "MongoDB",
  prisma: "Prisma & ORMs",
  english: "General full-stack development",
};

// ─────────────────────────── question banks ───────────────────────────
const BANKS: Record<string, BankQuestion[]> = {
  javascript: [
    {
      q: "Walk me through hoisting: what does the engine actually move at parse time?",
      keywords: ["function declarations", "var undefined", "let tdz", "temporal dead zone", "scope"],
    },
    {
      q: "When does == lie to you? Give a real example you'd avoid in code review.",
      keywords: ["coercion", "0 == false", "null == undefined", "string number", "=== strict"],
    },
    {
      q: "Explain closures with one concrete use — debounce, private counter, something you've written.",
      keywords: ["lexical scope", "outer function", "retains", "state", "counter", "debounce", "callback"],
    },
    {
      q: "A Promise chain: what's the difference between .then() .catch() .finally(), and when does an error skip steps?",
      keywords: ["propagates", "first catch", "unhandled", "settled", "skip", "chain"],
    },
    {
      q: "What does event loop mean for setTimeout(0) vs a microtask like Promise.then? Which wins?",
      keywords: ["microtask", "macrotask", "priority", "call stack", "queue", "tick"],
    },
    {
      q: "In one breath: how would you deep-compare two objects in JavaScript without a library?",
      keywords: ["recursion", "keys", "object.is", "nan", "array", "edge case"],
    },
  ],
  react: [
    {
      q: "What actually triggers a re-render? Walk me through it from setState to pixels.",
      keywords: ["state change", "schedule", "fiber", "reconcile", "diff", "commit", "dom"],
    },
    {
      q: "useState lazy initializer vs inline initial value — when does it matter?",
      keywords: ["expensive", "only first render", "function", "localStorage", "performance"],
    },
    {
      q: "The key prop: why does an index key hurt a list that can reorder?",
      keywords: ["identity", "reuse component", "state loss", "diff", "stable", "unmount"],
    },
    {
      q: "useEffect cleanup — what must go in it, and what breaks if you forget?",
      keywords: ["subscribing", "abort", "clearinterval", "memory leak", "stale callback", "unmount"],
    },
    {
      q: "Why would you reach for useMemo? What's the cost of memo-ing everything?",
      keywords: ["expensive computation", "referential equality", "cache", "memory", "overhead", "profile"],
    },
    {
      q: "Explain the problem Context solves — and one case where you'd NOT use it.",
      keywords: ["prop drilling", "global", "re-render consumers", "deep tree", "frequent updates"],
    },
  ],
  nextjs: [
    {
      q: "App Router: what is the difference between a Server Component and a Client Component, and where does the 'use client' boundary go?",
      keywords: ["server", "client", "use client", "boundary", "state", "as far down the tree"],
    },
    {
      q: "Layout vs template — what ships, what remounts, what persists across navigation?",
      keywords: ["layout persists", "template remount", "state", "only children"],
    },
    {
      q: "How does streaming (Suspense + loading.tsx) change how fast a page feels?",
      keywords: ["progressive", "skeleton", "streams html", "first paint", "parallel", "suspense"],
    },
    {
      q: "Middleware runs before a route — give a real job you'd give it.",
      keywords: ["auth", "redirect", "rewrite", "edge", "before", "cookie"],
    },
    {
      q: "Revalidation: I updated a blog post, but the page still shows stale data. How do you debug that?",
      keywords: ["revalidate", "revalidateTag", "cache", "fetch cache", "router cache", "tags"],
    },
    {
      q: "Server Actions vs a classic /api route — what's the trade-off you actually weigh?",
      keywords: ["no endpoint", "direct call", "form action", "rpc", "third party", "webhook", "versioned"],
    },
  ],
  sql: [
    {
      q: "You query a view and it's slow. Walk me through how EXPLAIN ANALYZE changes your next move.",
      keywords: ["scan type", "seq scan", "index", "rows examined", "cost", "estimate"],
    },
    {
      q: "INNER, LEFT and RIGHT joins — demonstrate the mental model with a line that returns users who never ordered.",
      keywords: ["anti join", "is null", "left join", "matched", "unmatched"],
    },
    {
      q: "WHERE vs HAVING — when does the filter apply, and what can you not use WHERE on?",
      keywords: ["rows", "groups", "after aggregation", "aggregate", "alias"],
    },
    {
      q: "Why does a compound index (A,B,C) work for a query on just A, but not on just C?",
      keywords: ["leftmost prefix", "b-tree", "sorted", "leading column", "prefix"],
    },
    {
      q: "You have a table exploding with reads. What normal form rules would you bend, and why is it OK?",
      keywords: ["denormalize", "third normal form", "performance", "read path", "trade off", "cache"],
    },
    {
      q: "Explain a situation where SERIALIZABLE is worth the performance hit.",
      keywords: ["race condition", "double spend", "consistency", "concurrent", "anomaly", "phantom"],
    },
  ],
  mongodb: [
    {
      q: "Embed vs reference — walk me through how you'd decide for blog post comments.",
      keywords: ["read together", "grow unbounded", "16mb", "populate", "second query", "lookup"],
    },
    {
      q: "$lookup vs populate — what does each one actually do under the hood?",
      keywords: ["aggregation stage", "join", "mongoose", "client side", "populate"],
    },
    {
      q: "Aggregation pipeline: average order value per city. Which stages, in what order?",
      keywords: ["group", "avg", "match first", "index", "sort", "pipeline"],
    },
    {
      q: "What does a COLLSCAN in explain tell you, and which two fixes are on the table first?",
      keywords: ["index", "query shape", "equality", "covering", "compound"],
    },
    {
      q: "Explain ESR (equality, sort, range) when designing a compound index.",
      keywords: ["equality first", "sort next", "range last", "in-memory sort", "prefix"],
    },
    {
      q: "A unique index threw code 11000 in production. How do you make that a good UX, not a 500?",
      keywords: ["catch", "duplicate key", "upsert", "user friendly", "conflict", "11000"],
    },
  ],
  prisma: [
    {
      q: "What does `prisma generate` actually output, and why is it different from a hand-rolled query builder?",
      keywords: ["types", "schema", "dmmf", "type-safe", "client", "autocomplete"],
    },
    {
      q: "select vs include — pick one for 'emails only' and defend it.",
      keywords: ["include relations", "select raw columns", "payload", "bandwidth", "typed"],
    },
    {
      q: "You need to move money between two accounts. Show me the Prisma pattern that guarantees atomicity.",
      keywords: ["$transaction", "callback", "interactive", "rollback", "throw", "decrement"],
    },
    {
      q: "P2025 — what does it mean, and when would you choose deleteMany over delete to avoid it?",
      keywords: ["record not found", "deleteMany", "no throw", "0 rows", "idempotent"],
    },
    {
      q: "Serverless + Prisma: cold starts and connection caps. What's the fix?",
      keywords: ["singleton", "one client", "connection pool", "module scope", "pooler", "serverless"],
    },
    {
      q: "Compare implicit vs explicit many-to-many in Prisma — when do you need the explicit join table?",
      keywords: ["implicit", "_PostToTag", "extra fields", "join table", "columns in the join", "migration"],
    },
  ],
  english: [],
};

export const ENGLISH_QUESTIONS: BankQuestion[] = [
  { q: "Let's start light — tell me about yourself, the same way you would in a real interview.", keywords: ["intro", "background", "confidence"] },
  { q: "Why do you want this role, and what made you apply to a company like ours?", keywords: ["motivation", "research", "fit"] },
  { q: "Walk me through a project you're proud of — what did you build, and what was your part?", keywords: ["project", "impact", "your role"] },
  { q: "Tell me about a mistake you made and what it taught you.", keywords: ["honesty", "growth", "specific"] },
  { q: "What are your salary expectations, and how did you arrive at that number?", keywords: ["research", "range", "reasoning", "flexibility"] },
  { q: "Where do you see yourself in three years?", keywords: ["ambition", "realistic", "direction"] },
  { q: "What is your biggest strength — and give me proof, not an adjective.", keywords: ["strength", "example", "evidence"] },
  { q: "And the other side: what's a weakness you've actually improved on?", keywords: ["self-aware", "improved", "specific"] },
  { q: "Why should we pick you over the other two candidates?", keywords: ["differentiator", "fit", "evidence"] },
  { q: "Do you have any questions for us about the team, the work, or the next steps?", keywords: ["curiosity", "prepared", "asks questions"] },
];

// ─────────────────────────── scripted prompts ───────────────────────────

export type InterviewKind = "tech" | "english";

export const TECH_INTRO =
  "Nice to meet you — I'm {Q} — I'm IRIS, your interviewer for this session. Before we dive in, take a breath and answer as you would on a call: say what you know, mention the edge cases, and think out loud. Ready? I'll open with the first question.";

export const TECH_OUTRO =
  "And that brings us to the end. Before we finish: anything you want to highlight about how you like to work, or any question you have for *me* if this were a real interview? A short 'nice to meet you, thanks!' also works.";

export const ENGLISH_INTRO =
  "Hi — IRIS here. This is a mock **English-speaking interview**: the same open-ended questions you'd face in a real conversation — tell me about yourself, your expectations, your questions for me. Speak naturally, don't over-script yourself. When you're ready, answer the first question.";

export const ENGLISH_OUTRO =
  "That's the end of the session — you did fine. Before we wrap: any questions you'd like to ask if this were the real interview?";

/** If the real model is configured, ask it to choose a follow-up. Otherwise the client takes the static bank. */
export function bankForKind(topic: string): BankQuestion[] {
  if (topic === "english") return ENGLISH_QUESTIONS;
  return BANKS[topic] ?? BANKS.english;
}

export function evalSystemPrompt(kind: InterviewKind): string {
  const common =
    "You are IRIS, a warm but demanding interviewer. Grade the answer on a 0–10 scale and reply with a useful suggestion in 1–2 sentences.\n" +
    "IMPORTANT: the answer was spoken aloud and captured by speech-to-text, so small transcription errors are expected\n" +
    "(e.g. 'closer' for closure, 'a sync' for async, 'jopper'/'i call' for hoisting, 'jason' for JSON, 'v arrest' for var).\n" +
    "Interpret charitably: if a phrase plausibly refers to the concept being discussed, treat it as that concept (e.g. 'var' may\n" +
    "be transcribed as 'vault', 'butt', 'bar' etc.). Only grade the concepts, not spelling or wording.";

  if (kind === "english") {
    return (
      common +
      " This is an open-ended English-speaking / fit interview (tell me about yourself, expectations, motivation). " +
      "Judge clarity, confidence, structure and relevance — not vocabulary memorization. Be specific about how it would land with a hiring manager."
    );
  }

  return (
    common +
    " This is a **technical** interview. Correctness of the technical claim matters most, then depth (did the candidate show they understand the mechanism), then communication. " +
    "Reward precision, push on vague answers, and notice when the candidate invokes a real trade-off."
  );
}

/** Fallback heuristic scorer (when no AI provider) — keyword-overlap based. */
export function fallbackScore(answer: string, q: BankQuestion): { score: number; feedback: string } {
  const a = answer.toLowerCase();
  const hits = q.keywords.filter((k) => a.includes(k.toLowerCase())).length;
  const score = Math.min(10, Math.round((hits / Math.max(3, q.keywords.length)) * 10));
  const verdict =
    hits === 0
      ? " Doesn't touch the concepts this answer needs yet — revisit the topic."
      : hits < q.keywords.length / 2
        ? " Partially right — you named some of the moving pieces; push into the *why*."
        : " Good — you hit the core ideas; adding a personal example would make it land better.";
  return { score, feedback: `IRIS offline heuristic${verdict}` };
}
