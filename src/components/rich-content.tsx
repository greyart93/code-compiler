"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import hljs from "highlight.js/lib/common";
import { marked } from "marked";
import { X } from "lucide-react";

/**
 * Renders trusted TipTap HTML and decorates it:
 * - copies the language from the `code.language-*` class onto `data-language`
 *   (TipTap v3 stores it there, our CSS label reads `pre[data-language]`)
 * - injects a hover "Copy" button like Medium's code blocks
 * - wraps images in a clipped frame that zooms on hover; clicking one opens a
 *   lightbox whose image morphs from the thumbnail's exact rect (View
 *   Transitions when available, a WAAPI FLIP otherwise) and morphs back on
 *   close — including a browser Back press
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

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    finished: Promise<void>;
  };
};

type ZoomState = { src: string; alt: string; tag: string };

let zoomSequence = 0;

function supportsViewTransition() {
  return (
    typeof document !== "undefined" &&
    typeof (document as ViewTransitionDocument).startViewTransition === "function"
  );
}

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
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

  const [zoom, setZoom] = useState<ZoomState | null>(null);
  const zoomRef = useRef<ZoomState | null>(null);
  zoomRef.current = zoom;

  const sourceRef = useRef<HTMLImageElement | null>(null);
  const sourceTagRef = useRef("");
  const overlayImgRef = useRef<HTMLImageElement | null>(null);
  const openRef = useRef<(img: HTMLImageElement) => void>(() => {});
  const closeRef = useRef<(fromHistory?: boolean) => void>(() => {});

  function openZoom(img: HTMLImageElement) {
    const tag = img.dataset.zoomTag;
    const src = img.currentSrc || img.src;
    if (!tag || !src || zoomRef.current) return;

    sourceRef.current = img;
    sourceTagRef.current = tag;

    // an extra history entry makes the browser Back button close the viewer,
    // which is what makes the closing morph feel like "going back"
    if (!history.state?.__codevitImageZoom) {
      history.pushState({ ...history.state, __codevitImageZoom: true }, "");
    }

    const apply = () => {
      // the thumbnail is hidden while the overlay owns the shared element
      img.style.visibility = "hidden";
      img.style.viewTransitionName = "";
      img.style.viewTransitionClass = "";
      setZoom({ src, alt: img.alt || "", tag });
    };

    if (supportsViewTransition() && !reducedMotion()) {
      img.style.viewTransitionName = tag;
      img.style.viewTransitionClass = "zoom-image";
      const vt = (document as ViewTransitionDocument).startViewTransition?.(() => {
        flushSync(apply);
      });
      vt?.finished.finally(() => {
        if (sourceRef.current === img) img.style.visibility = "hidden";
      });
    } else {
      apply();
    }
  }

  function closeZoom(fromHistory = false) {
    if (!zoomRef.current) return;

    // a normal close should consume our history entry, so Back still leaves
    // the post afterwards
    if (!fromHistory && history.state?.__codevitImageZoom) {
      history.back();
      return;
    }

    const img = sourceRef.current;
    const tag = sourceTagRef.current;

    const restore = () => {
      if (img) {
        img.style.visibility = "";
        img.style.viewTransitionName = tag;
        img.style.viewTransitionClass = "zoom-image";
      }
      setZoom(null);
    };

    if (supportsViewTransition() && !reducedMotion()) {
      const vt = (document as ViewTransitionDocument).startViewTransition?.(() => {
        flushSync(restore);
      });
      const clearNames = () => {
        if (img) {
          img.style.viewTransitionName = "";
          img.style.viewTransitionClass = "";
        }
        sourceRef.current = null;
      };
      // the promise is the normal path; the timer only covers a transition whose
      // completion never reports back in a background tab
      vt?.finished.then(clearNames).catch(clearNames);
      window.setTimeout(clearNames, 800);
    } else if (img && overlayImgRef.current && !reducedMotion()) {
      // FLIP fallback for browsers without the View Transitions API
      const overlay = overlayImgRef.current;
      const from = overlay.getBoundingClientRect();
      const to = img.getBoundingClientRect();
      if (from.width > 0 && to.width > 0) {
        let restored = false;
        const finishOnce = () => {
          if (restored) return;
          restored = true;
          restore();
        };
        const animation = overlay.animate(
          [
            { transform: "none", opacity: 1 },
            {
              transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${
                to.width / from.width
              }, ${to.height / from.height})`,
              opacity: 0.4,
            },
          ],
          { duration: 360, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
        );
        // a throttled tab can leave `finished` pending forever; never strand the
        // viewer open because of it
        animation.finished.then(finishOnce).catch(finishOnce);
        window.setTimeout(finishOnce, 520);
      } else {
        restore();
      }
    } else {
      restore();
    }
  }

  openRef.current = openZoom;
  closeRef.current = closeZoom;

  // browser Back closes the viewer with the reverse morph
  useEffect(() => {
    const onPop = () => {
      if (zoomRef.current) closeRef.current(true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // lock the page and let Escape close while the viewer is open
  useEffect(() => {
    if (!zoom) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoom]);

  // FLIP opening for browsers without View Transitions
  useLayoutEffect(() => {
    if (!zoom || supportsViewTransition() || reducedMotion()) return;
    const overlay = overlayImgRef.current;
    const source = sourceRef.current;
    if (!overlay || !source) return;
    const from = source.getBoundingClientRect();
    const to = overlay.getBoundingClientRect();
    if (from.width <= 0 || to.width <= 0) return;
    overlay.animate(
      [
        {
          transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${
            from.width / to.width
          }, ${from.height / to.height})`,
        },
        { transform: "none" },
      ],
      { duration: 400, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
  }, [zoom]);

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

    // images get a clipped frame so the hover scale crops instead of spilling
    for (const img of Array.from(root.querySelectorAll("img"))) {
      if (
        img.closest(".zoom-figure") ||
        img.closest("a") ||
        img.closest("pre") ||
        img.classList.contains("emoji") ||
        img.hasAttribute("data-no-zoom") ||
        !(img.currentSrc || img.getAttribute("src"))
      ) {
        continue;
      }
      const tag = `codevit-image-${++zoomSequence}`;
      img.dataset.zoomTag = tag;
      img.draggable = false;

      const frame = document.createElement("span");
      frame.className = "zoom-figure";
      frame.tabIndex = 0;
      frame.setAttribute("role", "button");
      frame.setAttribute("aria-label", img.alt ? `Open image: ${img.alt}` : "Open image");
      img.parentNode?.insertBefore(frame, img);
      frame.appendChild(img);
    }

    const onClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const btn = target.closest?.(".code-copy-btn");
      if (btn) {
        const text = btn.closest("pre")?.querySelector("code")?.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = "Copy"), 1600);
        } catch {
          btn.textContent = "Press Ctrl+C";
        }
        return;
      }

      const frame = target.closest?.(".zoom-figure") as HTMLElement | null;
      if (!frame) return;
      const img = frame.querySelector("img");
      if (!img) return;
      e.preventDefault();
      openRef.current(img);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const frame = (e.target as HTMLElement).closest?.(".zoom-figure") as HTMLElement | null;
      if (!frame) return;
      const img = frame.querySelector("img");
      if (!img) return;
      e.preventDefault();
      openRef.current(img);
    };

    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeyDown);
      buttons.forEach((b) => b.remove());
      root.querySelectorAll<HTMLElement>(".zoom-figure").forEach((frame) => {
        const img = frame.querySelector("img");
        if (img && frame.parentNode) {
          frame.parentNode.insertBefore(img, frame);
          frame.remove();
        }
      });
    };
  }, [html, copyable]);

  return (
    <>
      <div
        ref={ref}
        className={className}
        dangerouslySetInnerHTML={{ __html: toHtml(html) }}
      />

      {zoom &&
        createPortal(
          <div
            className="image-zoom-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={zoom.alt || "Image viewer"}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeRef.current();
            }}
          >
            <button
              type="button"
              className="image-zoom-close"
              aria-label="Close image"
              onClick={() => closeRef.current()}
            >
              <X className="size-4" />
            </button>
            <img
              ref={(el) => {
                overlayImgRef.current = el;
                if (el) {
                  el.style.viewTransitionName = zoom.tag;
                  el.style.viewTransitionClass = "zoom-image";
                }
              }}
              src={zoom.src}
              alt={zoom.alt}
              className="image-zoom-img"
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
    </>
  );
}
