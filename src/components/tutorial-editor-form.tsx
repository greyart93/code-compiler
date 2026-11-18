"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import { Check, X } from "lucide-react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { common, createLowlight } from "lowlight";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RichContent } from "@/components/rich-content";
import { SlashCommandMenu } from "@/components/editor-slash";
import { BlogEditorToolbar, CODE_LANGS } from "@/components/blog-editor-toolbar";
import { ImageDialog } from "@/components/editor-image";
import { CodeLangTag, codeLangLabel } from "@/lib/code-lang-tag";

const lowlight = createLowlight(common);

/** a fresh post starts as one empty paragraph */
const STARTER_HTML = "<p></p>";

export interface TutorialFormData {
  title: string;
  content: string;
  language: string;
  coverImage: string | null;
}

interface TutorialFormProps {
  initialTitle: string;
  initialLanguage: string;
  initialContent: string;
  initialCoverImage?: string | null;
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
  initialCoverImage,
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
  const [imageOpen, setImageOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(initialCoverImage ?? null);
  const [langMenu, setLangMenu] = useState<{
    pos: number;
    top: number;
    left: number;
    current: string;
  } | null>(null);

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
      // URL/path images in essays; discuss posts use the separate media upload
      Image.configure({ inline: false, allowBase64: true }),
      TableKit.configure({ table: { resizable: false } }),
      // clickable language tag in the corner of every code block
      CodeLangTag,
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

  // Clicking a code block's language tag opens the language menu. Capture +
  // preventDefault keeps ProseMirror from moving the caret to the widget.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onDown = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest?.(".code-lang-tag") as HTMLElement | null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const pos = Number(btn.dataset.codeLangPos);
      if (!Number.isFinite(pos)) return;

      const rect = btn.getBoundingClientRect();
      const width = 184;
      const height = Math.min(300, CODE_LANGS.length * 30 + 44);
      const below = window.innerHeight - rect.bottom;
      const top = below < height + 16 ? Math.max(8, rect.top - height - 6) : rect.bottom + 6;
      const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);

      setLangMenu({
        pos,
        top,
        left,
        current: codeLangLabel(editor.state.doc.nodeAt(pos)?.attrs.language as string | undefined),
      });
    };

    dom.addEventListener("mousedown", onDown, true);
    return () => dom.removeEventListener("mousedown", onDown, true);
  }, [editor]);

  // dismiss the language menu on an outside click, Escape or any scroll
  useEffect(() => {
    if (!langMenu) return;
    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.(".code-lang-menu")) return;
      setLangMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangMenu(null);
    };
    const dismiss = () => setLangMenu(null);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [langMenu]);

  const applyCodeLang = (language: string) => {
    if (!langMenu) return;
    editor
      ?.chain()
      .focus()
      .setNodeSelection(langMenu.pos)
      .updateAttributes("codeBlock", { language })
      .run();
    setLangMenu(null);
  };

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
      coverImage,
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
          onInsertImage={() => setImageOpen(true)}
          onEditCover={() => setCoverOpen(true)}
          hasCover={!!coverImage}
          onInsertTable={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
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

      {coverImage && (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt="Cover preview"
            className="h-12 w-20 shrink-0 rounded-lg border border-border object-cover"
          />
          <div className="min-w-0">
            <p className="text-[12px] font-medium">Cover image</p>
            <p className="truncate text-[11px] text-muted-foreground">{coverImage}</p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setCoverOpen(true)}>
              Change
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove cover image"
              onClick={() => setCoverImage(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
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
        <span className="font-mono">```</span> for a code block and pick its language on the right,
        or <span className="font-mono">/image</span> and <span className="font-mono">/table</span> for
        media. Readers can click any image to open it with a zoom animation. Switch to{" "}
        <span className="font-medium text-foreground">Preview</span> to read the post exactly as your
        readers will.
      </p>

      {editor && (
        <SlashCommandMenu
          editor={editor}
          enabled={mode === "write"}
          keyHandlerRef={slashKeyRef}
          openRef={slashOpenRef}
          onInsertImage={() => setImageOpen(true)}
        />
      )}

      {editor && (
        <ImageDialog
          open={coverOpen}
          heading="Add a cover image"
          showAlt={false}
          onClose={() => setCoverOpen(false)}
          onInsert={({ src }) => {
            setCoverImage(src);
            setCoverOpen(false);
          }}
        />
      )}

      {editor && (
        <ImageDialog
          open={imageOpen}
          onClose={() => setImageOpen(false)}
          onInsert={({ src, alt }) => {
            editor.chain().focus().setImage({ src, alt }).run();
            setImageOpen(false);
          }}
        />
      )}

      {langMenu &&
        createPortal(
          <div
            role="listbox"
            aria-label="Code language"
            className="code-lang-menu fixed z-[110] w-[184px] overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl"
            style={{ top: langMenu.top, left: langMenu.left }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="px-1.5 pb-1 pt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Code language
            </p>
            <div className="max-h-[266px] overflow-y-auto">
              {CODE_LANGS.map((l) => {
                const active = codeLangLabel(l) === langMenu.current;
                return (
                  <button
                    key={l}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyCodeLang(l);
                    }}
                    className={
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-[6px] text-left text-[12.5px] transition-colors " +
                      (active
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-muted")
                    }
                  >
                    <span>{l === "c_cpp" ? "cpp" : l}</span>
                    {active && <Check className="size-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
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
