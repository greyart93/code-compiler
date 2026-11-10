"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Heart, Loader2, MessageSquare, Rss, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SnippetCollectButton } from "@/components/snippet-collect";
import { SnippetLink } from "@/components/snippet-link";
import { Avatar, Empty, PageHead, Tag } from "@/components/ui/primitives";
import { useMe } from "@/lib/use-me";
import { getJson, peek } from "@/lib/api-cache";
import { languageLabel } from "@/lib/language";

type FeedSnippet = {
  id: string;
  title: string;
  language: string;
  code: string;
  createdAt: string;
  user: { username: string; name: string | null; image: string | null };
  likes: number;
  comments: number;
};

type Feed = { snippets: FeedSnippet[]; following: number };

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/**
 * The friends feed: the newest public snippets from the people you follow.
 * Following is one-way, so this is a reading list built by the accounts you
 * chose to watch — not a recommendation feed.
 */
export default function FeedPage() {
  const router = useRouter();
  const { me, loaded } = useMe();
  const [feed, setFeed] = useState<Feed | null>(() => peek<Feed>("/api/feed") ?? null);

  const load = useCallback(async () => {
    const cached = peek<Feed>("/api/feed");
    if (cached) setFeed(cached);
    try {
      setFeed(await getJson<Feed>("/api/feed"));
    } catch {
      setFeed((prev) => prev ?? { snippets: [], following: 0 });
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!me) {
      router.replace("/login?next=%2Ffeed");
      return;
    }
    void load();
  }, [loaded, me, router, load]);

  if (!loaded || !me) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <div className="page-wrap grid place-items-center py-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const snippets = feed?.snippets ?? [];
  const following = feed?.following ?? 0;

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <PageHead
          eyebrow={
            feed === null
              ? "Feed · loading"
              : `Feed · ${snippets.length} snippet${snippets.length === 1 ? "" : "s"} from ${following} account${following === 1 ? "" : "s"}`
          }
          title="From your people."
          description="The newest public snippets from the people you follow, latest first. Follow someone and their next snippet lands here."
          actions={
            <>
              <Link href="/friends" className="btn btn-ink">
                <Users className="size-4" /> People you follow
              </Link>
              <Link href="/explore" className="btn btn-outline">
                Explore everything
              </Link>
            </>
          }
        />

        {feed === null ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[290px] animate-pulse rounded-2xl border border-border bg-muted/40" />
            ))}
          </div>
        ) : snippets.length === 0 ? (
          <Empty
            icon={following > 0 ? Rss : Users}
            title={following > 0 ? "Nothing new yet" : "Your feed is empty"}
            body={
              following > 0
                ? "The people you follow have not published anything public yet. New snippets appear here the moment they do."
                : "Follow a few people and their public snippets show up here, newest first."
            }
            className="mt-10"
            action={
              <Link href={following > 0 ? "/explore" : "/friends"} className="btn btn-ink">
                {following > 0 ? "Browse the commons" : "Find people to follow"}
              </Link>
            }
          />
        ) : (
          <div className="mt-7 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {snippets.map((snippet, i) => {
              const displayName = snippet.user.name ?? snippet.user.username;
              return (
                <article
                  key={snippet.id}
                  className="card-surface card-hover reveal flex flex-col overflow-hidden"
                  style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={displayName} image={snippet.user.image} size={30} />
                      <div className="min-w-0">
                        <Link
                          href={`/u/${snippet.user.username}`}
                          className="block truncate text-[12.5px] font-medium hover:text-primary"
                        >
                          {displayName}
                        </Link>
                        <p className="mono-label !text-[8.5px]">
                          @{snippet.user.username} · {shortDate(snippet.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Tag tone="accent">{languageLabel(snippet.language)}</Tag>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <SnippetLink id={snippet.id} className="group block">
                      <h2 className="line-clamp-2 min-h-[44px] text-[16px] font-semibold leading-snug tracking-[-0.01em] transition-colors group-hover:text-primary">
                        {snippet.title}
                      </h2>
                    </SnippetLink>

                    <div className="code-pane relative mt-3 h-[140px] overflow-hidden">
                      <pre className="!p-3.5 text-[11px] leading-[1.65]">
                        {snippet.code.split("\n").slice(0, 8).join("\n")}
                      </pre>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--code-bg)] to-transparent" />
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="size-3.5" /> {snippet.likes}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="size-3.5" /> {snippet.comments}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <SnippetCollectButton snippetId={snippet.id} compact label="Save" />
                        <SnippetLink
                          id={snippet.id}
                          className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          Open
                          <ArrowUpRight className="size-3.5" />
                        </SnippetLink>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="mono-label">
            {following > 0
              ? `Watching ${following} account${following === 1 ? "" : "s"} · public snippets only`
              : "Follow people to fill this page"}
          </p>
          <div className="flex items-center gap-5 text-[12.5px] text-muted-foreground">
            <Link href="/friends" className="link-underline hover:text-foreground">
              Manage who you follow
            </Link>
            <Link href="/explore" className="link-underline hover:text-foreground">
              Explore the commons
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
