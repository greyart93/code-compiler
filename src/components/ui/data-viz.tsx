"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────
   Tiny SVG data-viz set. No chart library, no runtime deps:
   everything is theme-aware through CSS custom properties, so
   the same chart works on paper and on obsidian.
   ──────────────────────────────────────────────────────────── */

export function Sparkline({
  values,
  className,
  strokeWidth = 1.6,
}: {
  values: number[];
  className?: string;
  strokeWidth?: number;
}) {
  if (values.length < 2) {
    return <div className={cn("h-8 w-full rounded bg-muted/60", className)} aria-hidden />;
  }
  const w = 120;
  const h = 32;
  const pad = 2;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-8 w-full", className)}
      fill="none"
      aria-hidden
    >
      <polyline
        points={pts.join(" ")}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function AreaChart({
  values,
  labels,
  height = 190,
  suffix = "",
  className,
}: {
  values: number[];
  /** Optional x labels, same length as values. Only first/middle/last are drawn. */
  labels?: string[];
  height?: number;
  suffix?: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  if (!values.length) {
    return (
      <div
        className={cn("grid place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground", className)}
        style={{ height }}
      >
        Nothing recorded yet
      </div>
    );
  }

  const w = 640;
  const h = height;
  const padX = 10;
  const padTop = 18;
  const padBottom = 26;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;

  const x = (i: number) => padX + (i / Math.max(values.length - 1, 1)) * (w - padX * 2);
  const y = (v: number) => padTop + (1 - (v - min) / span) * (h - padTop - padBottom);

  const line = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(values.length - 1).toFixed(1)},${h - padBottom} L${x(0).toFixed(1)},${h - padBottom} Z`;

  const ticks = [0, 0.5, 1].map((t) => min + t * span);
  const labelIdx =
    values.length <= 3
      ? values.map((_, i) => i)
      : [0, Math.floor((values.length - 1) / 2), values.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("w-full", className)}
      role="img"
      aria-label={`Trend of ${values.length} values`}
    >
      <defs>
        <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padX}
            x2={w - padX}
            y1={y(t)}
            y2={y(t)}
            stroke="hsl(var(--border))"
            strokeDasharray={i === 0 ? undefined : "3 4"}
          />
          <text x={w - padX} y={y(t) - 5} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 9 }}>
            {Math.round(t)}{suffix}
          </text>
        </g>
      ))}

      <path d={area} fill={`url(#area-${uid})`} />
      <path
        d={line}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 3.4 : 2} fill="hsl(var(--primary))">
          <title>{`${labels?.[i] ?? `#${i + 1}`}: ${v}${suffix}`}</title>
        </circle>
      ))}

      {labels &&
        labelIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={h - 8}
            textAnchor={i === 0 ? "start" : i === values.length - 1 ? "end" : "middle"}
            className="fill-muted-foreground"
            style={{ fontSize: 9 }}
          >
            {labels[i]}
          </text>
        ))}
    </svg>
  );
}

export function Ring({
  value,
  size = 132,
  stroke = 10,
  label,
  sublabel,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="kpi-num text-[26px]">{label ?? `${Math.round(pct)}%`}</div>
          {sublabel && <div className="mono-label mt-1 !text-[9px]">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}

export function Bars({
  items,
  max,
  className,
}: {
  items: Array<{ label: string; value: number; hint?: string }>;
  max?: number;
  className?: string;
}) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className={cn("space-y-3.5", className)}>
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="truncate text-[13px] font-medium text-foreground">{item.label}</span>
            <span className="mono-label shrink-0 !text-[10px] tabular-nums">
              {item.hint ?? item.value}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(2, (item.value / top) * 100)}%` }}
            />
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
    </div>
  );
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function Heatmap({
  days,
  weeks = 12,
  className,
}: {
  /** ISO day keys that had activity, e.g. ["2026-10-01", ...] */
  days: string[];
  weeks?: number;
  className?: string;
}) {
  const active = new Set(days);
  const today = new Date();
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const total = weeks * 7;
  const cells = Array.from({ length: total }, (_, i) => {
    const d = new Date(end - (total - 1 - i) * 86_400_000);
    const key = dayKey(d);
    return { key, active: active.has(key), isToday: i === total - 1 };
  });
  const columns = Array.from({ length: weeks }, (_, c) => cells.slice(c * 7, c * 7 + 7));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((cell) => (
              <div
                key={cell.key}
                title={`${cell.key}${cell.active ? " · active" : ""}`}
                className={cn(
                  "size-[11px] shrink-0 rounded-[3px] transition-colors sm:size-[13px]",
                  cell.active ? "bg-primary" : "bg-muted",
                  cell.isToday && "ring-1 ring-foreground/30 ring-offset-1 ring-offset-card"
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="mono-label !text-[9px]">{weeks} weeks</span>
        <span className="flex items-center gap-1.5">
          <span className="mono-label !text-[9px]">Less</span>
          <span className="size-[9px] rounded-[2px] bg-muted" />
          <span className="size-[9px] rounded-[2px] bg-primary/35" />
          <span className="size-[9px] rounded-[2px] bg-primary/65" />
          <span className="size-[9px] rounded-[2px] bg-primary" />
          <span className="mono-label !text-[9px]">More</span>
        </span>
      </div>
    </div>
  );
}
