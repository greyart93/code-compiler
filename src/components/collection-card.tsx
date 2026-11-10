import Link from "next/link";
import { Folder, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type CollectionPreview = {
  id: string;
  title: string;
  language: string;
  excerpt: string;
};

export type CollectionSummary = {
  id: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  count: number;
  previews: CollectionPreview[];
};

/**
 * Folder tile for /collections and profile pages: a 2×2 mosaic of the snippets
 * inside, CodePen-style, with the folder name underneath.
 */
export function CollectionCard({
  collection,
  showVisibility = false,
  className,
}: {
  collection: CollectionSummary;
  showVisibility?: boolean;
  className?: string;
}) {
  const panes = [...collection.previews];
  const hidden = collection.count - panes.length;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className={cn("group block", className)}
      aria-label={`Open folder ${collection.name}`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_44px_rgba(10,10,11,0.1)]">
        <div className="grid h-[168px] grid-cols-2 grid-rows-2 gap-px bg-border sm:h-[176px]">
          {[0, 1, 2, 3].map((slot) => {
            const preview = panes[slot];
            if (!preview) {
              return (
                <div
                  key={slot}
                  className="flex items-center justify-center bg-muted/40 text-muted-foreground/40"
                >
                  <Folder className="size-5" />
                </div>
              );
            }
            return (
              <div key={preview.id} className="code-pane relative overflow-hidden !rounded-none">
                <pre className="!p-2.5 text-[9.5px] leading-[1.5]">{preview.excerpt}</pre>
                <span className="mono-label absolute inset-x-1.5 bottom-1 truncate !text-[7.5px] !text-white/35">
                  {preview.language}
                </span>
              </div>
            );
          })}
        </div>

        {hidden > 0 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-[var(--ink)]/90 px-2.5 py-1 text-[10.5px] font-semibold text-[var(--paper)] backdrop-blur">
            {hidden} more →
          </span>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold tracking-[-0.01em] transition-colors group-hover:text-primary">
            {collection.name}
          </p>
          <p className="mono-label mt-0.5 !text-[9px]">
            {collection.count} snippet{collection.count === 1 ? "" : "s"}
          </p>
        </div>
        {showVisibility && (
          <span
            title={collection.isPublic ? "Public folder" : "Private folder"}
            className="mt-0.5 shrink-0 text-muted-foreground"
          >
            {collection.isPublic ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}
          </span>
        )}
      </div>
    </Link>
  );
}
