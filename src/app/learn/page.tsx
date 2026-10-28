"use client";

import { motion } from "motion/react";
import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { COURSES } from "@/data/courses";

export default function LearnIndex() {
  const total = COURSES.reduce((n, c) => n + c.load.length, 0);
  void total;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <GraduationCap className="size-7 text-primary" /> Learn
          </h1>
          <p className="text-sm text-muted-foreground">
            Structured, step-by-step courses for every language in the Playground.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <a href={`/learn/${c.slug}`} className="group block h-full">
                <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40">
                  <CardContent className="flex h-full flex-col py-5">
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className={`flex size-10 items-center justify-center rounded-lg font-mono text-sm font-bold ${c.accent}`}
                      >
                        {c.icon}
                      </span>
                      <h2 className="font-semibold">{c.title}</h2>
                    </div>
                    <p className="mb-4 flex-1 text-sm text-muted-foreground">{c.description}</p>
                    <span className="text-xs font-medium text-primary">
                      Start course →
                    </span>
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
