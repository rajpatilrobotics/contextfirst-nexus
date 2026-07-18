export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-labelledby="loading-heading"
      className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 text-[var(--color-ink)] sm:px-6"
    >
      <section className="mx-auto grid max-w-3xl gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="cfn-type-label text-[var(--color-ink-muted)]">Loading demo workspace</p>
        <h1 className="cfn-type-heading-1" id="loading-heading">
          Preparing the next safe view
        </h1>
        <p role="status">
          Loading the requested route. No provider request starts from this state.
        </p>
      </section>
    </div>
  );
}
