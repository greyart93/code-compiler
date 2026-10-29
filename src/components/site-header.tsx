"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  Code2,
  Compass,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessagesSquare,
  Mic,
  Moon,
  Radio,
  Sun,
  Terminal,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StreakBadge } from "@/components/streak-badge";
import { useMe } from "@/lib/use-me";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  blurb: string;
};

const primaryNav: NavItem[] = [
  { href: "/playground", label: "Playground", icon: Terminal, blurb: "Write and run code in the browser" },
  { href: "/learn", label: "Learn", icon: GraduationCap, blurb: "Structured, free programming courses" },
  { href: "/explore", label: "Explore", icon: Compass, blurb: "Code shared by the community" },
  { href: "/blog", label: "Blog", icon: FileText, blurb: "Tutorials and long-form writing" },
  { href: "/discuss", label: "Discuss", icon: MessagesSquare, blurb: "Ask questions, trade answers" },
];

const indexNav: NavItem[] = [
  ...primaryNav,
  { href: "/interview", label: "Interview", icon: Mic, blurb: "Mock interviews with scored feedback" },
  { href: "/live", label: "Live rooms", icon: Radio, blurb: "Pair on code in a shared room" },
  { href: "/code-test", label: "Code test", icon: ListChecks, blurb: "LeetCode-style practice problems" },
  { href: "/quiz", label: "Quiz", icon: HelpCircle, blurb: "Fast checks for every language" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, blurb: "Your activity, streaks and progress" },
];

function Wordmark({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="CodeVit home"
      className="group flex shrink-0 items-center gap-2.5"
    >
      <span className="grid size-8 place-items-center rounded-[10px] bg-[var(--ink)] text-[var(--paper)] transition-transform duration-300 group-hover:-rotate-6">
        <Code2 className="size-[18px]" strokeWidth={2.2} />
      </span>
      <span className="text-[20px] font-bold tracking-[-0.04em] text-foreground">
        Code<span className="text-primary">Vit</span>
      </span>
    </Link>
  );
}

function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={
        compact
          ? "grid size-9 place-items-center rounded-full border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          : "btn btn-outline"
      }
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {!compact && <span className="text-[13px] font-medium">Appearance</span>}
    </button>
  );
}

/**
 * Sticky editorial top bar. Replaces the old collapsible left rail: the nav
 * is a floating pill, and everything else lives in a full-screen index overlay.
 * Pages keep rendering <SiteHeader /> at the top of their own tree, so no
 * global offset variable is needed.
 *
 * `landing` fixes the bar to the viewport so the marketing page and the app
 * share exactly one theme-aware navigation component.
 */
