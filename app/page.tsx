export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 text-[var(--color-ink)] sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-8">
        <section className="grid gap-5">
          <p className="cfn-type-label text-[var(--color-ink-muted)]">Synthetic practitioner demo</p>
          <h1 className="cfn-type-display">ContextFirst Nexus</h1>
          <p className="cfn-type-body max-w-3xl">
            ContextFirst Nexus helps qualified practitioners prepare source-grounded case
            handoffs for trafficking-related forced criminality review.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              className="cfn-control-target inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-[var(--color-brand-hover)]"
              href="/case/demo/purpose"
            >
              Start demo
            </a>
            <a
              className="cfn-control-target inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-subtle)]"
              href="/trust"
            >
              Trust and Safety
            </a>
          </div>
        </section>

        <section
          aria-labelledby="boundaries-heading"
          className="grid gap-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <h2 className="cfn-type-heading-2" id="boundaries-heading">
            Demo boundaries
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="grid gap-2">
              <h3 className="cfn-type-heading-3">Qualified practitioner audience</h3>
              <p>
                The prototype is for legal aid, public defender, NGO legal, court navigation,
                policy, or research practitioners. It is not authentication or secure access control.
              </p>
            </article>
            <article className="grid gap-2">
              <h3 className="cfn-type-heading-3">Synthetic-only case</h3>
              <p>
                The only enabled case is fictional synthetic adult fixture CFN-DEMO-001. Do not
                upload, paste, or enter real case data.
              </p>
            </article>
            <article className="grid gap-2">
              <h3 className="cfn-type-heading-3">Human decisions stay human</h3>
              <p>
                The product organizes and suggests; a qualified practitioner makes every
                consequential review decision.
              </p>
            </article>
          </div>
        </section>

        <section
          aria-labelledby="non-use-heading"
          className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <h2 className="cfn-type-heading-2" id="non-use-heading">
            What this product does not do
          </h2>
          <p>
            ContextFirst Nexus does not determine trafficking status, credibility, guilt, legal
            eligibility, non-punishment eligibility, case priority, legal strategy, or case strength.
          </p>
          <p>
            It is not a survivor chatbot, emergency service, reporting channel, law enforcement
            intake tool, or legal advice system.
          </p>
        </section>
      </div>
    </main>
  );
}
