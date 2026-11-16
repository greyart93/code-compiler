"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { useEditorState, type Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  SquareCode,
  Table,
  Type,
} from "lucide-react";

/**
 * Slash menu for the essay editor.
 *
 * Typing `/` at the start of an empty block opens a command list (the thing
 * Notion/Riddled do). Picking a command deletes the typed `/query` and applies
 * the block type.
 *
 * This is a leaf subscriber: it reads the editor through `useEditorState`, so a
 * keystroke re-renders this component (which usually renders null) instead of
 * the whole form and toolbar.
 */

type SlashCommandId =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "bullet"
  | "ordered"
  | "quote"
  | "code"
  | "image"
  | "table"
  | "divider";

interface SlashCommand {
  id: SlashCommandId;
  label: string;
  /** extra words the fuzzy filter should answer to */
  keywords: string[];
  icon: LucideIcon;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { id: "text", label: "Text", keywords: ["paragraph", "body", "plain"], icon: Type },
  { id: "h1", label: "Heading 1", keywords: ["h1", "title", "big"], icon: Heading1 },
  { id: "h2", label: "Heading 2", keywords: ["h2", "section", "subtitle"], icon: Heading2 },
  { id: "h3", label: "Heading 3", keywords: ["h3", "section", "small"], icon: Heading3 },
  { id: "h4", label: "Heading 4", keywords: ["h4", "small"], icon: Heading4 },
  { id: "bullet", label: "Bulleted list", keywords: ["ul", "bullet", "list", "unordered"], icon: List },
  {
    id: "ordered",
    label: "Numbered list",
    keywords: ["ol", "number", "list", "ordered"],
    icon: ListOrdered,
  },
  { id: "quote", label: "Quote", keywords: ["blockquote", "citation"], icon: Quote },
  {
    id: "code",
    label: "Code block",
    keywords: ["code", "snippet", "pre"],
    icon: SquareCode,
  },
  {
    id: "image",
    label: "Image",
    keywords: ["image", "img", "picture", "photo", "figure"],
    icon: ImageIcon,
  },
  {
    id: "table",
    label: "Table",
    keywords: ["table", "grid", "rows", "columns", "data"],
    icon: Table,
  },
  { id: "divider", label: "Divider", keywords: ["hr", "rule", "separator", "line"], icon: Minus },
];

export interface SlashState {
  /** start of the `/query` text we will replace */
  from: number;
  /** caret position, i.e. the end of the query */
  to: number;
  query: string;
  /** viewport coords of the caret line, used to place the popup */
  caretTop: number;
  caretBottom: number;
  left: number;
}

/** What the user has typed so far, but only when it is a block-level slash. */
function readSlashState(editor: Editor): SlashState | null {
  const { state, view } = editor;
  const { $from, empty } = state.selection;
  if (!empty) return null;

  const parent = $from.parent;
  // code blocks own the slash character; headings can be converted
  if (!parent.isTextblock || parent.type.name === "codeBlock") return null;

  const before = parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
  const match = /^\s*\/([a-z0-9]{0,24})$/i.exec(before);
  if (!match) return null;

  let coords: { left: number; top: number; bottom: number };
  try {
    coords = view.coordsAtPos($from.pos);
  } catch {
    return null;
  }

  return {
    from: $from.start() + before.lastIndexOf("/"),
    to: $from.pos,
    query: match[1].toLowerCase(),
    caretTop: coords.top,
    caretBottom: coords.bottom,
    left: coords.left,
  };
}

function filterCommands(query: string): SlashCommand[] {
  if (!query) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(query) ||
      c.keywords.some((k) => k.startsWith(query)),
  );
}

type SlashKeyHandler = (view: unknown, event: KeyboardEvent) => boolean;

interface SlashCommandMenuProps {
  editor: Editor;
  enabled: boolean;
  /** the form's `editorProps.handleKeyDown` delegates here */
  keyHandlerRef: RefObject<SlashKeyHandler | null>;
  /** lets the form know whether Escape belongs to this menu */
  openRef: RefObject<boolean>;
  onInsertImage?: () => void;
}

