"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { prefetch } from "@/lib/api-cache";

/**
 * A link into the playground that starts loading the snippet on hover/focus.
 *
 * Opening a snippet used to paint the default Python starter first and swap in
 * the real code a moment later; warming the payload before the click means the
 * editor mounts once, with the right language and code.
 */
export function SnippetLink({
  id,
  className,
  children,
  ariaLabel,
}: {
  id: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const url = `/api/snippets?id=${id}`;
  return (
    <Link
      href={`/playground?snippet=${id}`}
      className={className}
      aria-label={ariaLabel}
      onPointerEnter={() => prefetch(url)}
      onFocus={() => prefetch(url)}
    >
      {children}
    </Link>
  );
}
