"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

/**
 * Shared two-panel shell for sign in / register / password flows.
 * The form sits on paper; the aside is a member pass with a live code sample.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap flex min-h-[calc(100svh-84px)] flex-col justify-center pb-3 pt-4 sm:pb-5 sm:pt-5">
        <div className="mx-auto grid w-full max-w-[1080px] gap-5 lg:grid-cols-[1fr_0.92fr] lg:items-stretch">
          <section className="reveal card-surface flex flex-col p-4 sm:p-7 lg:p-8">
            <p className="mono-label">{eyebrow}</p>
            <h1 className="display mt-2 text-[clamp(32px,4.2vw,46px)] leading-[1.02]">{title}</h1>
            <p className="mt-2 max-w-[46ch] text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
            <div className="mt-5 flex-1">{children}</div>
            {footer && <div className="mt-3 border-t border-border pt-3 sm:mt-4">{footer}</div>}
          </section>

          <aside className="reveal reveal-1 card-surface relative hidden overflow-hidden p-7 lg:flex lg:flex-col lg:justify-between">
            <div className="pointer-events-none absolute -right-12 -top-16 size-52 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="mono-label">Member access</p>
                <span className="mono-label !text-muted-foreground">No. 001</span>
              </div>
              <h2 className="display mt-4 text-[clamp(28px,3vw,36px)] leading-[1.03]">
                Every session,
                <br />
                right where you
                <br />
                left it.
              </h2>
              <p className="mt-3 max-w-[34ch] text-[12.5px] leading-relaxed text-muted-foreground">
                Snippets, notes, courses and interview practice — kept together and ready when you
                need them.
              </p>
            </div>

            <div className="relative my-6 overflow-hidden rounded-xl border border-white/10 bg-[#0b0c0f]">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-3.5 py-2.5">
                <span className="size-2 rounded-full bg-white/20" />
                <span className="size-2 rounded-full bg-white/20" />
                <span className="size-2 rounded-full bg-white/20" />
                <span className="ml-2 font-mono text-[10px] text-white/35">session.ts</span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-[1.85] text-white/65">
                <span className="text-white/25">1&nbsp;&nbsp;</span>
                <span className="text-[#c4a7ff]">const</span> me ={" "}
                <span className="text-[#c4a7ff]">await</span>{" "}
                <span className="text-[#82aaff]">signIn</span>({"{"} email {"}"});
                {"\n"}
                <span className="text-white/25">2&nbsp;&nbsp;</span>
                <span className="text-[#82aaff]">await</span> me.
                <span className="text-[#ffcb6b]">dashboard</span>().load();
                {"\n"}
                <span className="text-white/25">3&nbsp;&nbsp;</span>
                <span className="text-[#6b7280]">// streak, scores, snippets — intact.</span>
              </pre>
            </div>

            <div className="relative grid grid-cols-3 gap-3 border-t border-border pt-4">
              <div>
                <p className="kpi-num text-[22px]">6</p>
                <p className="mono-label mt-1 !text-[8px] !text-muted-foreground">languages</p>
              </div>
              <div>
                <p className="kpi-num text-[22px]">Free</p>
                <p className="mono-label mt-1 !text-[8px] !text-muted-foreground">forever</p>
              </div>
              <div>
                <p className="kpi-num text-[22px]">0</p>
                <p className="mono-label mt-1 !text-[8px] !text-muted-foreground">installs</p>
              </div>
            </div>
          </aside>
        </div>

        <p className="mx-auto mt-4 flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
          <Link href="/" className="link-underline hover:text-foreground">
            ← Back to the site
          </Link>
          <span className="mono-label !text-[9px]">CodeVit · free, no install</span>
        </p>
      </main>
    </div>
  );
}
