import Link from "next/link";
import { cn } from "@/lib/utils";

/* Shared editorial building blocks used across the app shell. */

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mono-label", className)}>{children}</p>;
}

export function PageHead({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-border pb-8", className)}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 max-w-[860px]">
          {eyebrow && <p className="mono-label">{eyebrow}</p>}
          <h1 className="display mt-3 text-[clamp(38px,6vw,76px)] text-foreground">{title}</h1>
          {description && (
            <p className="mt-4 max-w-[64ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function SectionHead({
  index,
  title,
  count,
  action,
  className,
}: {
  index?: string;
  title: React.ReactNode;
  count?: number | string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3", className)}>
      <div className="flex items-baseline gap-3">
        {index && <span className="mono-label">{index}</span>}
        <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
        {count !== undefined && <span className="mono-label !text-[10px]">{count}</span>}
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent = false,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("p-5", className)}>
      <p className="mono-label">{label}</p>
      <p className={cn("kpi-num mt-3 text-[38px] text-foreground sm:text-[42px]", accent && "text-primary")}>{value}</p>
      {hint && <p className="mt-2 text-[12px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Empty({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
      )}
      <p className="mt-4 text-base font-semibold text-foreground">{title}</p>
      {body && <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({
  name,
  image,
  size = 40,
  className,
}: {
  name?: string | null;
  image?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = (name ?? "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary/12 font-semibold text-primary",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.32) }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

export function Tag({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "accent" | "success" | "warn" | "danger";
  className?: string;
}) {
  const tones = {
    default: "border-border bg-muted/60 text-muted-foreground",
    accent: "border-primary/25 bg-primary/10 text-primary",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warn: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "border-destructive/25 bg-destructive/10 text-destructive",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ArrowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground transition-colors hover:text-primary",
        className
      )}
    >
      {children}
      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
