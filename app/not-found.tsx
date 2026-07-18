import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 text-[var(--color-ink)] sm:px-6">
      <section className="mx-auto grid max-w-3xl gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="cfn-type-label text-[var(--color-ink-muted)]">Route not found</p>
        <h1 className="cfn-type-heading-1">This page is not part of the hackathon demo</h1>
        <p>
          The enabled prototype routes are the landing page, the bundled case workspace, and Trust and Safety. This page did not load or process any case material.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="cfn-control-target inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold !text-white no-underline hover:bg-[var(--color-brand-hover)]"
            href="/case/demo/purpose"
          >
            Open demo case
          </Link>
          <Link
            className="cfn-control-target inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-subtle)]"
            href="/trust"
          >
            Trust and Safety
          </Link>
        </div>
      </section>
    </main>
  );
}