export function SlashCommandMenu({
  editor,
  enabled,
  keyHandlerRef,
  openRef,
  onInsertImage,
}: SlashCommandMenuProps) {
  // deepEqual by default, so this only re-renders when the trigger or the
  // caret's screen position actually changes.
  const detected = useEditorState({
    editor,
    selector: ({ editor: e }) => (enabled ? readSlashState(e) : null),
  });
  const key = detected ? `${detected.from}:${detected.query}` : null;

  // Escape (and picking a command) hide the list for this exact query; typing
  // anything changes the key, which reopens it.
  const [dismissed, setDismissed] = useState<string | null>(null);
  const state = detected && dismissed !== key ? detected : null;

  // once the slash is gone (applied, deleted) the latch clears for the next one
  useEffect(() => {
    if (key === null) setDismissed(null);
  }, [key]);

  const [index, setIndex] = useState(0);
  const [lastKey, setLastKey] = useState<string | null>(key);
  if (key !== lastKey) {
    setLastKey(key);
    setIndex(0);
  }

  // The popup is fixed to the caret, so keep re-measuring while the page (or
  // the mobile keyboard inset) moves under it instead of letting it drift.
  const [, remeasure] = useReducer((n: number) => n + 1, 0);
  const open = state !== null;
  useEffect(() => {
    if (!open) return;
    const onMove = () => remeasure();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    window.visualViewport?.addEventListener("scroll", onMove);
    window.visualViewport?.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      window.visualViewport?.removeEventListener("scroll", onMove);
      window.visualViewport?.removeEventListener("resize", onMove);
    };
  }, [open]);

  const items = useMemo(() => filterCommands(state?.query ?? ""), [state?.query]);

  const apply = (item: SlashCommand) => {
    if (!state) return;
    // the image dialog takes over from here, so drop the typed `/image` first
    if (item.id === "image") {
      editor.chain().focus().deleteRange({ from: state.from, to: state.to }).run();
      setDismissed(key);
      onInsertImage?.();
      return;
    }
    const chain = editor.chain().focus().deleteRange({ from: state.from, to: state.to });
    switch (item.id) {
      case "text":
        chain.setParagraph().run();
        break;
      case "h1":
        chain.setHeading({ level: 1 }).run();
        break;
      case "h2":
        chain.setHeading({ level: 2 }).run();
        break;
      case "h3":
        chain.setHeading({ level: 3 }).run();
        break;
      case "h4":
        chain.setHeading({ level: 4 }).run();
        break;
      case "bullet":
        chain.toggleBulletList().run();
        break;
      case "ordered":
        chain.toggleOrderedList().run();
        break;
      case "quote":
        chain.toggleBlockquote().run();
        break;
      case "code":
        chain.setCodeBlock({ language: "javascript" }).run();
        break;
      case "table":
        chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case "divider":
        chain.setHorizontalRule().run();
        break;
    }
    setDismissed(key);
  };

  // read by editorProps.handleKeyDown, so the menu gets first refusal on
  // arrows/Enter/Escape before the editor acts on them
  keyHandlerRef.current = (_view: unknown, event: KeyboardEvent): boolean => {
    if (!state || items.length === 0) return false;
    const last = items.length - 1;
    const safeIndex = Math.min(index, last);
    switch (event.key) {
      case "ArrowDown":
        setIndex(safeIndex === last ? 0 : safeIndex + 1);
        return true;
      case "ArrowUp":
        setIndex(safeIndex === 0 ? last : safeIndex - 1);
        return true;
      case "Enter":
      case "Tab":
        apply(items[safeIndex]);
        return true;
      case "Escape":
        setDismissed(key);
        return true;
      default:
        return false;
    }
  };
  openRef.current = open;

  if (!state) return null;

  const width = 258;
  const viewportH = window.visualViewport?.height ?? window.innerHeight;
  const viewportW = window.visualViewport?.width ?? window.innerWidth;
  const left = Math.min(Math.max(8, state.left), Math.max(8, viewportW - width - 12));

  // sit just under the caret, or above it when the list would run off screen
  const spaceBelow = viewportH - state.caretBottom - 12;
  const spaceAbove = state.caretTop - 12;
  const above = spaceBelow < 240 && spaceAbove > spaceBelow;
  const available = above ? spaceAbove : spaceBelow;
  // keep the whole list readable where it fits, and scroll where it cannot
  const maxHeight = Math.max(140, Math.min(392, available));
  const position = above
    ? { bottom: viewportH - state.caretTop + 6, left }
    : { top: state.caretBottom + 6, left };

  // Portalled to <body>: the editor sits inside animated wrappers whose
  // leftover `transform` would otherwise become the containing block for
  // position: fixed and throw the menu far away from the caret.
  return createPortal(
    <div
      role="listbox"
      aria-label="Insert block"
      style={{ ...position, width, maxHeight }}
      className="fixed z-[80] overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover p-1.5 shadow-xl"
    >
      {items.length === 0 ? (
        <p className="px-2.5 py-2 text-[12.5px] text-muted-foreground">
          No block matches “{state.query}”
        </p>
      ) : (
        items.map((item, i) => {
          const Icon = item.icon;
          const active = i === Math.min(index, items.length - 1);
          return (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={active}
              onMouseDown={(e) => {
                // keep the caret where it is, then apply
                e.preventDefault();
                apply(item);
              }}
              onMouseEnter={() => setIndex(i)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13.5px] transition-colors ${
                active ? "bg-accent text-accent-foreground" : "text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0 opacity-70" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })
      )}
    </div>,
    document.body,
  );
}
