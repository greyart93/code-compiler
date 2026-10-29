"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";

/**
 * The redesigned landing page (editorial workshop).
 *
 * Palette: warm paper / obsidian, ink typography and a single cobalt accent.
 * Tokens live on `.home-page` in globals.css so the whole page flips with the
 * app theme, while code panes stay deliberately dark in both themes.
 */

// ── design tokens ─────────────────────────────────────────────────────────
const ACCENT = "var(--home-accent)"; // blue
const ACCENT_SOFT = "var(--home-accent-soft)"; // lighter blue
const ACCENT_DEEP = "var(--home-accent-deep)"; // deep blue
const INK = "var(--home-ink)";
const TEXT_2 = "var(--home-text-2)";
const TEXT_3 = "var(--home-text-3)";
const TEXT_4 = "var(--home-text-4)";
const GREY = "var(--home-grey)"; // code comments / muted marks
const BORDER = "var(--home-border)";
const BORDER_2 = "var(--home-border-2)";
const LINE = "var(--home-line)";
const DIVIDER = "var(--home-divider)";
const SURFACE = "var(--home-surface)";
const INVERSE_BG = "var(--home-inverse-bg)";
const INVERSE_BORDER = "var(--home-inverse-border)";
const INVERSE_INK = "var(--home-inverse-ink)";
const INVERSE_MUTED = "var(--home-inverse-muted)";
const INVERSE_ACCENT = "var(--home-inverse-accent)";
const INVERSE_BADGE = "var(--home-inverse-badge-bg)";
const INVERSE_BUTTON_BG = "var(--home-inverse-button-bg)";
const INVERSE_BUTTON_INK = "var(--home-inverse-button-ink)";

/** brand mark: code brackets with a slash */
function LogoMark({ size = 28, color = INK }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 7l-5 5 5 5" />
      <path d="M16 7l5 5-5 5" />
      <path d="M13.5 5l-3 14" />
    </svg>
  );
}

function ArrowIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4l13 8-13 8z" />
    </svg>
  );
}

const btnSm: React.CSSProperties = {
  minHeight: 40,
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
};

/** ── hero: dot grid, status pill, giant headline ─────────────────────── */

function Hero() {
  return (
    <section
      className="flex w-full flex-1 flex-col justify-center px-5 pb-12 pt-28 sm:px-10 sm:pb-14 sm:pt-32"
      style={{ maxWidth: 1240, margin: "0 auto" }}
    >
      {/* 👇 self-start + nowrap: the pill is exactly as wide as its content */}
      <div
        className="self-start inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border bg-[var(--home-surface)] px-3.5 py-[8px] text-[12px] uppercase tracking-[0.04em] sm:px-4"
        style={{ borderColor: BORDER, color: TEXT_4, fontFamily: "var(--font-mono), monospace" }}
      >
        <span className="size-[7px] shrink-0 rounded-full" style={{ background: ACCENT_SOFT }} />
        Free · No install · 6 languages
      </div>

      <h1
        className="mt-7 font-semibold"
        style={{ maxWidth: 1000, fontSize: "clamp(44px, 7.4vw, 100px)", lineHeight: 0.98, letterSpacing: "-0.05em", color: INK }}
      >
        Write, run and share code in your browser.
      </h1>

      <p className="mt-8" style={{ maxWidth: 780, fontSize: "clamp(19px, 1.1vw + 14px, 24px)", lineHeight: 1.5, letterSpacing: "-0.015em", color: TEXT_3 }}>
        CodeVit is an online compiler and playground with saved snippets, public showcases and free community
        tutorials.
      </p>
    </section>
  );
}

/** ── editor mockup: dark code card, interactive (language + run) ─────── */

const mono = { fontFamily: "var(--font-mono), monospace" } as const;

type LangKey = "python" | "javascript" | "c_cpp" | "java" | "go" | "rust";

const LANGS: Record<LangKey, { label: string; file: string }> = {
  python: { label: "Python", file: "main.py" },
  javascript: { label: "JavaScript", file: "main.js" },
  c_cpp: { label: "C++", file: "main.cpp" },
  java: { label: "Java", file: "Main.java" },
  go: { label: "Go", file: "main.go" },
  rust: { label: "Rust", file: "main.rs" },
};

