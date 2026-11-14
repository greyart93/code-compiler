"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Quote,
  Redo2,
  Terminal,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

/**
 * Toolbar for the essay editor.
 *
 * It subscribes to the editor itself (`useEditorState`, deep-equality by
 * default), so only this strip re-renders when the active marks change — the
 * form and the writing surface stay untouched. The word count is a separate
 * subscriber so a keystroke never re-renders the buttons.
 *
 * `Btn` lives at module scope on purpose: a component defined inside a
 * render gets a new identity every time, which makes React remount the button
 * mid-click (mousedown on the old node, mouseup on the new one) and the click
 * never fires. preventDefault on mousedown keeps the selection alive too.
 */
function Btn({
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
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      id={id}
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={active ? "bg-accent text-accent-foreground" : ""}
    >
      {children}
    </Button>
  );
}

/** Word count is its own subscriber so the toolbar never re-renders for it. */
function EditorWordCount({ editor, className }: { editor: Editor; className?: string }) {
  const words = useEditorState({
    editor,
    selector: ({ editor: e }) => (e.getText().trim().match(/\S+/g) ?? []).length,
  });
  return (
    <span className={className}>
      {words} {words === 1 ? "word" : "words"}
    </span>
  );
}

interface BlogEditorToolbarProps {
  editor: Editor;
  mode: "write" | "preview";
  onModeChange: (mode: "write" | "preview") => void;
  language: string;
  onLanguageChange: (language: string) => void;
  expanded: boolean;
  onToggleFocus: () => void;
}

export function BlogEditorToolbar({
  editor,
  mode,
  onModeChange,
  language,
  onLanguageChange,
  expanded,
  onToggleFocus,
}: BlogEditorToolbarProps) {
  const ui = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      inlineCode: e.isActive("code"),
      codeBlock: e.isActive("codeBlock"),
      codeLang: (e.getAttributes("codeBlock")?.language as string | undefined) ?? "plaintext",
    }),
  });

  const setCodeLang = (v: string) =>
    editor.chain().focus().updateAttributes("codeBlock", { language: v }).run();


  return (
    <div
      id="editor-toolbar"
      className={cn(
        "z-30 flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-card/90 px-2 py-1.5 backdrop-blur",
        expanded ? "mb-3 shrink-0" : "sticky top-[76px] -mx-2 mb-6",
      )}
    >
      <Btn label="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="size-4" />
      </Btn>
      <Btn label="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="size-4" />
      </Btn>
      <span className="mx-1 h-5 w-px bg-border" />
      <Btn
        label="Bold"
        active={ui.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </Btn>
      <Btn
        label="Italic"
        active={ui.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </Btn>
      <Btn
        label="Heading 2"
        active={ui.h2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </Btn>
      <Btn
        label="Heading 3"
        active={ui.h3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </Btn>
      <span className="mx-1 h-5 w-px bg-border" />
      <Btn
        label="Bullet list"
        active={ui.bullet}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </Btn>
      <Btn
        label="Numbered list"
        active={ui.ordered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </Btn>
      <Btn
        label="Blockquote"
        active={ui.quote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </Btn>
      <Btn
        label="Inline code"
        active={ui.inlineCode}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <span className="font-mono text-xs">{"</>"}</span>
      </Btn>
      <Btn
        label="Code block"
        id="editor-code-block-btn"
        active={ui.codeBlock}
        onClick={() => {
          editor.chain().focus().toggleCodeBlock().run();
          // give new code blocks a sensible default language
          if (!editor.isActive("codeBlock")) return;
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
          onClick={() => onModeChange("write")}
          className={mode === "write" ? "bg-accent text-accent-foreground" : ""}
        >
          Write
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={mode === "preview"}
          onClick={() => onModeChange("preview")}
          className={mode === "preview" ? "bg-accent text-accent-foreground" : ""}
        >
          <Eye className="size-4" /> Preview
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {mode === "write" && (
          <EditorWordCount
            editor={editor}
            className="hidden text-xs text-muted-foreground sm:inline"
          />
        )}
        {/* language for the code block the cursor is in */}
        {mode === "write" && ui.codeBlock && (
          <Select value={ui.codeLang} onValueChange={setCodeLang}>
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
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger id="editor-topic" className="h-8 w-[130px] text-xs" title="Post topic">
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

        <span className="mx-1 h-5 w-px bg-border" />
        <Btn label={expanded ? "Exit focus mode" : "Focus mode"} onClick={onToggleFocus}>
          {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </Btn>
      </div>
    </div>
  );
}
