import type { LessonSeed, SectionSeed } from "./course-types";

export const NEXT_BASICS: SectionSeed = {
  id: "next-basics",
  title: "Next.js Fundamentals",
  lessons: [
    {
      id: "next-why",
      title: "Why Next.js?",
      minutes: 6,
      md: `# Why Next.js?

React alone gives you components but forces you to assemble routing, data
fetching, bundling and deployment yourself. **Next.js** is that assembly, done:

- **File-system routing** — \`app/dashboard/page.tsx\` serves \`/dashboard\`.
- **Rendering on the right side** — pick per page: server, client, static, streaming.
- **Zero-config bundling** — code splitting and image optimization in the box.
- **Fullstack** — Route Handlers let one repo serve UI *and* API.

\`\`\`bash
npx create-next-app@latest my-app   # pick TypeScript, App Router, Tailwind
\`\`\`

## App Router structure

\`\`\`
app/
  layout.tsx     ← shared shell (html, nav)
  page.tsx       ← /
  dashboard/
    page.tsx     ← /dashboard
    settings/
      page.tsx   ← /dashboard/settings
  api/
    hello/
      route.ts   ← /api/hello
\`\`\`

A bare \`page.tsx\` is a Server Component by default — data-licious pages need
nothing but \`await\`.`,
    },
    {
      id: "next-layouts",
      title: "Layouts, pages, templates",
      minutes: 7,
      md: `# Layouts, pages, templates

## Layout — wraps every page in its segment

\`\`\`tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav />
        {children}
      </body>
    </html>
  );
}
\`\`\`

Layouts survive navigation — clicking sidebar links does **not** unmount the
layout, only the inner content. That's what makes it feel instant.

## Nesting layouts

\`\`\`
app/dashboard/layout.tsx   ← dashboard shell (auth check, sidebar)
app/dashboard/page.tsx     ← the index
app/dashboard/settings/page.tsx  ← inherits BOTH layouts
\`\`\`

## template vs layout

\`\`\`tsx
app/blog/template.tsx  // like a layout, but a NEW instance on each navigation
\`\`\`

Use a **template** for effects that should replay per page view (entry
animations); use a **layout** when state should persist.

## Loading & error — automatic UI states

\`\`\`tsx
app/dashboard/loading.tsx   ← streamed while the segment loads
app/dashboard/error.tsx     ← caught segment errors (must be a client component)
\`\`\``,
    },
    {
      id: "next-navigation",
      title: "Routing: dynamic, catch-all, groups",
      minutes: 8,
      md: `# Routing

## Dynamic segments

\`\`\`
app/blog/[slug]/page.tsx     → /blog/hello-world
app/shop/[...slug]/page.tsx  → /shop/any/thing/deep  (catch-all)
app/docs/[[...slug]]/page.tsx→ optional catch-all, ALSO matches /docs
\`\`\`

\`\`\`tsx
export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;   // params is a Promise in Next 15+
  const post = await db.post.findUnique({ where: { slug } });
  if (!post) notFound();           // triggers nearest not-found boundary
  return <PostView post={post} />;
}
\`\`\`

## Route groups — organize without changing URLs

\`\`\`
app/(marketing)/about/page.tsx    → /about
app/(shop)/cart/page.tsx          → /cart
\`\`\`

Parentheses are stripped from the path — a free way to give two sections
different layouts.

## Parallel & intercepting (know they exist)

- \`@modal\` + \`(.)photo\` — photo viewers that open over a feed.
- Route Handlers (\`route.ts\`) — the API surface; \`GET\`, \`POST\`, etc per HTTP verb.`,
    },
    {
      id: "next-server-client",
      title: 'Server vs Client Components, "use client"',
      minutes: 9,
      md: `# Server vs Client Components

**Default is Server Component.** It renders to HTML on the server and ships
nothing; it can read a DB, secrets, or \`fs\`. But it cannot hold state.

\`\`\`tsx
// server: async is fine
export default async function Profile() {
  const user = await db.user.findFirst();
  return <Card user={user} />;   // Card can still be a client component
}
\`\`\`

Add \`"use client"\` to the top of a file to opt into the interactive world:

\`\`\`tsx
"use client";
import { useState } from "react";

export function LikeButton({ id }: { id: string }) {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>{liked ? "❤" : "♡"}</button>;
}
\`\`\`

## The seam rules

1. A client component can import other client components freely.
2. Once you enter the client you **cannot import a server component**;
   instead pass it as \`children\` from a parent server component.
3. Treat \`"use client"\` as a **boundary marker**, not "this file is JS".
   Keep it as far down the tree as possible — smaller bundles.

| rule | server | client |
|---|---|---|
| \`useState\` / \`useEffect\` | ❌ | ✅ |
| \`async\` component + await | ✅ | ❌ |
| env secrets | ✅ | ❌ |
| event handlers | ❌ | ✅ |`,
    },
    {
      id: "next-data",
      title: "Data fetching: server-first",
      minutes: 9,
      md: `# Data fetching

## Server components fetch directly — no useEffect

\`\`\`tsx
export default async function Page() {
  const res = await fetch("https://api.github.com/repos/facebook/react", {
    next: { revalidate: 3600 },   // cache for 1h, revalidate in background
  });
  const repo = await res.json();
  return <main>{repo.full_name} ⭐{repo.stargazers_count}</main>;
}
\`\`\`

## The caching knobs

| setting | result |
|---|---|
| \`cache: 'force-cache'\` (default) | static-ish; revalidate freely |
| \`next: { revalidate: 60 }\` | ISR: revalidate after 60s |
| \`cache: 'no-store'\` | fresh on every request |

Or stream two queries at once with the pattern every Next docs use:

\`\`\`tsx
const [user, orders] = await Promise.all([getUser(), getOrders()]);
\`\`\`

## Mutations — Server Actions

Call a server function straight from a client form; no API route needed:

\`\`\`tsx
// app/actions.ts
"use server";
export async function createPost(formData: FormData) {
  "use server";
  await db.post.create({ data: { title: String(formData.get("title")) } });
}

// form
<form action={createPost}>
  <input name="title" />
  <button>Create</button>
</form>
\`\`\``,
    },
  ],
};

