import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { aiConfigured, chatJSON, chat } from "@/lib/ai";
import {
  bankForKind,
  evalSystemPrompt,
  fallbackScore,
  type BankQuestion,
} from "@/lib/interview-data";
import { recordActivity } from "@/lib/streak";

type EvalBody = {
  question: string;
  answer: string;
  kind: "tech" | "english";
  keywords?: string[];
};

const clamp = (n: number) => Math.max(0, Math.min(10, n));

// GET /api/interview/questions?topic=react → the round's question list
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic") ?? "javascript";
  const bank = bankForKind(topic);

  // shuffle and take 6
  const picked = [...bank].sort(() => Math.random() - 0.5).slice(0, 6);

  return NextResponse.json({ questions: picked.map((q: BankQuestion) => ({ q: q.q, keywords: q.keywords })) });
}

// POST /api/interview/evaluate  { question, answer, kind, keywords? } → { score, feedback }
export async function POST(request: Request) {
  const { question, answer, kind, keywords } = (await request.json()) as EvalBody;

  if (!question || !answer) {
    return NextResponse.json({ error: "question and answer are required" }, { status: 400 });
  }
  if (kind !== "tech" && kind !== "english") {
    return NextResponse.json({ error: "kind must be tech or english" }, { status: 400 });
  }

  // no AI provider → deterministic heuristic so interviews still work
  if (!aiConfigured()) {
    const hit = fallbackScore(answer, { q: question, keywords: keywords ?? [] });
    return NextResponse.json({ ...hit, simulated: true });
  }

  try {
    const result = await chatJSON<{ score: number; feedback: string }>([
      { role: "system", content: evalSystemPrompt(kind) },
      {
        role: "user",
        content: [
          `QUESTION: ${question}`,
          ...(keywords?.length ? [`GOOD ANSWER COVERS: ${keywords.join(", ")}`] : []),
          `CANDIDATE ANSWER: ${answer}`,
          "",
          "Reply ONLY as JSON: {\"score\": <0-10>, \"feedback\": \"...\"}",
        ].join("\n"),
      },
    ]);

    return NextResponse.json({
      score: clamp(Number(result.score)),
      feedback: String(result.feedback ?? "").slice(0, 500),
      simulated: false,
    });
  } catch (err) {
    // provider hiccup → heuristic grade so the interview keeps going
    console.error("interview evaluate error:", err);
    const hit = fallbackScore(answer, { q: question, keywords: keywords ?? [] });
    return NextResponse.json({ ...hit, simulated: true });
  }
}

// PUT /api/interview/summary  { kind, topic, questions: [...] } → save session
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kind, topic, questions } = await request.json();
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "questions are required" }, { status: 400 });
  }

  const scores = questions
    .map((q: { eval?: { score?: number } }) => q.eval?.score)
    .filter((s: unknown): s is number => typeof s === "number");
  const score = scores.length ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) : null;

  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      kind: kind === "english" ? "english" : "tech",
      topic: String(topic ?? "general"),
      questions,
      score,
    },
  });

  // interviews count toward the streak
  await recordActivity(user.id, "interview");

  return NextResponse.json({ session });
}
