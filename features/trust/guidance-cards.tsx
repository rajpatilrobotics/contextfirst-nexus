import { BookOpenCheck, ExternalLink, Scale } from "lucide-react";
import type { GuidancePackSchema } from "../../lib/contracts";
import type { z } from "zod";
import { Alert, Card } from "../../components/ui";
import { StatusMark } from "./status-mark";

type GuidancePack = z.infer<typeof GuidancePackSchema>;

const MATERIAL_LABELS: Record<string, string> = {
  treaty: "Treaty",
  international_guidance: "International guidance",
  operational_indicator: "Operational indicator",
  report: "Report",
  risk_framework: "Risk framework",
  security_guidance: "Security guidance",
};

function Field({ term, value, code = false }: { term: string; value: string; code?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="cfn-type-label text-[var(--color-ink-muted)]">{term}</dt>
      <dd className={code ? "cfn-type-code break-all" : "break-words"}>{value}</dd>
    </div>
  );
}

export function GuidanceCards({ pack }: { pack: GuidancePack }) {
  return (
    <section aria-labelledby="guidance-heading" className="grid min-w-0 gap-5" id="guidance">
      <div className="grid gap-2">
        <p className="cfn-type-label text-[var(--color-brand)]">Guidance pack · version {pack.identity.version}</p>
        <h2 className="cfn-type-heading-1" id="guidance-heading">Reviewed guidance, separate from case evidence</h2>
        <p className="cfn-reading-column text-[var(--color-ink-muted)]">
          These published sources can frame qualified practitioner questions. They cannot corroborate the fictional demo case, establish domestic law, determine eligibility, or support a candidate.
        </p>
      </div>

      <Alert title="Guidance — not case evidence" tone="warning">
        <div className="mt-2 grid gap-2">
          <p>Local legal verification is required for every card.</p>
          <p className="cfn-type-code break-all">Pack digest: {pack.identity.digest}</p>
        </div>
      </Alert>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
        {pack.cards.map((card) => (
          <Card className="grid content-start gap-4" key={card.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="cfn-type-label text-[var(--color-brand)]">{card.sourceRegisterId}</p>
                <h3 className="cfn-type-heading-3">{card.title}</h3>
                <p><span className="font-semibold">Issuer:</span> {card.issuer}</p>
              </div>
              <StatusMark
                label={MATERIAL_LABELS[card.materialType] ?? card.materialType}
                tone={card.materialType === "security_guidance" ? "neutral" : "brand"}
              />
            </div>

            <blockquote className="m-0 border-l-4 border-[var(--color-brand)] bg-[var(--color-brand-subtle)] p-4">
              <p className="cfn-type-label">Exact reviewed passage</p>
              <p className="mt-2">“{card.exactReviewedPassage}”</p>
            </blockquote>

            <dl className="grid gap-3 sm:grid-cols-2">
              <Field term="Card ID" value={card.id} code />
              <Field term="Material type" value={MATERIAL_LABELS[card.materialType] ?? card.materialType} />
              <Field term="Publication or version date" value={card.publicationOrVersionDate} />
              <Field term="Source version" value={card.sourceVersion} />
              <Field term="Jurisdiction or scope" value={card.jurisdictionOrScope} />
              <Field term="Locator" value={card.locator} />
              <Field term="Last verified" value={card.lastVerified} />
              <Field term="Verification status" value={card.verificationStatus.replaceAll("_", " ")} />
            </dl>

            <div className="grid gap-3">
              <p><span className="font-semibold">Allowed use:</span> {card.allowedUse}</p>
              <p><span className="font-semibold">Limitation:</span> {card.limitation}</p>
            </div>

            <div className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-warning)] bg-[var(--color-warning-subtle)] p-3">
              <p className="flex items-center gap-2 font-semibold">
                <Scale aria-hidden="true" size={18} /> Local legal verification required
              </p>
              <p className="cfn-type-body-small">No endorsement, certification, partnership, or individual legal conclusion is claimed.</p>
            </div>

            <a className="inline-flex min-h-11 items-center gap-2 font-semibold" href={card.sourceUrl} rel="noreferrer" target="_blank">
              Open official source <ExternalLink aria-hidden="true" size={16} />
            </a>
          </Card>
        ))}
      </div>

      <Card className="flex gap-3">
        <BookOpenCheck aria-hidden="true" className="mt-1 shrink-0 text-[var(--color-supported)]" size={20} />
        <p>
          The complete six-card pack is rendered above. Case documents and guidance retain separate identities, provenance, and permitted uses.
        </p>
      </Card>
    </section>
  );
}
