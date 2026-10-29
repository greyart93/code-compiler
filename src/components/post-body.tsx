"use client";

import type { ReactNode } from "react";

/**
 * Markdown-lite renderer for discussion posts.
 *
 * Posts are plain text: paragraphs, bullet / numbered lists, quotes, headings
 * and ``` fenced code all render as React nodes. Everything else stays text,
 * so raw HTML in a post can never become live markup.
 */

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

function safeHref(raw: string) {
  const url = raw.trim();
  if (/^https?:\/\//i.test(url) || url.startsWith("/") || url.startsWith("#") || /^mailto:/i.test(url)) {
    return url;
  }
  return null;
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

    if (token.startsWith("`")) {
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
  | { kind: "code"; text: string };

function parse(body: string): Block[] {
  const blocks: Block[] = [];
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  let code: string[] | null = null;

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
        blocks.push({ kind: "code", text: code.join("\n") });
        code = null;
      } else {
        code.push(line);
      }
      continue;
    }

    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushList();
      code = [];
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
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

  if (code) blocks.push({ kind: "code", text: code.join("\n") });
  flushParagraph();
  flushList();
  return blocks;
}

export function PostBody({ body }: { body: string }) {
  const blocks = parse(body);

  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        const key = `b-${i}`;

        if (block.kind === "code") {
          return (
            <pre
              key={key}
              className="post-code overflow-x-auto rounded-lg p-3 font-mono text-[12.5px] leading-relaxed"
            >
              <code>{block.text}</code>
            </pre>
          );
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
