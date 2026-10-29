"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Terminal,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichContent } from "@/components/rich-content";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const lowlight = createLowlight(common);

const CODE_LANGS = [
  "plaintext",
  "javascript",
  "typescript",
  "python",
  "c_cpp",
  "java",
  "go",
  "rust",
  "php",
  "csharp",
  "lua",
  "kotlin",
  "dart",
  "swift",
  "ruby",
  "bash",
  "html",
  "css",
  "json",
  "sql",
];

const LANGUAGES = [
  "general",
  "javascript",
  "typescript",
  "python",
  "c_cpp",
  "java",
  "go",
  "rust",
  "php",
  "csharp",
  "lua",
  "kotlin",
  "dart",
  "swift",
  "ruby",
  "bash",
  "assembly",
];

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
  const [previewHtml, setPreviewHtml] = useState(initialContent);
  const titleRef = useRef<HTMLTextAreaElement>(null);

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
    },
    shouldRerenderOnTransaction: true,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      setPreviewHtml(e.getHTML());
      // the placeholder is pure CSS, so just tell it whether we're empty
      e.view.dom.setAttribute("data-empty", String(!e.getText().trim()));
    },
    onCreate: ({ editor: e }) => {
      e.view.dom.setAttribute("data-empty", String(!e.getText().trim()));
    },
  });

  const inCodeBlock = editor?.isActive("codeBlock") ?? false;
  const currentCodeLang: string =
    editor?.getAttributes("codeBlock")?.language ?? "plaintext";
  const wordCount = (editor?.getText().trim().match(/\S+/g) ?? []).length;

  // The language chip is pure CSS (see `.medium-article pre:has(> code…)` and
  // the `.medium-editor` equivalents in globals.css) — TipTap puts the language
  // on `code.language-*`, so no DOM syncing is needed here.

  const Btn = ({
    onClick,
    active,
    children,
    label,
    id,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    label: string;
    id?: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      id={id}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={active ? "bg-accent text-accent-foreground" : ""}
    >
      {children}
    </Button>
  );

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

  const setCodeLang = (v: string) =>
    editor?.chain().focus().updateAttributes("codeBlock", { language: v }).run();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* ── toolbar: medium keeps controls in one slim strip ───────────── */}
      <div
        id="editor-toolbar"
        className="sticky top-[76px] z-30 -mx-2 mb-6 flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-card/90 px-2 py-1.5 backdrop-blur"
      >
        <Btn label="Undo" onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2 className="size-4" />
        </Btn>
        <Btn label="Redo" onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn
          label="Bold"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </Btn>
        <Btn
          label="Italic"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </Btn>
        <Btn
          label="Heading 2"
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </Btn>
        <Btn
          label="Heading 3"
          active={editor?.isActive("heading", { level: 3 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-4" />
        </Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn
          label="Bullet list"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </Btn>
        <Btn
          label="Numbered list"
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </Btn>
        <Btn
          label="Blockquote"
          active={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </Btn>
        <Btn
          label="Inline code"
          active={editor?.isActive("code")}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <span className="font-mono text-xs">{"</>"}</span>
        </Btn>
        <Btn
          label="Code block"
          id="editor-code-block-btn"
          active={inCodeBlock}
          onClick={() => {
            editor?.chain().focus().toggleCodeBlock().run();
            // give new code blocks a sensible default language
            if (!editor?.isActive("codeBlock")) return;
            const lang = editor.getAttributes("codeBlock")?.language;
            if (!lang) {
              editor
                .chain()
                .focus()
                .updateAttributes("codeBlock", { language: "javascript" })
                .run();
            }
          }}
        >
          <Terminal className="size-4" />
        </Btn>

        <span className="mx-1 h-5 w-px bg-border" />
        {/* Write / Preview — see the post exactly as readers will */}
        <div className="flex items-center gap-0.5" id="editor-preview-toggle">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMode("write")}
            className={mode === "write" ? "bg-accent text-accent-foreground" : ""}
          >
            Write
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={mode === "preview"}
            onClick={() => setMode("preview")}
            className={mode === "preview" ? "bg-accent text-accent-foreground" : ""}
          >
            <Eye className="size-4" /> Preview
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {mode === "write" && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
          )}
          {/* language for the code block the cursor is in */}
          {mode === "write" && inCodeBlock && (
            <Select value={currentCodeLang} onValueChange={setCodeLang}>
              <SelectTrigger
                id="editor-code-lang"
                className="h-8 w-[140px] text-xs"
                title="Language for this code block"
              >
                <Code className="mr-1 size-3.5 text-muted-foreground" />
                <SelectValue placeholder="block lang" />
              </SelectTrigger>
              <SelectContent>
                {CODE_LANGS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l === "c_cpp" ? "cpp" : l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* the post's topic */}
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger
              id="editor-topic"
              className="h-8 w-[130px] text-xs"
              title="Post topic"
            >
              <SelectValue placeholder="topic" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>
                  {l === "general" ? "General" : l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── the writing surface: title first, then the body ───────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
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

      <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
        Tip: press the terminal button (or type <span className="font-mono">```</span> then Enter) for a
        highlighted code block and pick its language on the right. Switch to{" "}
        <span className="font-medium text-foreground">Preview</span> to read the post exactly as your
        readers will.
      </p>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
        <Button type="submit" id="editor-publish" disabled={busy} className="min-w-[132px]">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
        <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">
          Autosaved to your account when you publish
        </span>
      </div>
    </form>
  );
}

