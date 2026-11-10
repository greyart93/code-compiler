"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Loader2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { Avatar, ArrowLink, Empty, PageHead, SectionHead, Stat } from "@/components/ui/primitives";
import { useMe } from "@/lib/use-me";
import { drop, getJson, peek } from "@/lib/api-cache";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type Person = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  isFollowing: boolean;
  followsMe: boolean;
};

type Social = {
  stats: { following: number; followers: number; friends: number };
  lists: { friends: Person[]; following: Person[]; followers: Person[] };
  discover: Person[];
};

type Tab = "friends" | "following" | "followers";

const TABS: { key: Tab; label: string }[] = [
  { key: "friends", label: "Friends" },
  { key: "following", label: "Following" },
  { key: "followers", label: "Followers" },
];

export default function FriendsPage() {
  const router = useRouter();
  const { me, loaded } = useMe();
  const [social, setSocial] = useState<Social | null>(() => peek<Social>("/api/social") ?? null);
  const [tab, setTab] = useState<Tab>("friends");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback((quiet = false) => {
    const cached = peek<Social>("/api/social");
    if (cached) setSocial(cached);
    else if (!quiet) setSocial(null);
    getJson<Social>("/api/social")
      .then((d) => d && setSocial(d))
      .catch(() =>
        setSocial((prev) =>
          prev ?? {
            stats: { following: 0, followers: 0, friends: 0 },
            lists: { friends: [], following: [], followers: [] },
            discover: [],
          }
        )
      );
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!me) {
      router.replace("/login?next=%2Ffriends");
      return;
    }
    load();
  }, [loaded, me, router, load]);

  /** Follow state is shared across the three lists and the suggestions */
  const updateEverywhere = (userId: string, isFollowing: boolean, extra?: { followsMe?: boolean }) => {
    setSocial((prev) =>
      prev
        ? {
            ...prev,
            lists: {
              friends: prev.lists.friends.map((p) =>
                p.id === userId ? { ...p, isFollowing, ...extra } : p
              ),
              following: prev.lists.following.map((p) =>
                p.id === userId ? { ...p, isFollowing, ...extra } : p
              ),
              followers: prev.lists.followers.map((p) =>
                p.id === userId ? { ...p, isFollowing, ...extra } : p
              ),
            },
            discover: prev.discover.map((p) => (p.id === userId ? { ...p, isFollowing } : p)),
          }
        : prev
    );
  };

  const toggleFollow = async (person: Person) => {
    const next = !person.isFollowing;
    setBusy(person.id);
    updateEverywhere(person.id, next);
    try {
      const res = await fetch(`/api/users/${person.username}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow: next }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.friends) toast(`You and @${person.username} are friends now`, { variant: "success" });
      // Counts and the mutual-friend lists are derived server-side, so re-read them
      drop("/api/social");
      drop("/api/users/");
      drop("/api/feed");
      void load(true);
    } catch {
      updateEverywhere(person.id, !next);
      toast("Could not update follow", { variant: "error" });
    } finally {
      setBusy(null);
    }
  };

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

  const list = social?.lists[tab] ?? [];
  const count = social ? list.length : 0;

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <PageHead
          eyebrow={`Your people · ${social?.stats.friends ?? 0} friends`}
          title="The people you code with."
          description="Following is one-way — you see what someone ships. When you follow each other, you are friends: their new snippets show up here first."
          actions={
            <>
              <Link href="/explore" className="btn btn-ink">
                Find people <ArrowUpRight className="size-4" />
              </Link>
              <Link href="/feed" className="btn btn-outline">
                Your feed
              </Link>
              <Link href={`/u/${me.username}`} className="btn btn-outline">
                Your profile
              </Link>
            </>
          }
        />

        <section className="reveal reveal-1 mt-7 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-3 divide-x divide-border">
            <Stat
              label="Friends"
              value={social?.stats.friends ?? (social === null ? "—" : 0)}
              hint="mutual follows"
              accent
            />
            <Stat
              label="Following"
              value={social?.stats.following ?? (social === null ? "—" : 0)}
              hint="people you watch"
            />
            <Stat
              label="Followers"
              value={social?.stats.followers ?? (social === null ? "—" : 0)}
              hint="watching you"
            />
          </div>
        </section>

        <section className="reveal reveal-2 mt-10">
          <SectionHead
            index="01"
            title={tab === "friends" ? "Friends" : tab === "following" ? "Following" : "Followers"}
            count={social === null ? undefined : count}
            action={
              <div className="flex items-center rounded-full border border-border bg-card p-1">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-pressed={tab === t.key}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                      tab === t.key
                        ? "bg-[var(--ink)] text-[var(--paper)]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            }
          />

          {social === null ? (
            <div className="mt-5 grid gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-muted/40" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <Empty
              icon={Users}
              title={
                tab === "friends"
                  ? "No friends yet"
                  : tab === "following"
                    ? "You are not following anyone"
                    : "No followers yet"
              }
              body={
                tab === "friends"
                  ? "Follow someone who publishes code you like — when they follow back, they appear here."
                  : tab === "following"
                    ? "Pick a few people from the commons and their work starts showing up in your feed."
                    : "Publish snippets in explore; people who like your work will follow you."
              }
              className="mt-5"
              action={
                tab !== "followers" ? (
                  <Link href="/explore" className="btn btn-ink">
                    Browse the commons
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
              {list.map((person, i) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  busy={busy === person.id}
                  onToggle={() => void toggleFollow(person)}
                  className={cn(i > 0 && "border-t border-border")}
                />
              ))}
            </div>
          )}
        </section>

        {(social?.discover.length ?? 0) > 0 && (
          <section className="reveal reveal-3 mt-10">
            <SectionHead
              index="02"
              title="Worth a follow"
              count={social?.discover.length}
              action={<ArrowLink href="/explore">More in explore</ArrowLink>}
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {social?.discover.map((person) => (
                <article key={person.id} className="card-surface flex items-start gap-3 p-4">
                  <Avatar name={person.name ?? person.username} image={person.image} size={40} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/u/${person.username}`}
                      className="block truncate text-[13.5px] font-semibold hover:text-primary"
                    >
                      {person.name ?? person.username}
                    </Link>
                    <p className="mono-label !text-[9px]">@{person.username}</p>
                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
                      {person.bio?.trim() || "Publishing code in the commons."}
                    </p>
                    <Button
                      variant={person.isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={() => void toggleFollow(person)}
                      disabled={busy === person.id}
                      className="mt-3 h-7 gap-1 px-2.5 text-[11.5px]"
                    >
                      {busy === person.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : person.isFollowing ? (
                        <Check className="size-3" />
                      ) : (
                        <UserPlus className="size-3" />
                      )}
                      {person.isFollowing ? "Following" : "Follow"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="mono-label">Follows are public · streets, not inboxes</p>
          <div className="flex items-center gap-5 text-[12.5px] text-muted-foreground">
            <Link href="/collections" className="link-underline hover:text-foreground">
              Your folders
            </Link>
            <Link href="/dashboard" className="link-underline hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function PersonRow({
  person,
  busy,
  onToggle,
  className,
}: {
  person: Person;
  busy: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3", className)}>
      <Avatar name={person.name ?? person.username} image={person.image} size={38} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <Link
            href={`/u/${person.username}`}
            className="truncate text-[13.5px] font-semibold hover:text-primary"
          >
            {person.name ?? person.username}
          </Link>
          <span className="mono-label shrink-0 !text-[9px]">@{person.username}</span>
          {person.isFollowing && person.followsMe && (
            <span className="mono-label shrink-0 !text-[8.5px] text-primary">friends</span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">
          {person.bio?.trim() || "No bio yet."}
        </p>
      </div>
      <Button
        variant={person.isFollowing ? "outline" : "default"}
        size="sm"
        onClick={onToggle}
        disabled={busy}
        className="h-8 shrink-0 gap-1 px-3 text-[11.5px]"
      >
        {busy ? (
          <Loader2 className="size-3 animate-spin" />
        ) : person.isFollowing ? (
          <Check className="size-3" />
        ) : (
          <UserPlus className="size-3" />
        )}
        {person.isFollowing ? "Following" : person.followsMe ? "Follow back" : "Follow"}
      </Button>
    </div>
  );
}
