"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { BookOpen, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";

type Tutorial = {
  id: string;
  title: string;
  language: string | null;
  createdAt: string;
  user: { username: string; name: string | null };
};

export default function LearnIndex() {
  const [tutorials, setTutorials] = useState<Tutorial[] | null>(null);

  useEffect(() => {
    fetch("/api/tutorials")
      .then((r) => r.json())
      .then((d) => setTutorials(d.tutorials ?? []))
      .catch(() => setTutorials([]));
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Learn</h1>
            <p className="text-sm text-muted-foreground">
              Community posts — tutorials, notes and deep dives
            </p>
          </div>
          <Button asChild>
            <Link href="/blog/new">
              <Plus className="size-4" /> Publish a post
            </Link>
          </Button>
        </div>

        {tutorials === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : tutorials.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <BookOpen className="size-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                No posts yet — be the first to publish one!
              </p>
              <Button asChild>
                <Link href="/blog/new">Write the first post</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {tutorials.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="py-4">
                    <Link href={`/blog/${t.id}`} className="font-medium hover:underline">
                      {t.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.language ?? "general"} · by{" "}
                      <Link href={`/u/${t.user.username}`} className="hover:underline">
                        {t.user.name ?? t.user.username}
                      </Link>{" "}
                      · {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
