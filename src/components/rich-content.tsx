"use client";

import { useEffect, useRef } from "react";
import hljs from "highlight.js/lib/common";
import { marked } from "marked";

/**
 * Renders trusted TipTap HTML and decorates every code block:
 * - copies the language from the `code.language-*` class onto `data-language`
 *   (TipTap v3 stores it there, our CSS label reads `pre[data-language]`)
 * - injects a hover "Copy" button like Medium's code blocks
 *
 * Older seed posts store markdown rather than TipTap HTML. If the body has no
 * HTML tags at all, parse it as markdown so those posts still read properly.
 */
function toHtml(input: string) {
  if (/<(p|h[1-6]|ul|ol|li|blockquote|pre|figure|table|div|section)\b[^>]*>/i.test(input)) {
    return input;
  }
  return marked.parse(input) as string;
}

export function RichContent({
  html,
  className,
  copyable = true,
}: {
  html: string;
  className?: string;
  /** set false where the HTML is editable or copy buttons don't belong */
  copyable?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const pres = Array.from(root.querySelectorAll("pre"));
    const buttons: HTMLButtonElement[] = [];

    for (const pre of pres) {
      const code = pre.querySelector("code");
      const lang = code?.className.match(/language-([\w+#.-]+)/)?.[1];
      if (lang) pre.setAttribute("data-language", lang);
      else pre.removeAttribute("data-language");

      // Posts typed in the editor arrive highlighted; ones created through the
      // API (or pasted) arrive as plain text, so highlight them here.
      if (code && lang && lang !== "plaintext" && !code.querySelector("span.hljs-")) {
        if (hljs.getLanguage(lang)) {
          try {
            code.innerHTML = hljs.highlight(code.textContent ?? "", {
              language: lang,
              ignoreIllegals: true,
            }).value;
          } catch {
            /* leave the block as plain text */
          }
        }
      }

      if (!copyable) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy-btn";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      pre.appendChild(btn);
      buttons.push(btn);
    }

    const onClick = async (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest?.(".code-copy-btn");
      if (!btn) return;
      const text = btn.closest("pre")?.querySelector("code")?.textContent ?? "";
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = "Copy"), 1600);
      } catch {
        btn.textContent = "Press Ctrl+C";
      }
    };

    root.addEventListener("click", onClick);
    return () => {
      root.removeEventListener("click", onClick);
      buttons.forEach((b) => b.remove());
    };
  }, [html, copyable]);

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: toHtml(html) }}
    />
  );
}