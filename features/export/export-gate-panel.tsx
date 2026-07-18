import type { ExportGate } from "../../lib/contracts";
import { Alert, Card } from "../../components/ui";

type Blocker = Extract<ExportGate, { status: "blocked" }>["blockers"][number];

const blockerLabels: Record<Blocker["code"], string> = {
  PURPOSE_INCOMPLETE: "Finish the case purpose",
  AUTHORITY_INVALID: "Confirm practitioner authority",
  DATA_ORIGIN_PROHIBITED: "Use the approved demo document set",
  REVIEW_INCOMPLETE: "Complete the remaining review decisions",
  CITATION_UNRESOLVED: "Resolve citation issues",
  COVERAGE_CONSEQUENTIAL: "Review the coverage limitation",
  JURISDICTION_UNVERIFIED: "Confirm local legal verification",
  DEPENDENCY_UNRESOLVED: "Resolve linked review items",
  MASK_REVIEW_INCOMPLETE: "Complete masking review",
  PII_CHECK_FAILED: "Resolve the privacy check",
  PROCESSING_FAILED: "Finish document processing",
  SAFETY_VALIDATION_FAILED: "Resolve the analysis safety check",
  ANALYSIS_RUN_STALE: "Refresh the analysis results",
  GATE_EVALUATION_STALE: "Run the readiness check again",
  MINIMUM_NECESSITY_UNCONFIRMED: "Confirm the minimum-necessary selection",
  OUTSIDE_STATED_PURPOSE: "Match the handoff to the stated purpose",
};

const routeByCode: Record<Blocker["code"], { route: string; target: string }> = {
  PURPOSE_INCOMPLETE: { route: "/case/demo/purpose", target: "purpose-form" },
  AUTHORITY_INVALID: { route: "/case/demo/purpose", target: "authority-attested" },
  DATA_ORIGIN_PROHIBITED: { route: "/case/demo/intake", target: "documents" },
  REVIEW_INCOMPLETE: { route: "/case/demo/review", target: "review-workspace" },
  CITATION_UNRESOLVED: { route: "/case/demo/review", target: "citations" },
  COVERAGE_CONSEQUENTIAL: { route: "/case/demo/intake", target: "coverage" },
  JURISDICTION_UNVERIFIED: { route: "/case/demo/purpose", target: "jurisdiction-code" },
  DEPENDENCY_UNRESOLVED: { route: "/case/demo/review", target: "dependencies" },
  MASK_REVIEW_INCOMPLETE: { route: "/case/demo/intake", target: "masking" },
  PII_CHECK_FAILED: { route: "/case/demo/intake", target: "masking" },
  PROCESSING_FAILED: { route: "/case/demo/intake", target: "processing" },
  SAFETY_VALIDATION_FAILED: { route: "/case/demo/intake", target: "analysis" },
  ANALYSIS_RUN_STALE: { route: "/case/demo/intake", target: "analysis" },
  GATE_EVALUATION_STALE: { route: "/case/demo/export", target: "export-gate" },
  MINIMUM_NECESSITY_UNCONFIRMED: { route: "/case/demo/export", target: "minimum-necessary-selection" },
  OUTSIDE_STATED_PURPOSE: { route: "/case/demo/purpose", target: "requested-export" },
};

function remediationHref(blocker: Blocker) {
  const destination = routeByCode[blocker.code];
  return `${destination.route}?exportBlocker=${encodeURIComponent(blocker.code)}#${encodeURIComponent(destination.target)}`;
}

function remediationLabel(blocker: Blocker) {
  const route = routeByCode[blocker.code].route;
  if (route.endsWith("/purpose")) return "Return to Purpose";
  if (route.endsWith("/intake")) return "Return to Documents";
  if (route.endsWith("/review")) return "Return to Review";
  return "Review this selection";
}
export function ExportGatePanel({ gate, headingRef }: {
  gate: ExportGate | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <Card className="grid gap-4">
      <header className="grid gap-1" id="export-gate" tabIndex={-1}>
        <p className="cfn-type-label text-[var(--color-ink-muted)]">Readiness check</p>
        <h3 className="cfn-type-heading-3" ref={headingRef} tabIndex={-1}>Readiness result</h3>
      </header>

      {!gate ? (
        <Alert title="Readiness not checked" tone="warning">
          <p>Check readiness to see what needs attention before a handoff can be created.</p>
        </Alert>
      ) : null}

      {gate?.status === "ready" ? (
        <Alert title="Ready to create the handoff">
          <p>All required purpose, document, review, citation, and safety checks are current.</p>
        </Alert>
      ) : null}

      {gate?.status === "blocked" ? (
        <div className="grid gap-4">
          <Alert title={`${gate.blockers.length} ${gate.blockers.length === 1 ? "item needs" : "items need"} attention`} tone="danger">
            <p>Finish the steps below before creating a handoff. There is no bypass.</p>
          </Alert>
          {gate.blockers.map((blocker) => (
            <section className="rounded-[var(--radius-control)] border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] p-4" key={blocker.id}>
              <h4 className="font-semibold">{blockerLabels[blocker.code]}</h4>
              <p className="mt-1 text-sm">{blocker.message}</p>
              <p className="mt-3 text-sm"><span className="font-semibold">Next step:</span> {blocker.remediation}</p>
              <a
                className="mt-3 inline-flex min-h-10 items-center rounded-[var(--radius-control)] bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold !text-white"
                href={remediationHref(blocker)}
              >
                {remediationLabel(blocker)}
              </a>
              <details className="mt-3 text-xs text-[var(--color-ink-muted)]">
                <summary className="cursor-pointer font-semibold">Technical details</summary>
                <dl className="mt-2 grid gap-1">
                  <div><dt className="inline font-semibold">Code: </dt><dd className="inline">{blocker.code}</dd></div>
                  <div><dt className="inline font-semibold">Affected IDs: </dt><dd className="inline break-words">{blocker.entityIds.join(", ") || "No entity ID supplied"}</dd></div>
                </dl>
              </details>
            </section>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
