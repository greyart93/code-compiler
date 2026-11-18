import { cn } from "@/lib/utils";

/**
 * Renders a practice-library problem statement: paragraphs, **bold**, `code`
 * and fenced blocks. Shared by the practice page and the interview's coding
 * round so a brief reads the same in both places.
 */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em] text-foreground">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function ProblemStatement({ text, className }: { text: string; className?: string }) {
  const blocks = text.replace(/\r/g, "").split(/```/);
  return (
    <div className={cn("grid gap-2 text-[13.5px] leading-relaxed text-foreground/90", className)}>
      {blocks.map((block, index) => {
        if (index % 2 === 1) {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-[11.5px] leading-relaxed"
            >
              {block.replace(/^\n|\n$/g, "")}
            </pre>
          );
        }
        return block
          .split("\n")
          .filter((line) => line.trim())
          .map((line, i) => (
            <p key={`${index}-${i}`}>
              <Inline text={line} />
            </p>
          ));
      })}
    </div>
  );
}
