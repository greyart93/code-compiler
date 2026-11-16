"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ComponentProps, MouseEvent } from "react";
import { openBlogPost, prefetchBlogPost } from "@/lib/blog-navigation";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  postId: string;
};

export function BlogPostLink({
  postId,
  href,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  ...props
}: Props) {
  const router = useRouter();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHover = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  useEffect(() => cancelHover, []);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    cancelHover();
    onClick?.(event);
    if (event.defaultPrevented) return;

    // Leave modified clicks, downloads and new tabs to the browser.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const target = event.currentTarget.getAttribute("target");
    if ((target && target !== "_self") || event.currentTarget.hasAttribute("download")) {
      return;
    }

    event.preventDefault();
    void openBlogPost(postId, href, (url) =>
      router.push(url, { transitionTypes: ["blog-forward"] })
    );
  }

  return (
    <Link
      {...props}
      href={href}
      onClick={handleClick}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        // Only warm a card the pointer actually settles on; sweeping across
        // the archive cancels each timer before it can fire.
        cancelHover();
        hoverTimer.current = setTimeout(() => {
          hoverTimer.current = null;
          prefetchBlogPost(postId);
        }, 120);
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        cancelHover();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        prefetchBlogPost(postId);
      }}
    />
  );
}
