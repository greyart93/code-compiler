"use client";
import type { CardComponentProps } from "nextstepjs";

/**
 * The library's default card is hardcoded white with a blue progress bar, which
 * looks broken in CodeVit's dark theme. This card uses the app's own tokens so
 * the tour matches the product it is explaining.
 */
export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) {
  const isLast = currentStep === totalSteps - 1;
  const pct = ((currentStep + 1) / totalSteps) * 100;

  // The library's card wrapper uses `min-width: min-content`, which shrink-wraps
  // the card to its longest word — so set an explicit width here instead of
  // relying on max-w alone. Capped for small viewports.
  return (
    <div className="w-96 max-w-[calc(100vw-3rem)] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-2xl">
      <div className="mb-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug">
            {typeof step.icon === "string" ? (
              <span className="mr-1.5">{step.icon}</span>
            ) : null}
            {step.title}
          </h2>
        </div>
        {skipTour && (
          <button
            type="button"
            onClick={skipTour}
            aria-label="Skip tour"
            className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Skip
          </button>
        )}
      </div>

      <div className="text-sm leading-relaxed text-muted-foreground">
        {step.content}
      </div>

      {/* progress */}
      <div
        className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStep + 1}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          Back
        </button>
        <span className="text-xs tabular-nums text-muted-foreground">
          {currentStep + 1} of {totalSteps}
        </span>
        <button
          type="button"
          onClick={nextStep}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {isLast ? "Finish" : "Next"}
        </button>
      </div>

      {/* NextStep anchors this at the card edge; keep it non-interactive */}
      <div className="pointer-events-none absolute -z-10" aria-hidden>
        {arrow}
      </div>
    </div>
  );
}