export const NEXT_ADVANCED: SectionSeed = {
  id: "next-advanced",
  title: "Advanced Next.js",
  lessons: [
    {
      id: "next-streaming",
      title: "Streaming, Suspense & loading UI",
      minutes: 8,
      md: `# Streaming & Suspense

Instead of waiting for the whole page's data, Next streams HTML as each part resolves.

\`\`\`tsx
export default function Dashboard() {
  return (
    <main>
      <h1>Dashboard</h1>
      <Suspense fallback={<ChartSkeleton />}>
        <Chart />   {/* async server component — streams when ready */}
      </Suspense>
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />
      </Suspense>
    </main>
  );
}
\`\`\`

First-screen content paints immediately; slow tabs catch up. Bonus: no more
"All-or-nothing" server wait from slow queries.

## Segment-level loading.tsx

Drop \`app/dashboard/loading.tsx\` and Next wires a Suspense boundary around the
whole segment automatically.

## Streaming error boundaries

\`error.tsx\` catches a failed async child; \`global-error.tsx\` catches the app
shell itself (rare). Pair them so one flaky query never blanks the page.`,
    },
    {
      id: "next-middleware",
      title: "Middleware, cookies & auth patterns",
      minutes: 8,
      md: `# Middleware & auth

Middleware runs on the **edge** before a route matches:

\`\`\`tsx
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const authed = req.cookies.has("session");
  if (!authed && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
\`\`\`

## Cookies, both ways

\`\`\`tsx
// server: read
import { cookies } from "next/headers";
const theme = (await cookies()).get("theme")?.value;

// route handler: set
res.cookies.set("theme", "dark", { httpOnly: true, sameSite: "lax" });

// server action: set
const jar = await cookies();
jar.set("theme", "dark");
\`\`\`

Keep cookies \`httpOnly\` (anti-XSS), \`sameSite: "lax"\` (anti-CSRF basics), and
\`secure\` in production.`,
    },
    {
      id: "next-image-font",
      title: "Images, fonts & metadata",
      minutes: 7,
      md: `# Images, fonts, metadata

## next/image

\`\`\`tsx
import Image from "next/image";
<Image src="/hero.png" alt="Hero" width={1200} height={600} priority />
\`\`\`

\`priority\` for the LCP image; everything else gets lazy loading + the right
format (AVIF/WebP) for free. Also no more CLS from missing dimensions.

## next/font — self-hosted, zero layout shift

\`\`\`tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
<html className={inter.variable}>
\`\`\`

## Metadata as code

\`\`\`tsx
export const metadata: Metadata = {
  title: { default: "My site", template: "%s · My site" },
  description: "…",
  openGraph: { images: ["/og.png"] },
};

// or per-page dynamic:
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug);
  return { title: post.title };
}
\`\`\`

Add \`generateStaticParams\` to prerender the known slugs at build time.`,
    },
    {
      id: "next-deploy",
      title: "Env, caching and production",
      minutes: 8,
      md: `# Production

## Environment variables

- Load-time secrets (DB, API keys) — server only, read in server code:
  \`\`\`ts
  process.env.DATABASE_URL   // available in Server Components / handlers
  \`\`\`
- Browser-safe values MUST start with \`NEXT_PUBLIC_\`:
  \`\`\`ts
  process.env.NEXT_PUBLIC_API_URL
  \`\`\`
- \`.env.local\` is for your machine; don't commit it.

## Caching layers (know what to blame)

1. **Router cache** — client-side nav prefetch per segment.
2. **fetch cache / \`revalidate\`** — data layer with tags:
   \`\`\`ts
   fetch(url, { next: { tags: ["posts"] } });
   // later, in a Server Action:
   revalidateTag("posts");
   \`\`\`
3. **Static prerender** — build-time HTML for pages without dynamic functions.

Drill: "I deployed but see old data" → check \`revalidate\` + \`revalidateTag\`
before blaming the server.

## What to actually deploy

\`next build\` then \`next start\` is enough for a standard server. Vercel, a
container, or a plain VM all work — the contract is Node runtime, not a
proprietary platform.`,
    },
  ],
};

export const NEXTJS_SECTIONS: SectionSeed[] = [NEXT_BASICS, NEXT_ADVANCED];