/** k = keyword (red), f = function/class (blue), s = string (light blue), g = grey, p = plain */
const K = ({ t }: { t: string }) => <span style={{ color: ACCENT_DEEP }}>{t}</span>;
const F = ({ t }: { t: string }) => <span style={{ color: ACCENT_SOFT }}>{t}</span>;
const S = ({ t }: { t: string }) => <span style={{ color: "#93C5FD" }}>{t}</span>;
const G = ({ t }: { t: string }) => <span style={{ color: GREY }}>{t}</span>;

const EDITOR_SAMPLES: Record<LangKey, { lines: React.ReactNode[]; output: string }> = {
  python: {
    lines: [
      <><K t="def" /> <F t="fib" />(n):</>,
      <>a, b = <G t="0" />, <G t="1" /></>,
      <><K t="for" /> _ <K t="in" /> <F t="range" />(n):</>,
      <><F t="print" />(a)</>,
      <>a, b = b, a + b</>,
      <> </>,
      <><F t="fib" />(<G t="8" />)</>,
    ],
    output: "0 1 1 2 3 5 8 13",
  },
  javascript: {
    lines: [
      <><K t="const" /> <F t="fib" /> = (n) {`=>`} {`{`}</>,
      <>  <K t="let" /> a = <G t="0" />, b = <G t="1" />;</>,
      <>  <K t="for" /> (<K t="let" /> i = <G t="0" />; i {`<`} n; i++) {`{`}</>,
      <>    <F t="console" />.log(a);</>,
      <>    [a, b] = [b, a + b];</>,
      <>  {`}`} </>,
      <> <F t="fib" />(<G t="8" />);</>,
    ],
    output: "0 1 1 2 3 5 8 13",
  },
  c_cpp: {
    lines: [
      <><K t="#include" /> <S t="{`<`}iostream{`>`}" /></>,
      <><K t="int" /> <F t="main" />() {`{`}</>,
      <>  std::<F t="cout" /> {`<<`} <S t={String.raw`"Hello, C++"`} /> {`<<`} std::endl;</>,
      <>  <K t="return" /> <G t="0" />;</>,
      <>{`}`}</>,
      <> </>,
      <> </>,
    ],
    output: "Hello, C++",
  },
  java: {
    lines: [
      <><K t="public class" /> <F t="Main" /> {`{`}</>,
      <>  <K t="public static void" /> <F t="main" />(String[] args) {`{`}</>,
      <>    System.out.<F t="println" />(<S t="&quot;Hello, Java&quot;" />);</>,
      <>  {`}`}</>,
      <>{`}`}</>,
      <> </>,
      <> </>,
    ],
    output: "Hello, Java",
  },
  go: {
    lines: [
      <><K t="package" /> main</>,
      <>
      </>,
      <><K t="func" /> <F t="main" />() {`{`}</>,
      <>  fmt.<F t="Println" />(<S t="&quot;Hello, Go&quot;" />)</>,
      <>{`}`}</>,
      <> </>,
      <> </>,
    ],
    output: "Hello, Go",
  },
  rust: {
    lines: [
      <><K t="fn" /> <F t="main" />() {`{`}</>,
      <>    <F t="println" />!(<S t="&quot;Hello, Rust&quot;" />);</>,
      <>{`}`}</>,
      <> </>,
      <> </>,
      <> </>,
      <> </>,
    ],
    output: "Hello, Rust",
  },
};

