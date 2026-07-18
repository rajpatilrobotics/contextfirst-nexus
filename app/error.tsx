"use client";

import { useEffect, useRef } from "react";

export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 text-[var(--color-ink)] sm:px-6">
      <section
        aria-labelledby="route-error-heading"
        className="mx-auto grid max-w-3xl gap-4 rounded-[var(--radius-card)] border border-[var(--color-danger)] bg-[var(--color-surface)] p-5"
        role="alert"
      >
        <p className="cfn-type-label text-[var(--color-danger)]">Route could not be displayed</p>
        <h1 className="cfn-type-heading-1" id="route-error-heading" ref={headingRef} tabIndex={-1}>
          Review the route again
        </h1>
        <p>
          This screen hides technical diagnostics, source text, service details, credentials, and stack traces. Your browser-held demo case state has not been exported from this error view.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className="cfn-control-target inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold !text-white hover:bg-[var(--color-brand-hover)]"
            onClick={reset}
            type="button"
          >
            Retry route
          </button>
          <a
            className="cfn-control-target inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-subtle)]"
            href="/case/demo/purpose"
          >
            Return to Purpose
          </a>
        </div>
      </section>
    </main>
  );
}
