"use client";

import { Fragment } from "react";

/**
 * Renders user post bodies safely: plain text with ```lang fenced code blocks.
 * Text is escaped by React; code blocks render as <pre>.
 */
export function PostBody({ body }: { body: string }) {
  const parts = body.split(/```/);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          // fenced code block — first line may be a language tag
          <pre
            key={i}
            className="overflow-x-auto rounded-md bg-muted/60 p-3 font-mono text-[13px] leading-relaxed"
          >
            {part.replace(/^[a-zA-Z0-9+#-]*\n/, "")}
          </pre>
        ) : (
          <Fragment key={i}>
            {part.split(/\n/).map((line, j, arr) => (
              <Fragment key={j}>
                {line}
                {j < arr.length - 1 && <br />}
              </Fragment>
            ))}
          </Fragment>
        )
      )}
    </div>
  );
}