export function SiteHeader({
  landing = false,
  hidden = false,
}: {
  landing?: boolean;
  hidden?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { me, loaded, refresh } = useMe();
  const [indexOpen, setIndexOpen] = useState(false);

  // close the overlay on navigation
  useEffect(() => {
    setIndexOpen(false);
  }, [pathname]);

  // lock scroll + close on Escape while the index is open
  useEffect(() => {
    if (!indexOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndexOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [indexOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    refresh();
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  const initials = (me?.name ?? me?.username ?? "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <header
        className={`${
          landing ? "fixed inset-x-0 top-0 z-50" : "sticky top-0 z-50"
        } transition-[transform,opacity] duration-500 ease-in-out will-change-transform motion-reduce:transition-none ${
          hidden
            ? "pointer-events-none -translate-y-[120%] opacity-0"
            : "translate-y-0 opacity-100"
        }`}
        aria-hidden={hidden || undefined}
      >
        <div className="page-wrap py-3 sm:py-3.5">
          <div className="flex h-14 items-center justify-between gap-3 rounded-full border border-border bg-card/85 px-3 shadow-[0_10px_40px_rgba(10,10,11,0.06)] backdrop-blur-xl sm:px-4">
            <div className="flex min-w-0 items-center gap-1">
              <Wordmark />
              <span className="mx-2 hidden h-5 w-px bg-border sm:block" />
              <nav className="hidden items-center gap-0.5 lg:flex">
                {primaryNav.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors ${
                        active
                          ? "bg-[var(--ink)] text-[var(--paper)]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              {me && (
                <span className="hidden sm:block">
                  <StreakBadge />
                </span>
              )}
              <ThemeToggle compact />
              {loaded && !me && (
                <>
                  <Link
                    href="/login"
                    className="hidden rounded-full px-3.5 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="hidden rounded-full bg-[var(--ink)] px-4 py-2 text-[13.5px] font-medium text-[var(--paper)] transition-transform hover:-translate-y-0.5 sm:block"
                  >
                    Start free
                  </Link>
                </>
              )}
              {me && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Account menu"
                      className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-[11px] font-bold text-foreground outline-none transition-colors hover:border-foreground/30"
                    >
                      {me.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={me.image} alt="" className="size-full object-cover" />
                      ) : (
                        initials
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end" className="w-64">
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      {me.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={me.image} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                          {initials}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{me.name ?? me.username}</div>
                        <div className="truncate text-xs text-muted-foreground">@{me.username}</div>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/u/${me.username}`}>
                        <User /> Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DarkModeRow />
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => void handleLogout()} className="text-destructive focus:text-destructive">
                      <LogOut /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <button
                type="button"
                onClick={() => setIndexOpen(true)}
                className="ml-0.5 inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-[12.5px] font-medium transition-colors hover:border-foreground/30 sm:px-3.5"
                aria-label="Open the site index"
              >
                <Menu className="size-4" />
                <span className="hidden md:inline">Index</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {indexOpen && (
        <div
          className="fixed inset-0 z-[80] bg-[var(--paper)]"
          role="dialog"
          aria-modal="true"
          aria-label="Site index"
        >
          <div className="page-wrap flex h-full flex-col py-5 sm:py-6">
            <div className="flex items-center justify-between">
              <Wordmark onClick={() => setIndexOpen(false)} />
              <button
                type="button"
                onClick={() => setIndexOpen(false)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:border-foreground/40"
              >
                Close <X className="size-4" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-10 overflow-y-auto py-8 [scrollbar-width:none] lg:grid-cols-[1.5fr_0.7fr] lg:gap-16 lg:py-12 [&::-webkit-scrollbar]:hidden">
              <nav aria-label="All pages">
                {indexNav.map((item, i) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIndexOpen(false)}
                      className="reveal group flex items-center gap-4 border-b border-border py-3.5 sm:gap-6 sm:py-4"
                      style={{ animationDelay: `${i * 35}ms` }}
                    >
                      <span className="mono-label w-6 shrink-0 pt-2 text-[10px]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`display shrink-0 text-[30px] transition-colors sm:text-[42px] lg:text-[50px] ${
                          active ? "text-primary" : "text-foreground group-hover:text-primary"
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className="hidden max-w-[220px] text-[13px] leading-snug text-muted-foreground sm:block">
                        {item.blurb}
                      </span>
                      <Icon className="ml-auto size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  );
                })}
              </nav>

              <aside className="flex flex-col gap-5">
                <div className="card-surface p-5">
                  <p className="mono-label">Your workspace</p>
                  {me ? (
                    <>
                      <p className="mt-3 text-lg font-semibold">{me.name ?? me.username}</p>
                      <p className="text-sm text-muted-foreground">@{me.username}</p>
                      <div className="mt-4 grid gap-2">
                        <Link href="/dashboard" className="btn btn-ink w-full" onClick={() => setIndexOpen(false)}>
                          <LayoutDashboard className="size-4" /> Dashboard
                        </Link>
                        <Link href={`/u/${me.username}`} className="btn btn-outline w-full" onClick={() => setIndexOpen(false)}>
                          <User className="size-4" /> Public profile
                        </Link>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <span className="text-sm text-muted-foreground">Streak</span>
                        <StreakBadge />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-lg font-semibold">A quiet place to build.</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Save snippets, follow courses and keep a streak. Free, no install.
                      </p>
                      <div className="mt-4 grid gap-2">
                        <Link href="/register" className="btn btn-ink w-full" onClick={() => setIndexOpen(false)}>
                          Create an account
                        </Link>
                        <Link href="/login" className="btn btn-outline w-full" onClick={() => setIndexOpen(false)}>
                          Sign in
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                <div className="card-surface flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">Appearance</p>
                    <p className="text-xs text-muted-foreground">Paper or obsidian</p>
                  </div>
                  <ThemeToggle compact />
                </div>

                <div className="rounded-2xl border border-dashed border-border p-4">
                  <p className="mono-label">Shortcuts</p>
                  <div className="mt-3 space-y-2 text-[13px] text-muted-foreground">
                    <p className="flex items-center justify-between">
                      <span>Run code</span>
                      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘ / Ctrl + ↵</kbd>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Close this index</span>
                      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
                    </p>
                  </div>
                </div>

                <Link
                  href="/explore"
                  onClick={() => setIndexOpen(false)}
                  className="group flex items-center justify-between rounded-2xl bg-[var(--ink)] p-5 text-[var(--paper)]"
                >
                  <div>
                    <p className="mono-label !text-[var(--paper)]/60">Community</p>
                    <p className="mt-2 text-lg font-semibold leading-tight">See what people are shipping</p>
                  </div>
                  <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </aside>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** dark-mode switch row for the account menu (stays open on toggle) */
function DarkModeRow() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <DropdownMenuItem
      onSelect={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }}
    >
      <Moon />
      Dark mode
      <span className="ml-auto">
        <Switch checked={mounted && resolvedTheme === "dark"} onCheckedChange={() => {}} aria-hidden tabIndex={-1} />
      </span>
    </DropdownMenuItem>
  );
}
