"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Image as ImageIcon,
  Link2,
  Loader2,
  SquareCode,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { uploadImageFile } from "@/lib/upload-image";
import { isVideoUrl } from "@/components/video-player";
import { VideoUpload } from "@/components/video-upload";
import { cn } from "@/lib/utils";

type SlashId = "image" | "code" | "link" | "video";
type SlashState = { from: number; to: number; query: string };
type DialogKind = "code" | "link" | "video";

const COMMANDS: { id: SlashId; label: string; hint: string; icon: typeof ImageIcon }[] = [
  { id: "image", label: "Image", hint: "Upload a screenshot", icon: ImageIcon },
  { id: "code", label: "Code block", hint: "Language, copy button", icon: SquareCode },
  { id: "link", label: "Link", hint: "URL with a label", icon: Link2 },
  { id: "video", label: "Video", hint: "Upload or YouTube", icon: Video },
];

const CODE_LANGS = [
  "plaintext",
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "json",
  "sql",
  "bash",
  "java",
  "go",
  "rust",
  "cpp",
  "csharp",
  "php",
  "ruby",
];

function slashAt(value: string, caret: number): SlashState | null {
  const before = value.slice(0, caret);
  const lineStart = before.lastIndexOf("\n") + 1;
  const line = before.slice(lineStart);
  const match = /^\s*\/([a-z]*)$/i.exec(line);
  if (!match) return null;
  // A slash inside an unclosed fence is code, not a command.
  if (((before.match(/```/g) ?? []).length & 1) === 1) return null;
  return {
    from: lineStart + line.lastIndexOf("/"),
    to: caret,
    query: match[1].toLowerCase(),
  };
}

export function DiscussComposer({
  value,
  onChange,
  placeholder,
  minHeight = 220,
  id,
  autoFocus,
  disabled,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  id?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [slash, setSlash] = useState<SlashState | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [videoMode, setVideoMode] = useState<"upload" | "link">("upload");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [error, setError] = useState<string | null>(null);

  const commands = slash
    ? COMMANDS.filter(
        (command) =>
          command.label.toLowerCase().includes(slash.query) ||
          command.id.startsWith(slash.query)
      )
    : [];

  const syncSlash = () => {
    const el = textareaRef.current;
    if (!el) return;
    setSlash(slashAt(el.value, el.selectionStart ?? 0));
  };

  const handleChange = (next: string, caret: number) => {
    onChange(next);
    setSlash(slashAt(next, caret));
    setSlashIndex(0);
  };

  const insertInline = (snippet: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    setSlash(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  const insertBlock = (snippet: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const lead = !before ? "" : before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const trail = !after ? "" : after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    const next = before + lead + snippet + trail + after;
    onChange(next);
    setSlash(null);
    const caret = start + lead.length + snippet.length;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };

  const stripSlash = () => {
    if (!slash) return;
    onChange(value.slice(0, slash.from) + value.slice(slash.to));
    setSlash(null);
  };

  const openDialog = (kind: DialogKind) => {
    setError(null);
    setUrl("");
    setLabel("");
    setCode("");
    setLanguage("javascript");
    setVideoMode("upload");
    setDialog(kind);
  };

  const begin = (kind: SlashId) => {
    stripSlash();
    if (kind === "image") {
      fileRef.current?.click();
      return;
    }
    openDialog(kind);
  };

  const upload = async (file: File | undefined | null) => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const mediaUrl = await uploadImageFile(file);
      const alt = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").slice(0, 90);
      insertBlock(`![${alt}](${mediaUrl})`);
      toast("Image attached", { variant: "success" });
    } catch (uploadError) {
      toast(uploadError instanceof Error ? uploadError.message : "Upload failed", {
        variant: "error",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submitDialog = () => {
    setError(null);
    // The upload tab finishes by itself and inserts the video when Mux is ready.
    if (dialog === "video" && videoMode === "upload") return;
    if (dialog === "code") {
      const fence = "```" + (language || "plaintext") + "\n" + code.replace(/\s+$/, "") + "\n```";
      insertBlock(fence);
      setDialog(null);
      return;
    }

    const clean = url.trim();
    if (!clean) {
      setError("Paste a URL first.");
      return;
    }

    if (dialog === "video") {
      if (!isVideoUrl(clean)) {
        setError("Use a YouTube, Vimeo, Mux or direct MP4/WebM link.");
        return;
      }
      insertBlock(`[${label.trim() || "Watch the video"}](${clean})`);
      setDialog(null);
      return;
    }

    if (!/^(https?:\/\/|mailto:|\/)/i.test(clean)) {
      setError("Use an https:// link, a mailto: link, or a path starting with /.");
      return;
    }
    insertInline(`[${label.trim() || clean}](${clean})`);
    setDialog(null);
  };

  useEffect(() => {
    if (!dialog) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDialog(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      stripSlash();
      openDialog("link");
      return;
    }

    if (!slash || commands.length === 0) return;
    const last = commands.length - 1;
    const active = Math.min(slashIndex, last);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSlashIndex(active === last ? 0 : active + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSlashIndex(active === 0 ? last : active - 1);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      begin(commands[active].id);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setSlash(null);
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-input bg-card transition-colors focus-within:border-foreground/30",
        disabled && "opacity-60"
      )}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => void upload(event.target.files?.[0])}
      />

      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
        <ToolButton label="Attach image" onClick={() => begin("image")} disabled={uploading}>
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
          {uploading ? "Uploading…" : "Image"}
        </ToolButton>
        <ToolButton label="Insert link" onClick={() => begin("link")}>
          <Link2 className="size-3.5" /> Link
        </ToolButton>
        <ToolButton label="Insert code block" onClick={() => begin("code")}>
          <SquareCode className="size-3.5" /> Code
        </ToolButton>
        <ToolButton label="Insert video" onClick={() => begin("video")}>
          <Video className="size-3.5" /> Video
        </ToolButton>
        {!compact && (
          <span className="mono-label ml-auto hidden !text-[9px] sm:inline">
            / for image · code · link · video
          </span>
        )}
      </div>

      <div className="relative">
        <Textarea
          id={id}
          ref={textareaRef}
          value={value}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(event) => handleChange(event.target.value, event.target.selectionStart ?? 0)}
          onKeyDown={onKeyDown}
          onKeyUp={syncSlash}
          onClick={syncSlash}
          onSelect={syncSlash}
          onBlur={() => setSlash(null)}
          onPaste={(event) => {
            const file = Array.from(event.clipboardData.files).find((item) =>
              item.type.startsWith("image/")
            );
            if (file) {
              event.preventDefault();
              void upload(file);
            }
          }}
          onDrop={(event) => {
            const file = Array.from(event.dataTransfer.files).find((item) =>
              item.type.startsWith("image/")
            );
            if (file) {
              event.preventDefault();
              void upload(file);
            }
          }}
          placeholder={placeholder}
          style={{ minHeight }}
          className="rounded-none border-0 bg-transparent font-mono text-[13px] leading-relaxed focus-visible:ring-0"
        />

        {slash && commands.length > 0 && (
          <div
            role="listbox"
            aria-label="Insert block"
            className="absolute bottom-2 left-2 z-30 w-[260px] overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl"
          >
            {commands.map((command, index) => {
              const Icon = command.icon;
              const active = index === Math.min(slashIndex, commands.length - 1);
              return (
                <button
                  key={command.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    begin(command.id);
                  }}
                  onMouseEnter={() => setSlashIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-70" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium">{command.label}</span>
                    <span className="block text-[10.5px] text-muted-foreground">{command.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-1.5">
        <p className="text-[10.5px] text-muted-foreground">
          Markdown supported · code fences get copy + language
        </p>
        <span className="mono-label !text-[8.5px]">⌘K link</span>
      </div>

      {dialog &&
        createPortal(
          <div
            role="presentation"
            onMouseDown={() => setDialog(null)}
            className="fixed inset-0 z-[110] flex items-start justify-center bg-black/40 p-4 pt-[10vh] backdrop-blur-sm"
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                submitDialog();
              }}
              onMouseDown={(event) => event.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <p className="flex items-center gap-2 text-[13px] font-semibold">
                  {dialog === "code" ? (
                    <SquareCode className="size-4 text-primary" />
                  ) : dialog === "video" ? (
                    <Video className="size-4 text-primary" />
                  ) : (
                    <Link2 className="size-4 text-primary" />
                  )}
                  {dialog === "code" ? "Insert code block" : dialog === "video" ? "Embed video" : "Insert link"}
                </p>
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  aria-label="Close"
                  className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid gap-3 px-4 py-4">
                {dialog === "code" ? (
                  <>
                    <label className="grid gap-1.5">
                      <span className="mono-label">Language</span>
                      <select
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                        className="h-9 rounded-lg border border-border bg-background px-2.5 text-[13px] outline-none focus:border-primary/60"
                      >
                        {CODE_LANGS.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="mono-label">Code</span>
                      <textarea
                        autoFocus
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        rows={8}
                        placeholder="Paste the snippet…"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-[12.5px] outline-none focus:border-primary/60"
                      />
                    </label>
                  </>
                ) : dialog === "video" ? (
                  <>
                    <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/30 p-1">
                      {(
                        [
                          ["upload", "Upload"],
                          ["link", "Link"],
                        ] as const
                      ).map(([mode, text]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setVideoMode(mode);
                            setError(null);
                          }}
                          className={cn(
                            "h-7 rounded-md text-[12px] font-medium transition-colors",
                            videoMode === mode
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {text}
                        </button>
                      ))}
                    </div>

                    <label className="grid gap-1.5">
                      <span className="mono-label">Title (optional)</span>
                      <input
                        autoFocus={videoMode === "upload"}
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                        placeholder="Walkthrough of the fix"
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-primary/60"
                      />
                    </label>

                    {videoMode === "upload" ? (
                      <VideoUpload
                        title={label}
                        compact
                        onUploaded={(video) => {
                          const title = (label.trim() || video.title || "Watch the video")
                            .replace(/[[\]]/g, "")
                            .slice(0, 120);
                          insertBlock(
                            `[${title}](https://stream.mux.com/${video.playbackId}.m3u8)`
                          );
                          setDialog(null);
                          toast("Video attached", { variant: "success" });
                        }}
                      />
                    ) : (
                      <>
                        <label className="grid gap-1.5">
                          <span className="mono-label">Video URL</span>
                          <input
                            autoFocus
                            value={url}
                            onChange={(event) => {
                              setUrl(event.target.value);
                              setError(null);
                            }}
                            placeholder="https://youtube.com/watch?v=… or https://…/clip.mp4"
                            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-primary/60"
                          />
                        </label>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          YouTube, Vimeo, Mux HLS and MP4/WebM links play in the same Video.js
                          viewer. Google Drive links are not supported.
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <label className="grid gap-1.5">
                      <span className="mono-label">URL</span>
                      <input
                        autoFocus
                        value={url}
                        onChange={(event) => {
                          setUrl(event.target.value);
                          setError(null);
                        }}
                        placeholder="https://… or /dashboard"
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-primary/60"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="mono-label">Label (optional)</span>
                      <input
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                        placeholder="Read the docs"
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-primary/60"
                      />
                    </label>
                  </>
                )}

                {error && <p className="text-[12px] text-destructive">{error}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                {!(dialog === "video" && videoMode === "upload") && (
                  <Button type="submit" size="sm">
                    Insert
                  </Button>
                )}
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      {children}
    </button>
  );
}
