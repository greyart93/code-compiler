"use client";

import { useSyncExternalStore } from "react";
import {
  getRouteProgress,
  getRouteProgressServer,
  subscribeRouteProgress,
} from "@/lib/route-progress";

export function RouteProgress() {
  const { active, value } = useSyncExternalStore(
    subscribeRouteProgress,
    getRouteProgress,
    getRouteProgressServer
  );

  return (
    <div
      aria-hidden={!active}
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[3px]"
    >
      <div
        role="progressbar"
        aria-label="Opening essay"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        className="h-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${value}%`, opacity: active ? 1 : 0 }}
      />
    </div>
  );
}
