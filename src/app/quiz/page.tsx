"use client";

import { motion } from "motion/react";
import { BrainCircuit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { QUIZZES } from "@/data/quiz";

export default function QuizIndex() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <BrainCircuit className="size-7 text-primary" /> Quiz
          </h1>
          <p className="text-sm text-muted-foreground">
            Test yourself — tricky outputs, quirks and patterns for every language. The JavaScript
            questions come straight from CodeVit's own notes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUIZZES.map((q, i) => (
            <motion.div
              key={q.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <a href={`/quiz/${q.slug}`} className="group block h-full">
                <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40">
                  <CardContent className="flex h-full flex-col py-5">
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className={`flex size-10 items-center justify-center rounded-lg font-mono text-sm font-bold ${q.accent}`}
                      >
                        {q.icon}
                      </span>
                      <h2 className="font-semibold">{q.title}</h2>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {q.questions.length} Qs
                      </span>
                    </div>
                    <p className="mb-4 flex-1 text-sm text-muted-foreground">{q.description}</p>
                    <span className="text-xs font-medium text-primary">Start quiz →</span>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
