"use client";

import { useEffect, useMemo, useRef } from "react";
import { Marked } from "marked";
import hljs from "highlight.js/lib/common";

/**
 * Obsidian-style markdown renderer for Learn lessons.
 * - ```lang fences → highlight.js highlighted <pre data-language="…">
 * - per-code-block "Run" button (delegated click → onRunCode(code))
 * - inline code, lists, bold etc. styled via .lesson-content CSS
 */

// marked is sync + single-threaded; hand the renderer the current block list
let renderCtx: { blocks: string[] } | null = null;

function renderMarkdown(md: string): { html: string; blocks: string[] } {
  const blocks: string[] = [];
  const instance = new Marked({ gfm: true });
  instance.use({
    renderer: {
      code(src: string, lang?: string | null) {
        const language = (lang ?? "").trim().split(/\s+/)[0] || "text";
        const idx = blocks.length;
        blocks.push(src);
        let body: string;
        if (language !== "text" && hljs.getLanguage(language)) {
          try {
            body = hljs.highlight(src, { language, ignoreIllegals: true }).value;
          } catch {
            body = escapeHtml(src);
          }
        } else {
          body = escapeHtml(src);
        }
        return `<pre data-language="${escapeHtml(language)}" data-md-block="${idx}"><code class="hljs">${body}</code></pre>`;
      },
      codespan(text: string) {
        return `<code class="md-codespan">${text}</code>`;
      },
    },
  });
  renderCtx = { blocks };
  let html: string;
  try {
    html = instance.parse(md) as string;
  } finally {
    renderCtx = null;
  }
  return { html, blocks };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function MarkdownContent({
  md,
  className,
  onRunCode,
}: {
  md: string;
  className?: string;
  /** Called when the user clicks a code block's Run button */
  onRunCode?: (code: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { html, blocks } = useMemo(() => renderMarkdown(md), [md]);
  const onRunRef = useRef(onRunCode);
  onRunRef.current = onRunCode;

  // Inject a Run button into every fenced block + one delegated click listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onRunCode) return;
    const btns: HTMLButtonElement[] = [];
    el.querySelectorAll<HTMLPreElement>("pre[data-md-block]").forEach((pre) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "md-run-btn";
      btn.setAttribute("aria-label", "Run this code in the Playground");
      btn.textContent = "▶ Run";
      pre.appendChild(btn);
      btns.push(btn);
    });
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest?.(".md-run-btn");
      if (!btn) return;
      const pre = btn.closest("pre[data-md-block]");
      const idx = Number(pre?.getAttribute("data-md-block") ?? -1);
      if (idx >= 0 && blocks[idx] !== undefined) onRunRef.current?.(blocks[idx]);
    };
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("click", onClick);
      btns.forEach((b) => b.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, blocks]);

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