function EditorCard({ lang, onRunMissing }: { lang: LangKey; onRunMissing?: () => void }) {
  const sample = EDITOR_SAMPLES[lang];
  const [runState, setRunState] = useState<"idle" | "running" | "done">("idle");

  // hide output again when the language switches
  useEffect(() => setRunState("idle"), [lang]);

  const run = () => {
    if (runState === "running") return;
    setRunState("running");
    setTimeout(() => setRunState("done"), 700);
  };

  return (
    <div
      className="overflow-hidden rounded-[18px] border"
      style={{ background: "#0F1013", borderColor: "#23252B", boxShadow: "var(--home-editor-shadow)" }}
    >
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-3.5" style={{ borderColor: "#23252B", background: "#15161A" }}>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="shrink-0 rounded-lg px-2.5 py-[7px] text-[13px] sm:px-3" style={{ ...mono, background: "#20222A", color: "#F2F2F4" }}>
            {LANGS[lang].file}
          </span>
          <span className="hidden min-w-0 truncate text-[13px] sm:inline" style={{ color: GREY }}>{LANGS[lang].label}</span>
        </div>
        <button
          type="button"
          onClick={run}
          className="flex shrink-0 items-center gap-2 rounded-[10px] px-3.5 text-[14px] font-semibold transition-colors sm:px-5"
          style={{ ...btnSm, border: 0, background: runState === "running" ? "#E4E4E8" : "#FFFFFF", color: "#0A0A0B", cursor: "pointer" }}
        >
          {runState === "running" ? (
            <span className="size-[14px] animate-spin rounded-full border-2 border-[#0A0A0B] border-t-transparent" />
          ) : (
            <PlayIcon />
          )}
          {runState === "running" ? "Running…" : "Run"}
        </button>
      </div>

      {/* NOTE: no `code` className here — the global .code rule (live-room editor grid) would collapse each line */}
      <div className="min-h-[300px] overflow-x-auto px-3.5 pb-6 pt-[18px] text-[13px] sm:px-[22px] sm:pt-[22px] sm:text-[14px]" style={{ ...mono, lineHeight: 1.8, color: "#D6D7DE" }}>
        {sample.lines.map((line, i) => (
          <div key={i} className="flex gap-5">
            {/* gutter: fixed-width, right-aligned, tabular numerals → always flush */}
            <span className="w-[18px] shrink-0 select-none text-right" style={{ color: "#565965", fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
            <span className="whitespace-pre">{line}</span>
          </div>
        ))}
      </div>

      {/* Output: hidden until Run, exactly like the real playground */}
      <div className="border-t px-3.5 pb-5 pt-4 sm:px-[22px]" style={{ borderColor: "#23252B", background: "#0B0C0F" }}>
        <div className="text-[11px] tracking-[0.1em]" style={{ ...mono, color: GREY }}>OUTPUT</div>
        {runState === "idle" ? (
          <div className="mt-2.5 text-[14px]" style={{ ...mono, color: "#4B4E58" }}>— click Run to see the output —</div>
        ) : runState === "running" ? (
          <div className="mt-2.5 h-[21px] w-[120px] animate-pulse rounded bg-[#20222A]" />
        ) : (
          <div className="mt-2.5 text-[14px]" style={{ ...mono, color: ACCENT_SOFT }}>{sample.output}</div>
        )}
      </div>
    </div>
  );
}

/** ── key features: numbered hairline grid + awwwards-style hover overlay ─ */

const FEATURES = [
  "Run JavaScript, Python, C++, Java, Go and Rust",
  "Compiled and executed in the cloud, right from your browser",
  "Keep your code in your profile with saved snippets",
  "Make snippets public to build a showcase, or keep them private",
  "Read and learn from free community tutorials",
  "Anyone can publish a tutorial for free and share their knowledge",
];

function FeatureCell({ text, index }: { text: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  // Awwwards references: Christen Dijoux's cursor-cut pixel reveal, translated
  // to a hairline grid. The cell stays flat; the pointer cuts an ink-dot lens
  // while four cobalt corner ticks open around it.
  const onPointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onPointerMove}
      className="kv-cell group relative flex gap-4 overflow-hidden bg-[var(--home-bg)] px-6 py-[26px] text-[16px] leading-[1.55]"
    >
      <span aria-hidden className="kv-corner kv-corner-tl" />
      <span aria-hidden className="kv-corner kv-corner-tr" />
      <span aria-hidden className="kv-corner kv-corner-br" />
      <span aria-hidden className="kv-corner kv-corner-bl" />
      <span className="kv-dot" aria-hidden />
      <span className="kv-num relative pt-1 text-[12px]" style={mono}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="kv-body relative">{text}</span>
    </div>
  );
}

function KeyFeatures() {
  return (
    <>
      <h2 className="mt-[72px] text-[24px] font-semibold tracking-[-0.03em]" style={{ color: INK }}>
        Key Features
      </h2>
      <div
        className="mt-6 grid grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-3"
        style={{ gap: 1, background: DIVIDER, borderColor: DIVIDER }}
      >
        {FEATURES.map((f, i) => (
          <FeatureCell key={i} text={f} index={i} />
        ))}
      </div>
    </>
  );
}

/** ── showcase content (static, no navigation) ────────────────────────── */

const SHOWCASE_SNIPPETS: Array<{ title: string; lang: string; code: string }> = [
  { title: "fib.py", lang: "python", code: "def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        print(a)\n        a, b = b, a + b" },
  { title: "main.cpp", lang: "C++", code: 'int main() {\n  std::cout << "Hello, C++" << std::endl;\n  return 0;\n}' },
  { title: "server.js", lang: "javascript", code: 'const run = (n) => [...Array(n)].map((_, i) => i > 1);\nconsole.log("ready");\nrun(4);' },
];

const SHOWCASE_TUTORIALS: Array<{ title: string; meta: string; excerpt: string }> = [
  { title: "Arrays in JavaScript — chapter 3", meta: "JavaScript · Learn course", excerpt: "map, filter, reduce and friends, with runnable examples for each." },
  { title: "Objects in JavaScript — chapter 3", meta: "JavaScript · Learn course", excerpt: "Destructuring, spread and the always-surprising `this`." },
  { title: "Your first Python script", meta: "Python · Quick start", excerpt: "From print() to writing a small utility in twenty minutes." },
];

function Showcase() {
  const [tab, setTab] = useState<"playground" | "snippets" | "tutorials">("playground");

  const tabCls = (on: boolean) => ({
    padding: 14,
    color: on ? INK : TEXT_3,
    borderBottom: `2px solid ${on ? INK : "transparent"}`,
    background: "none",
    transition: "color .2s",
  });

  return (
    <div>
      {/* tabs — pure tabs: no links, just switching the showcase below */}
      <div className="flex gap-5 overflow-x-auto text-[15px] font-medium [scrollbar-width:none] sm:gap-8 sm:text-[16px] [&::-webkit-scrollbar]:hidden">
        <button className="shrink-0 cursor-pointer" style={tabCls(tab === "playground")} onClick={() => setTab("playground")}>Playground</button>
        <button className="shrink-0 cursor-pointer" style={tabCls(tab === "snippets")} onClick={() => setTab("snippets")}>Snippets</button>
        <button className="shrink-0 cursor-pointer" style={tabCls(tab === "tutorials")} onClick={() => setTab("tutorials")}>Tutorials</button>
      </div>

      <p className="mt-8 text-[19px]" style={{ lineHeight: 1.75, color: TEXT_2 }}>
        {tab === "playground"
          ? "Pick a language, write your code and run it. Your program is compiled and executed in the cloud, right from your browser, with nothing to install. Save what you write to your profile, share it, or learn from tutorials written by the community."
          : "A quick look at what the community shares. Sign in to open anything in the Playground — these cards are just a showcase."}
      </p>

      <div className="mt-9">
        {tab === "playground" && <PlaygroundShowcase />}
        {tab === "snippets" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {SHOWCASE_SNIPPETS.map((s) => (
              <div key={s.title} className="rounded-2xl border bg-[var(--home-surface)] p-4" style={{ borderColor: BORDER }}>
                <div className="flex items-center justify-between">
                  <span style={{ ...mono, fontSize: 13, color: INK }}>{s.title}</span>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--home-accent-badge)", color: ACCENT }}>{s.lang}</span>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg p-3 text-[12px] leading-relaxed" style={{ ...mono, background: "#0F1013", color: "#D6D7DE" }}>
                  {s.code}
                </pre>
              </div>
            ))}
          </div>
        )}
        {tab === "tutorials" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {SHOWCASE_TUTORIALS.map((t) => (
              <div key={t.title} className="rounded-2xl border bg-[var(--home-surface)] p-5" style={{ borderColor: BORDER }}>
                <div className="text-[11px]" style={{ ...mono, color: ACCENT }}>{t.meta}</div>
                <div className="mt-1 text-[16px] font-semibold" style={{ color: INK }}>{t.title}</div>
                <p className="mt-1.5 text-[14px]" style={{ color: TEXT_3 }}>{t.excerpt}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** playground tab: mock editor + clickable language sidebar */
function PlaygroundShowcase() {
  const [lang, setLang] = useState<LangKey>("python");

  return (
    <div className="flex flex-wrap items-start gap-8">
      <div className="min-w-0" style={{ flex: "3 1 340px" }}>
        <EditorCard lang={lang} />
      </div>

      {/* languages — click one to switch the code card's language */}
      <aside className="min-w-0" style={{ flex: "1 1 220px" }}>
        <div className="text-[12px] uppercase tracking-[0.06em]" style={{ ...mono, color: TEXT_3 }}>
          Languages — click to switch
        </div>
        <div className="mt-3.5 overflow-hidden rounded-[18px] border bg-[var(--home-surface)]" style={{ borderColor: BORDER }}>
          {(Object.keys(LANGS) as LangKey[]).map((key, i, arr) => {
            const on = key === lang;
            return (
              <button
                key={key}
                onClick={() => setLang(key)}
                className="flex w-full cursor-pointer items-center gap-3 py-3 pl-5 pr-4 text-left text-[15px] transition-colors"
                style={{
                  color: on ? INK : TEXT_4,
                  fontWeight: on ? 600 : 400,
                  background: on ? "var(--home-accent-wash)" : undefined,
                  borderBottom: i < arr.length - 1 ? `1px solid ${LINE}` : undefined,
                }}
              >
                <span
                  className="size-2 shrink-0 rounded-full transition-colors"
                  style={{ background: on ? ACCENT : BORDER_2 }}
                />
                {LANGS[key].label}
              </button>
            );
          })}
        </div>

        <Link
          href="/playground"
          className="group mt-4 flex items-center justify-center gap-2.5 rounded-[14px] px-5 py-[16px] text-[16px] font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(37,99,235,0.30)]"
          style={{ background: INK, color: "var(--home-bg)" }}
        >
          Open Playground
          <ArrowIcon />
        </Link>
        <Link
          href="/learn"
          className="group flex items-center justify-center gap-2 rounded-[14px] border bg-[var(--home-surface)] px-5 py-4 text-[15px] font-medium transition-colors"
          style={{ borderColor: BORDER_2, color: INK }}
        >
          Browse tutorials
          <ArrowIcon size={15} />
        </Link>
      </aside>
    </div>
  );
}

/** ── main: tabbed showcase + features ───────────────────────────────── */

function Main() {
  return (
    <section className="mx-auto flex flex-wrap items-start gap-10 px-5 pb-14 pt-6 sm:gap-12 sm:px-10 sm:pb-[72px]" style={{ maxWidth: 1240 }}>
      <div className="min-w-0" style={{ flex: "1 1 640px" }}>
        <Showcase />
        <KeyFeatures />
      </div>
    </section>
  );
}

/** ── how it works: three numbered steps ────────────────────────────── */

const STEPS: Array<{ n: string; title: string; desc: string }> = [
  {
    n: "01",
    title: "Write",
    desc: "Pick one of six languages and start typing in the browser editor — nothing to install, nothing to configure.",
  },
  {
    n: "02",
    title: "Run",
    desc: "Your program compiles and executes in the cloud in seconds. Output and errors, right below the editor.",
  },
  {
    n: "03",
    title: "Share",
    desc: "Save snippets to your profile, make them public, or send a link so anyone can open your code instantly.",
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto px-5 pb-16 sm:px-10 sm:pb-[88px]" style={{ maxWidth: 1240 }}>
      <h2 className="text-[24px] font-semibold tracking-[-0.03em]" style={{ color: INK }}>
        How it works
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-2xl border bg-[var(--home-surface)] p-6" style={{ borderColor: BORDER }}>
            <div style={{ ...mono, fontSize: 12, letterSpacing: "0.08em", color: ACCENT }}>{s.n}</div>
            <div className="mt-2.5 text-[18px] font-semibold" style={{ color: INK }}>
              {s.title}
            </div>
            <p className="mt-2 text-[15px]" style={{ lineHeight: 1.65, color: TEXT_3 }}>
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** ── community: Explore snippets + Live interview rooms ─────────────── */

function Community() {
  return (
    <section className="mx-auto px-5 pb-16 sm:px-10 sm:pb-[88px]" style={{ maxWidth: 1240 }}>
      <h2 className="text-[24px] font-semibold tracking-[-0.03em]" style={{ color: INK }}>
        More than a playground
      </h2>
      <p className="mt-2 text-[15px]" style={{ color: TEXT_3 }}>
        Browse what the community builds, or practice out loud — both are free.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Explore */}
        <Link
          href="/explore"
          className="group flex flex-col justify-between rounded-2xl border bg-[var(--home-surface)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--home-card-shadow)]"
          style={{ borderColor: BORDER }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span style={{ ...mono, fontSize: 12, letterSpacing: "0.08em", color: ACCENT }}>EXPLORE</span>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "var(--home-accent-badge)", color: ACCENT }}>
                Free
              </span>
            </div>
            <div className="mt-3 text-[19px] font-semibold" style={{ color: INK }}>
              Public snippets
            </div>
            <p className="mt-2 text-[15px]" style={{ lineHeight: 1.6, color: TEXT_3 }}>
              Browse code shared by the community — like, comment, copy it, or save it to your dashboard to study later.
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-2 text-[15px] font-medium" style={{ color: INK }}>
            Explore snippets
            <ArrowIcon size={16} />
          </span>
        </Link>

        {/* Live rooms */}
        <Link
          href="/live"
          className="group flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(10,10,11,0.16)]"
          style={{ borderColor: INVERSE_BORDER, background: INVERSE_BG }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span style={{ ...mono, fontSize: 12, letterSpacing: "0.08em", color: INVERSE_ACCENT }}>LIVE</span>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: INVERSE_BADGE, color: INVERSE_ACCENT }}>
                Real-time
              </span>
            </div>
            <div className="mt-3 text-[19px] font-semibold" style={{ color: INVERSE_INK }}>
              Live interview rooms
            </div>
            <p className="mt-2 text-[15px]" style={{ lineHeight: 1.6, color: INVERSE_MUTED }}>
              Practice interviews together: a shared editor, notes, voice chat and a whiteboard — join from a room code, no setup.
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-2 text-[15px] font-medium" style={{ color: INVERSE_INK }}>
            Try a live room
            <ArrowIcon size={16} />
          </span>
        </Link>
      </div>
    </section>
  );
}

/** ── CTA band ────────────────────────────────────────────────────────── */

function Cta() {
  return (
    <section className="mx-auto px-5 pb-16 sm:px-10 sm:pb-[88px]" style={{ maxWidth: 1240 }}>
      <div
        className="flex flex-wrap items-center justify-between gap-6 rounded-[28px] border px-6 py-10 sm:gap-8 sm:px-14 sm:py-16"
        style={{ background: INVERSE_BG, borderColor: INVERSE_BORDER, color: INVERSE_INK }}
      >
        <h2
          className="m-0 font-semibold"
          style={{ maxWidth: 620, fontSize: "clamp(34px, 4.4vw, 56px)", lineHeight: 1.02, letterSpacing: "-0.045em" }}
        >
          Your next snippet is one click away.
        </h2>
        <Link
          href="/playground"
          className="group inline-flex items-center gap-2.5 rounded-[14px] px-7 py-[18px] text-[17px] font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(96,165,250,0.40)]"
          style={{ background: INVERSE_BUTTON_BG, color: INVERSE_BUTTON_INK }}
        >
          Open Playground
          <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}

/** ── footer ──────────────────────────────────────────────────────────── */

function Footer() {
  const link = "transition-colors hover:text-[var(--home-ink)]";
  return (
    <footer className="border-t" style={{ borderColor: BORDER }}>
      <div
        className="flex flex-wrap items-center justify-between gap-4 px-5 pb-8 pt-7 text-[14px] sm:px-10 sm:pb-10"
        style={{ maxWidth: 1240, margin: "0 auto", color: TEXT_3 }}
      >
        <span className="text-[17px] font-bold tracking-[-0.03em]" style={{ color: INK }}>
          Code<span style={{ color: ACCENT }}>Vit</span>
        </span>
        <div className="flex flex-wrap gap-6">
          <Link href="/playground" className={link}>Playground</Link>
          <Link href="/learn" className={link}>Learn</Link>
          <Link href="/explore" className={link}>Explore</Link>
          <Link href="/blog" className={link}>Blog</Link>
          <Link href="/discuss" className={link}>Discuss</Link>
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
    <div className="home-page relative isolate" style={{ fontFamily: "var(--font-sans), 'Segoe UI', sans-serif", background: "var(--home-bg)", color: INK }}>
      <SiteHeader landing />
      <div className="relative overflow-hidden">
        {/* Original landing dot-grid backdrop: a 40px grid behind the header
            and hero, fading out from 35% down. The light value is untouched;
            the dark value is the matching low-contrast equivalent. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: "min(1100px, 100svh)",
            backgroundImage: "radial-gradient(var(--home-grid-dot) 1.5px, transparent 1.5px)",
            backgroundSize: "40px 40px",
            WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, #000 0%, transparent 100%)",
          }}
        />
        <div className="relative flex min-h-svh flex-col">
          <Hero />
        </div>
      </div>

      <Main />
      <HowItWorks />
      <Community />
      <Cta />
      <Footer />
    </div>
  );
}
