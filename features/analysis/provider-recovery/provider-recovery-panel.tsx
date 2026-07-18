"use client";

import { useEffect, useRef } from "react";
import { Button } from "../../../components/ui";

export type AnalysisServiceUnavailableProps = {
  onRetry?: () => void;
  retryPending?: boolean;
};

export function AnalysisServiceUnavailable({
  onRetry,
  retryPending = false,
}: AnalysisServiceUnavailableProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="analysis-service-unavailable-heading"
      className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] p-4"
      role="alert"
    >
      <h3
        className="cfn-type-heading-3 outline-none"
        id="analysis-service-unavailable-heading"
        ref={headingRef}
        tabIndex={-1}
      >
        Analysis service unavailable
      </h3>
      <p>
        Analysis cannot start right now. No analysis request was sent, and your saved case work is
        unchanged.
      </p>
      {onRetry ? (
        <div>
          <Button disabled={retryPending} onClick={onRetry}>
            {retryPending ? "Checking availability…" : "Check availability again"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
