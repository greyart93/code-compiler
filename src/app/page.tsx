"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { LogOut } from "lucide-react";

/**
 * The redesigned landing page.
 *
 * The palette is fixed dark (the design is dark-only) — deliberately outside
 * the app theme tokens, so the page looks identical in both themes. Type is
 * Bricolage Grotesque, code is JetBrains Mono, both loaded in the root layout.
 */

const ACCENT = "#4DB8FF";
const ACCENT_TEXT = "#06131F";
const CANVAS = "#0D0E12";
const PANEL = "#15171D";
const PANEL_2 = "#12141A";
const DEEP = "#101217";
const BORDER = "#262932";
const BORDER_SOFT = "#22252E";
const HAIRLINE = "#1B1D25";
const TEXT = "#F3F1EC";
const MUTED = "#9A9EAB";
const GREEN = "#8FD18B";

const display = { fontFamily: "var(--font-bricolage), 'Segoe UI', sans-serif" };
const mono = { fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace" };

type Me = { id: string; username: string };

/** brand mark: code brackets with a slash, from the design */
function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={ACCENT}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 7l-5 5 5 5" />
      <path d="M16 7l5 5-5 5" />
      <path d="M13.5 5l-3 14" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

/** fade-up wrapper — the same entrance language the rest of the app uses */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** ── header ──────────────────────────────────────────────────────────── */

function LandingHeader() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null))
      .catch(() => setMe(null));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
  };

  const link = "text-[15px] text-[#9A9EAB] transition-colors hover:text-[#F3F1EC]";

  return (
    <header className="mx-auto flex w-full max-w-[1160px] flex-wrap items-center justify-between gap-4 px-8 py-[22px]">
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2.5 text-[22px] font-extrabold tracking-[-0.02em]" style={display}>
          <LogoMark />
          CodeVit
        </Link>
        <nav className="flex items-center gap-7">
          <Link href="/playground" className={link}>Playground</Link>
          <Link href="/learn" className={link}>Learn</Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {me ? (
          <>
            <Link
              href="/dashboard"
              className="rounded-[10px] px-4 py-3 text-[15px] font-semibold text-[#C9CBD3] transition-colors hover:text-[#F3F1EC]"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="flex items-center gap-2 rounded-[10px] px-4 py-3 text-[15px] font-semibold text-[#C9CBD3] transition-colors hover:text-[#F3F1EC]"
            >
              <LogOut className="size-4" />
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="px-4 py-3 text-[15px] font-semibold text-[#C9CBD3] transition-colors hover:text-[#F3F1EC]">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-[10px] px-5 py-3 text-[15px] font-semibold transition-[filter] hover:brightness-110"
              style={{ background: ACCENT, color: ACCENT_TEXT }}
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

/** ── hero: copy + editor mockup ──────────────────────────────────────── */

const CODE_LINES: Array<{ n: string; indent: number; jsx: React.ReactNode }> = [
  { n: "1", indent: 0, jsx: (<><span style={{ color: "#4DB8FF" }}>def</span> <span style={{ color: "#7CB7FF" }}>fib</span>(n):</>) },
  { n: "2", indent: 1, jsx: (<>a, b = <span style={{ color: "#E6C07B" }}>0</span>, <span style={{ color: "#E6C07B" }}>1</span></>) },
  { n: "3", indent: 1, jsx: (<><span style={{ color: "#4DB8FF" }}>for</span> _ <span style={{ color: "#4DB8FF" }}>in</span> <span style={{ color: "#7CB7FF" }}>range</span>(n):</>) },
  { n: "4", indent: 2, jsx: (<><span style={{ color: "#7CB7FF" }}>print</span>(a)</>) },
  { n: "5", indent: 2, jsx: (<>a, b = b, a + b</>) },
  { n: "6", indent: 0, jsx: <>&nbsp;</> },
  { n: "7", indent: 0, jsx: (<><span style={{ color: "#7CB7FF" }}>fib</span>(<span style={{ color: "#E6C07B" }}>8</span>)</>) },
];

function EditorMockup() {
  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
      style={{ flex: "1 1 460px", minWidth: 0, background: PANEL, borderColor: BORDER }}
    >
      {/* tab strip */}
      <div className="flex items-center justify-between gap-3 border-b px-3.5 py-2.5" style={{ borderColor: BORDER, background: PANEL_2 }}>
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg px-3 py-[7px] text-[13px]" style={{ ...mono, background: "#1F222B", color: TEXT }}>
            main.py
          </span>
          <span className="text-[13px]" style={{ color: MUTED }}>Python</span>
        </div>
        <button
          type="button"
          className="flex min-h-[44px] items-center gap-2 rounded-[10px] px-[18px] text-[14px] font-semibold transition-[filter] hover:brightness-110"
          style={{ background: ACCENT, color: ACCENT_TEXT }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M7 4l13 8-13 8z" />
          </svg>
          Run
        </button>
      </div>

      {/* code */}
      <div className="px-5 pb-[22px] pt-5 text-[14px] leading-[1.75]" style={{ ...mono, color: "#D8DAE2" }}>
        {CODE_LINES.map((l) => (
          <div key={l.n} className="flex gap-[18px]">
            <span className="w-[14px] text-right" style={{ color: "#5A5F70" }}>{l.n}</span>
            <span style={{ paddingLeft: l.indent * 28 }}>{l.jsx}</span>
          </div>
        ))}
      </div>

      {/* output */}
      <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: BORDER, background: DEEP }}>
        <div className="text-[12px] tracking-[0.08em]" style={{ ...mono, color: MUTED }}>OUTPUT</div>
        <div className="mt-2.5 text-[14px] leading-[1.7]" style={{ ...mono, color: GREEN }}>
          0 1 1 2 3 5 8 13
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-[1160px] flex-wrap items-center gap-14 px-8 pb-[72px] pt-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="min-w-0"
        style={{ flex: "1 1 440px" }}
      >
        <div className="inline-flex items-center gap-2.5 rounded-full border px-[14px] py-2 text-[14px]" style={{ borderColor: BORDER, color: "#B4B7C2" }}>
          <span className="size-2 rounded-full" style={{ background: GREEN }} />
          Free · No install · 6 languages
        </div>

        <h1
          className="mt-6 font-extrabold leading-[1.02] tracking-[-0.035em]"
          style={{ ...display, fontSize: "clamp(2.6rem, 6.5vw, 4rem)" }}
        >
          Write, run and share code <span style={{ color: ACCENT }}>in your browser.</span>
        </h1>

        <p className="mt-6 max-w-[480px] text-[19px] leading-[1.55]" style={{ color: MUTED }}>
          CodeVit is an online compiler and playground with saved snippets, public showcases and free
          community tutorials.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/playground"
            className="inline-flex items-center gap-2.5 rounded-xl px-6 py-4 text-[16px] font-semibold transition-[filter] hover:brightness-110"
            style={{ background: ACCENT, color: ACCENT_TEXT }}
          >
            Open Playground
            <ArrowRight />
          </Link>
          <Link
            href="/learn"
            className="inline-flex items-center rounded-xl border px-6 py-4 text-[16px] font-semibold transition-colors hover:border-[#3B3F4D]"
            style={{ borderColor: "#2A2D38", color: TEXT }}
          >
            Browse tutorials
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="min-w-0"
        style={{ flex: "1 1 460px" }}
      >
        <EditorMockup />
      </motion.div>
    </section>
  );
}

/** ── language strip ──────────────────────────────────────────────────── */

const LANGS = ["JavaScript", "Python", "C++", "Java", "Go", "Rust"];

function LanguageStrip() {
  return (
    <section className="border-y" style={{ borderColor: HAIRLINE, background: DEEP }}>
      <div className="mx-auto flex w-full max-w-[1160px] flex-wrap items-center justify-between gap-5 px-8 py-[26px]">
        <span className="text-[14px]" style={{ color: MUTED }}>
          Compiled and executed in the cloud
        </span>
        <div className="flex flex-wrap gap-2.5 text-[14px]" style={mono}>
          {LANGS.map((l) => (
            <span key={l} className="rounded-lg border px-[14px] py-[9px]" style={{ borderColor: BORDER }}>
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/** ── feature cards ───────────────────────────────────────────────────── */

const cardShell = {
  background: PANEL,
  border: `1px solid ${BORDER}`,
} as const;

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex size-11 items-center justify-center rounded-xl"
      style={{ background: "#10263E", color: ACCENT }}
    >
      {children}
    </div>
  );
}

function MiniRow({ name, right, rightColor, monoName }: { name: string; right: string; rightColor: string; monoName?: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-[10px] border px-3.5 py-[11px] text-[13px]"
      style={{ background: DEEP, borderColor: BORDER_SOFT }}
    >
      <span style={monoName ? mono : undefined}>{name}</span>
      <span style={{ color: rightColor }}>{right}</span>
    </div>
  );
}

function Features() {
  return (
    <section className="mx-auto w-full max-w-[1160px] px-8 pb-10 pt-[88px]">
      <Reveal>
        <h2
          className="max-w-[620px] font-extrabold leading-[1.1] tracking-[-0.03em]"
          style={{ ...display, fontSize: "clamp(1.9rem, 4vw, 2.625rem)" }}
        >
          Everything you need to practice, build and share.
        </h2>
      </Reveal>

      <div className="mt-11 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {/* Run 6 languages */}
        <Reveal delay={0}>
          <div className="flex h-full flex-col gap-3.5 rounded-2xl border p-7 transition-colors hover:border-[#3B3F4D]" style={cardShell}>
            <FeatureIcon>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M13 3L5 14h6l-1 7 8-11h-6z" />
              </svg>
            </FeatureIcon>
            <h3 className="mt-1.5 text-[22px] tracking-[-0.02em]" style={display}>Run 6 languages instantly</h3>
            <p className="m-0 text-[16px] leading-[1.55]" style={{ color: MUTED }}>
              JavaScript, Python, C++, Java, Go and Rust, compiled and executed in the cloud, right from your
              browser.
            </p>
            <div className="mt-2.5 rounded-[10px] border px-4 py-3.5 text-[13px] leading-[1.7]" style={{ ...mono, background: DEEP, borderColor: BORDER_SOFT, color: MUTED }}>
              <div><span style={{ color: ACCENT }}>&gt;</span> go run main.go</div>
              <div style={{ color: GREEN }}>Hello, CodeVit!</div>
            </div>
          </div>
        </Reveal>

        {/* Snippets */}
        <Reveal delay={0.08}>
          <div className="flex h-full flex-col gap-3.5 rounded-2xl border p-7 transition-colors hover:border-[#3B3F4D]" style={cardShell}>
            <FeatureIcon>
              <LogoMark size={22} />
            </FeatureIcon>
            <h3 className="mt-1.5 text-[22px] tracking-[-0.02em]" style={display}>Save &amp; showcase snippets</h3>
            <p className="m-0 text-[16px] leading-[1.55]" style={{ color: MUTED }}>
              Keep your code in your profile. Make snippets public to build a showcase, or keep them private.
            </p>
            <div className="mt-2.5 flex flex-col gap-2">
              <MiniRow name="two_sum.py" right="Public" rightColor={GREEN} monoName />
              <MiniRow name="linked_list.cpp" right="Private" rightColor={MUTED} monoName />
            </div>
          </div>
        </Reveal>

        {/* Community */}
        <Reveal delay={0.16}>
          <div className="flex h-full flex-col gap-3.5 rounded-2xl border p-7 transition-colors hover:border-[#3B3F4D]" style={cardShell}>
            <FeatureIcon>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
                <path d="M16 4.6a3.5 3.5 0 010 6.8" />
                <path d="M18 14.3c2 .7 3.5 2.5 3.5 5.2" />
              </svg>
            </FeatureIcon>
            <h3 className="mt-1.5 text-[22px] tracking-[-0.02em]" style={display}>Learn from the community</h3>
            <p className="m-0 text-[16px] leading-[1.55]" style={{ color: MUTED }}>
              Anyone can publish a tutorial for free. Read, learn and share your own knowledge.
            </p>
            <div className="mt-2.5 flex flex-col gap-2">
              <MiniRow name="Ownership in Rust" right="Free" rightColor={ACCENT} />
              <MiniRow name="Pointers in C++" right="Free" rightColor={ACCENT} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** ── CTA band ────────────────────────────────────────────────────────── */

function Cta() {
  return (
    <section className="mx-auto w-full max-w-[1160px] px-8 pb-[88px] pt-10">
      <Reveal>
        <div
          className="flex flex-wrap items-center justify-between gap-7 rounded-3xl px-12 py-14"
          style={{ background: ACCENT, color: ACCENT_TEXT }}
        >
          <h2
            className="m-0 max-w-[560px] font-extrabold leading-[1.08] tracking-[-0.03em]"
            style={{ ...display, fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
          >
            Your next snippet is one click away.
          </h2>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2.5 rounded-xl px-7 py-[18px] text-[16px] font-semibold transition-[filter] hover:brightness-125"
            style={{ background: CANVAS, color: TEXT }}
          >
            Open Playground
            <ArrowRight />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/** ── footer ──────────────────────────────────────────────────────────── */

function Footer() {
  const link = "transition-colors hover:text-[#F3F1EC]";
  return (
    <footer className="border-t" style={{ borderColor: HAIRLINE }}>
      <div
        className="mx-auto flex w-full max-w-[1160px] flex-wrap items-center justify-between gap-4 px-8 pb-9 pt-7 text-[14px]"
        style={{ color: MUTED }}
      >
        <span className="text-[16px] font-extrabold" style={{ ...display, color: TEXT }}>CodeVit</span>
        <div className="flex flex-wrap gap-6">
          <Link href="/playground" className={link}>Playground</Link>
          <Link href="/learn" className={link}>Learn</Link>
          <Link href="/login" className={link}>Sign in</Link>
        </div>
        <span>Free · No install</span>
      </div>
    </footer>
  );
}

/** ── page ────────────────────────────────────────────────────────────── */

export default function Landing() {
  return (
    <div style={{ ...display, background: CANVAS, color: TEXT }}>
      <LandingHeader />
      <main>
        <Hero />
        <LanguageStrip />
        <Features />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
