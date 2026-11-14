"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RichContent } from "@/components/rich-content";
import { SlashCommandMenu } from "@/components/editor-slash";
import { BlogEditorToolbar } from "@/components/blog-editor-toolbar";

const lowlight = createLowlight(common);

/** a fresh post starts as one empty paragraph */
const STARTER_HTML = "<p></p>";

export interface TutorialFormData {
  title: string;
  content: string;
  language: string;
}

interface TutorialFormProps {
  initialTitle: string;
  initialLanguage: string;
  initialContent: string;
  submitLabel: string;
  busy: boolean;
  error: string | null;
  onSubmit: (data: TutorialFormData) => void;
  onCancel?: () => void;
}

/**
 * The essay editor.
 *
 * This component deliberately holds *no* per-transaction state: the toolbar and
 * the slash menu subscribe to the editor themselves, so typing re-renders those
 * leaves only — never the form, the title or the writing surface. That is what
 * keeps long posts cheap to type in.
 */
export function TutorialForm({
  initialTitle,
  initialLanguage,
  initialContent,
  submitLabel,
  busy,
  error,
  onSubmit,
  onCancel,
}: TutorialFormProps) {
  // Title/language are owned here; parents pass initial values and key-remount
  // this form when async data (e.g. an existing tutorial) finishes loading.
  const [title, setTitle] = useState(initialTitle);
  const [language, setLanguage] = useState(initialLanguage);
  const [mode, setMode] = useState<"write" | "preview">("write");
  // focus mode: clicking the writing surface grows it to fill the window
  const [expanded, setExpanded] = useState(false);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // the card's box just before focus mode flips, so the change can be animated
  const flipFromRef = useRef<DOMRect | null>(null);
  // the slash menu installs its key handler here (the editor is created once)
  const slashKeyRef = useRef<((view: unknown, event: KeyboardEvent) => boolean) | null>(null);
  const slashOpenRef = useRef(false);

  const enterFocusMode = () => {
    if (expanded) return;
    flipFromRef.current = formRef.current?.getBoundingClientRect() ?? null;
    // before the sheet goes fixed: the page wrappers must not be containing
    // blocks (they animate with a transform), or inset-0 fills the wrapper
    document.body.classList.add("is-focus-mode");
    setExpanded(true);
  };

  const leaveFocusMode = () => {
    if (!expanded) return;
    flipFromRef.current = formRef.current?.getBoundingClientRect() ?? null;
    setExpanded(false);
  };

  // FLIP: the sheet swaps between inline and fixed, which CSS cannot tween, so
  // invert the new box onto the old one with a transform and let it shrink
  // back to identity. Width, height and scale all move together.
  useLayoutEffect(() => {
    const el = formRef.current;
    const first = flipFromRef.current;
    flipFromRef.current = null;
    if (!el || !first) return;

    const last = el.getBoundingClientRect();
    // a collapsed wrapper can measure the sheet at a few pixels; animating that
    // would blow the scale up, so in that case just switch instantly
    if (last.width < 80 || last.height < 120) return;

    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const sx = first.width / last.width;
    const sy = first.height / last.height;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) {
      return;
    }

    el.style.transition = "none";
    el.style.transformOrigin = "top left";
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
    el.style.willChange = "transform";

    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      el.style.transition = "transform 460ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "translate3d(0px, 0px, 0) scale(1, 1)";
    };
    const raf = requestAnimationFrame(play);
    // belt and braces: a throttled frame must not leave the sheet half-scaled
    const kick = window.setTimeout(play, 50);

    const cleanup = () => {
      el.style.transition = "";
      el.style.transform = "";
      el.style.transformOrigin = "";
      el.style.willChange = "";
    };
    let doneTimer = 0;
    const finish = () => {
      cleanup();
      el.removeEventListener("transitionend", onEnd);
      window.clearTimeout(doneTimer);
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== "transform") return;
      finish();
    };
    el.addEventListener("transitionend", onEnd);
    // never leave the sheet half-scaled if the transition never reports back
    doneTimer = window.setTimeout(finish, 640);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(kick);
      window.clearTimeout(doneTimer);
      el.removeEventListener("transitionend", onEnd);
      cleanup();
    };
  }, [expanded]);

  // the title grows with its content, like Medium's
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "plaintext" }),
    ],
    content: initialContent || STARTER_HTML,
    editorProps: {
      attributes: {
        class: "medium-editor min-h-[420px] px-6 py-6 focus:outline-none sm:px-10",
        "data-placeholder": "Start writing your post…",
      },
      // the slash menu needs first refusal on arrows/Enter/Escape
      handleKeyDown: (view, event) => slashKeyRef.current?.(view, event) ?? false,
    },
    immediatelyRender: false,
    // no React state in here: the placeholder is pure CSS, so just flag emptiness
    onUpdate: ({ editor: e }) => {
      e.view.dom.setAttribute("data-empty", String(e.isEmpty));
    },
    onCreate: ({ editor: e }) => {
      e.view.dom.setAttribute("data-empty", String(e.isEmpty));
    },
  });

  // Escape leaves focus mode — unless the slash menu is open, which owns it.
  const leaveRef = useRef(leaveFocusMode);
  leaveRef.current = leaveFocusMode;
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || slashOpenRef.current) return;
      // An open dropdown (topic, code language) owns Escape: its options are
      // portalled outside the form and hold focus, so leave the sheet alone.
      const active = document.activeElement as HTMLElement | null;
      if (active && active !== document.body && !formRef.current?.contains(active)) return;
      leaveRef.current();
    };
    window.addEventListener("keydown", onKey);
    // the sheet is fixed; stop the page behind it from scrolling
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      document.body.classList.remove("is-focus-mode");
    };
  }, [expanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    if (!title.trim() || !editor.getText().trim()) return;
    onSubmit({
      title,
      content: editor.getHTML(),
      language,
    });
  };

  // only read the document when someone is actually looking at the preview
  const previewHtml = mode === "preview" ? (editor?.getHTML() ?? initialContent) : "";


  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col",
        // the sheet is fixed to the window, so the layout animation reads as a
        // smooth grow from the card's place on the page into the full screen
        expanded &&
          // above the sticky site header (z-50) so focus mode really is full screen
          "fixed inset-0 z-[60] overflow-hidden bg-background p-3 sm:p-5",
      )}
    >
      {/* the toolbar subscribes to the editor itself; this component does not */}
      {editor ? (
        <BlogEditorToolbar
          editor={editor}
          mode={mode}
          onModeChange={setMode}
          language={language}
          onLanguageChange={setLanguage}
          expanded={expanded}
          onToggleFocus={() => (expanded ? leaveFocusMode() : enterFocusMode())}
        />
      ) : (
        <div
          aria-hidden
          className={cn(
            "h-[46px] rounded-2xl border border-border bg-card/90",
            expanded ? "mb-3 shrink-0" : "-mx-2 mb-6",
          )}
        />
      )}

      {/* ── the writing surface: title first, then the body ───────────── */}
      <div
        onFocusCapture={enterFocusMode}
        className={cn(
          "rounded-2xl border border-border bg-card",
          expanded
            ? "flex min-h-0 flex-1 flex-col overflow-y-auto [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-[880px]"
            : "overflow-hidden",
        )}
      >
        <div className="px-6 pt-8 sm:px-10">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={1}
            placeholder="Title"
            aria-label="Post title"
            id="editor-title"
            className="display w-full resize-none overflow-hidden bg-transparent text-[2.2rem] leading-[1.1] outline-none placeholder:text-muted-foreground/40 sm:text-[2.6rem]"
          />
        </div>

        {mode === "write" ? (
          editor ? (
            <EditorContent editor={editor} />
          ) : (
            <div className="min-h-[420px]" />
          )
        ) : (
          <div className="px-6 py-8 sm:px-10">
            {previewHtml.replace(/<p>\s*<\/p>/g, "").trim().length > 40 ? (
              <RichContent className="medium-article" html={previewHtml} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing to preview yet — start writing on the Write tab.
              </p>
            )}
          </div>
        )}
      </div>

      <p
        className={cn(
          "mt-3 text-[11.5px] leading-relaxed text-muted-foreground",
          expanded && "hidden",
        )}
      >
        Tip: type <span className="font-mono text-foreground">/</span> on a new line to insert a
        heading, list, quote, code block or divider — then keep typing to filter and press Enter. Type{" "}
        <span className="font-mono">```</span> for a code block and pick its language on the right.
        Switch to <span className="font-medium text-foreground">Preview</span> to read the post exactly
        as your readers will.
      </p>

      {editor && (
        <SlashCommandMenu
          editor={editor}
          enabled={mode === "write"}
          keyHandlerRef={slashKeyRef}
          openRef={slashOpenRef}
        />
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div
        className={cn(
          "flex items-center gap-2 border-t border-border",
          expanded ? "mt-3 shrink-0 pt-3" : "mt-5 pt-4",
        )}
      >
        <Button type="submit" id="editor-publish" disabled={busy} className="min-w-[132px]">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
        <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">
          {expanded ? "Esc leaves focus mode" : "Autosaved to your account when you publish"}
        </span>
      </div>
    </form>
  );
}
