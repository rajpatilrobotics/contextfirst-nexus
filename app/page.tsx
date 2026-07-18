export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <div className="border-b border-[var(--color-border)] bg-[#102018] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <span className="font-semibold">ContextFirst Nexus</span>
          <a className="text-sm font-semibold !text-white no-underline" href="/trust">Trust and Safety</a>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16">
        <section className="grid max-w-4xl gap-6">
          <p className="cfn-type-label uppercase tracking-[0.14em] text-[var(--color-brand)]">Practitioner case-preparation demo</p>
          <h1 className="cfn-type-display max-w-3xl text-[42px] leading-[1.08] sm:text-[56px]">
            ContextFirst Nexus
          </h1>
          <p className="max-w-3xl font-[var(--font-display)] text-2xl font-semibold leading-9">
            A clear path from source documents to a reviewed handoff.
          </p>
          <p className="max-w-2xl text-lg leading-8 text-[var(--color-ink-muted)]">
            ContextFirst Nexus helps qualified practitioners prepare source-grounded case handoffs.
            Review a fictional case packet, verify what the evidence supports, keep limitations visible,
            and create a human-reviewed handoff without exposing model or provider controls.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              aria-label="Start demo"
              className="cfn-control-target inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-5 py-3 font-semibold !text-white no-underline shadow-sm hover:bg-[var(--color-brand-hover)]"
              href="/case/demo/purpose"
            >
              Start guided demo
            </a>
            <a
              className="cfn-control-target inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-subtle)]"
              href="/trust"
            >
              How safety works
            </a>
          </div>
        </section>

        <section
          aria-labelledby="boundaries-heading"
          className="grid gap-5 border-y border-[var(--color-border)] py-8"
        >
          <h2 className="cfn-type-heading-2" id="boundaries-heading">
            Demo boundaries
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <article className="grid gap-2">
              <h3 className="cfn-type-heading-3">Qualified practitioner audience</h3>
              <p>
                The prototype is for legal aid, public defender, NGO legal, court navigation,
                policy, or research practitioners. It is not authentication or secure access control.
              </p>
            </article>
            <article className="grid gap-2">
              <h3 className="cfn-type-heading-3">Fictional demo case</h3>
              <p>
                The only enabled case is fictional adult demo case CFN-DEMO-001. Do not
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
          className="grid gap-4 rounded-[var(--radius-card)] bg-[#102018] p-6 text-white sm:p-8"
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
