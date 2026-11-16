"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { VideoPlayer, parseVideoUrl } from "@/components/video-player";

/**
 * Markdown-lite renderer for discussion posts.
 *
 * Posts are plain text: paragraphs, bullet / numbered lists, quotes, headings,
 * fenced code, images and video links all render as React nodes. Everything
 * else stays text, so raw HTML in a post can never become live markup.
 */

const INLINE =
  /(!\[[^\]]*\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

function safeHref(raw: string) {
  const url = raw.trim();
  if (/^https?:\/\//i.test(url) || url.startsWith("/") || url.startsWith("#") || /^mailto:/i.test(url)) {
    return url;
  }
  return null;
}

function safeImageSrc(raw: string) {
  const url = raw.trim();
  if (/^https?:\/\//i.test(url) || url.startsWith("/")) return url;
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(url)) return url;
  return null;
}

function imageFromToken(token: string) {
  const match = token.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);
  if (!match) return null;
  const src = safeImageSrc(match[2]);
  return src ? { src, alt: match[1] } : null;
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(INLINE.source, "g");

  while ((match = re.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    const key = `i-${out.length}`;

    if (token.startsWith("![")) {
      const image = imageFromToken(token);
      if (image) {
        out.push(
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={key}
            src={image.src}
            alt={image.alt}
            loading="lazy"
            className="my-2 max-h-96 w-full rounded-lg border border-border object-contain"
          />
        );
      } else {
        out.push(token);
      }
    } else if (token.startsWith("`")) {
      out.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.92em]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      out.push(<strong key={key}>{inline(token.slice(2, -2))}</strong>);
    } else if (token.startsWith("*")) {
      out.push(<em key={key}>{inline(token.slice(1, -1))}</em>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link ? safeHref(link[2]) : null;
      if (link && href) {
        out.push(
          <a
            key={key}
            href={href}
            target={href.startsWith("#") ? undefined : "_blank"}
            rel={href.startsWith("#") ? undefined : "noreferrer"}
            className="font-medium text-primary underline underline-offset-2"
          >
            {inline(link[1])}
          </a>
        );
      } else {
        out.push(token);
      }
    }
    last = re.lastIndex;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "code"; text: string; language: string }
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string; title: string };

function standaloneImage(line: string) {
  const match = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);
  if (!match) return null;
  const src = safeImageSrc(match[2]);
  return src ? { src, alt: match[1] } : null;
}

function standaloneVideo(line: string) {
  const value = line.trim();
  const link = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  const candidate = link ? link[2] : value;
  if (!/^https?:\/\//i.test(candidate)) return null;
  if (!parseVideoUrl(candidate)) return null;
  return { src: candidate, title: link ? link[1] : "Watch the video" };
}

function parse(body: string): Block[] {
  const blocks: Block[] = [];
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  let code: { lines: string[]; language: string } | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ kind: "p", text: paragraph.join(" ") });
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    blocks.push(list);
    list = null;
  };

  for (const line of lines) {
    if (code) {
      if (line.trim().startsWith("```")) {
        blocks.push({
          kind: "code",
          text: code.lines.join("\n"),
          language: code.language,
        });
        code = null;
      } else {
        code.lines.push(line);
      }
      continue;
    }

    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushList();
      const info = line.trim().slice(3).trim().split(/\s+/)[0] || "";
      code = { lines: [], language: info };
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const image = standaloneImage(line);
    if (image) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "image", ...image });
      continue;
    }

    const video = standaloneVideo(line);
    if (video) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "video", ...video });
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "heading", text: heading[1] });
      continue;
    }

    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "quote", text: quote[1] });
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      if (!list || list.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ordered) {
      flushParagraph();
      if (!list || list.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [] };
      }
      list.items.push(ordered[1]);
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  if (code) {
    blocks.push({ kind: "code", text: code.lines.join("\n"), language: code.language });
  }
  flushParagraph();
  flushList();
  return blocks;
}

const LANGUAGE_LABELS: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  cpp: "c++",
  c_cpp: "c++",
  cs: "csharp",
  md: "markdown",
  text: "plaintext",
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const label = LANGUAGE_LABELS[language.toLowerCase()] ?? (language || "plaintext");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard can be unavailable on insecure origins */
    }
  };

  return (
    <div className="post-code overflow-hidden rounded-lg border border-[var(--code-line)]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/45">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Copy code"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function PostBody({ body }: { body: string }) {
  const blocks = parse(body);

  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        const key = `b-${i}`;

        if (block.kind === "code") {
          return <CodeBlock key={key} code={block.text} language={block.language} />;
        }

        if (block.kind === "image") {
          return (
            <figure key={key} className="overflow-hidden rounded-lg border border-border">
              <a href={block.src} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.src}
                  alt={block.alt}
                  loading="lazy"
                  className="max-h-[560px] w-full bg-muted object-contain"
                />
              </a>
              {block.alt && (
                <figcaption className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
                  {block.alt}
                </figcaption>
              )}
            </figure>
          );
        }

        if (block.kind === "video") {
          return <VideoPlayer key={key} src={block.src} title={block.title} />;
        }

        if (block.kind === "heading") {
          return (
            <h3 key={key} className="pt-1 text-[15px] font-semibold tracking-[-0.01em]">
              {inline(block.text)}
            </h3>
          );
        }

        if (block.kind === "ul" || block.kind === "ol") {
          const items = block.items.map((item, j) => (
            <li key={`${key}-${j}`}>{inline(item)}</li>
          ));
          return block.kind === "ul" ? (
            <ul
              key={key}
              className="ml-5 list-disc space-y-1 marker:text-muted-foreground [&>li]:pl-0.5"
            >
              {items}
            </ul>
          ) : (
            <ol
              key={key}
              className="ml-5 list-decimal space-y-1 marker:text-muted-foreground [&>li]:pl-0.5"
            >
              {items}
            </ol>
          );
        }

        if (block.kind === "quote") {
          return (
            <blockquote
              key={key}
              className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground"
            >
              {inline(block.text)}
            </blockquote>
          );
        }

        return <p key={key}>{inline(block.text)}</p>;
      })}
    </div>
  );
}
