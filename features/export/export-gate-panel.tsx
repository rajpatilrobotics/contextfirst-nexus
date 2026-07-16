import type { ExportGate } from "../../lib/contracts";
import { Alert, Card } from "../../components/ui";

type Blocker = Extract<ExportGate, { status: "blocked" }>["blockers"][number];

const routeByCode: Record<Blocker["code"], { route: string; target: string }> = {
  PURPOSE_INCOMPLETE: { route: "/case/demo/purpose", target: "purpose-form" },
  AUTHORITY_INVALID: { route: "/case/demo/purpose", target: "authority" },
  DATA_ORIGIN_PROHIBITED: { route: "/case/demo/documents", target: "documents" },
  REVIEW_INCOMPLETE: { route: "/case/demo/review", target: "review-workspace" },
  CITATION_UNRESOLVED: { route: "/case/demo/review", target: "citations" },
  COVERAGE_CONSEQUENTIAL: { route: "/case/demo/documents", target: "coverage" },
  JURISDICTION_UNVERIFIED: { route: "/case/demo/purpose", target: "jurisdiction" },
  DEPENDENCY_UNRESOLVED: { route: "/case/demo/review", target: "dependencies" },
  MASK_REVIEW_INCOMPLETE: { route: "/case/demo/documents", target: "masking" },
  PII_CHECK_FAILED: { route: "/case/demo/documents", target: "pii-check" },
  PROCESSING_FAILED: { route: "/case/demo/documents", target: "processing" },
  SAFETY_VALIDATION_FAILED: { route: "/case/demo/documents", target: "analysis" },
  ANALYSIS_RUN_STALE: { route: "/case/demo/documents", target: "analysis" },
  GATE_EVALUATION_STALE: { route: "/case/demo/export", target: "export-gate" },
  MINIMUM_NECESSITY_UNCONFIRMED: { route: "/case/demo/export", target: "minimum-necessary-selection" },
  OUTSIDE_STATED_PURPOSE: { route: "/case/demo/purpose", target: "requested-export" },
};

function remediationHref(blocker: Blocker) {
  const destination = routeByCode[blocker.code];
  const entityTarget = blocker.entityIds.length === 1 && blocker.entityIds[0] !== "minimum_necessity_confirmation"
    ? blocker.entityIds[0]
    : destination.target;
  return `${destination.route}?exportBlocker=${encodeURIComponent(blocker.code)}#${encodeURIComponent(entityTarget)}`;
}
export function ExportGatePanel({ gate, headingRef }: {
  gate: ExportGate | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <Card className="grid gap-4" >
      <header className="grid gap-1" id="export-gate">
        <p className="cfn-type-label text-[var(--color-ink-muted)]">Non-bypassable export gate</p>
        <h3 className="cfn-type-heading-3" ref={headingRef} tabIndex={-1}>Export gate result</h3>
      </header>

      {!gate ? (
        <Alert title="Gate not evaluated" tone="warning">
          <p>Review the current purpose-bound selection to see every blocker. No handoff can be created yet.</p>
        </Alert>
      ) : null}

      {gate?.status === "ready" ? (
        <Alert title="Ready to create the canonical handoff">
          <p>
            The gate is current for case revision {gate.caseRevision}, run {gate.analysisRunId}, Purpose revision {gate.purposeBriefRevision}, and masking revision {gate.maskingRevision}.
          </p>
        </Alert>
      ) : null}

      {gate?.status === "blocked" ? (
        <div className="grid gap-4">
          <Alert title={`${gate.blockers.length} blocking condition${gate.blockers.length === 1 ? "" : "s"}`} tone="danger">
            <p>Every condition below must be resolved. There is no override or direct renderer path.</p>
          </Alert>
          {gate.blockers.map((blocker) => (
            <section className="rounded-[var(--radius-card)] border border-[var(--color-danger)] p-4" key={blocker.id}>
              <h4 className="font-semibold">{blocker.code}</h4>
              <p className="mt-2">{blocker.message}</p>
              <dl className="mt-3 grid gap-2 text-sm">
                <div><dt className="cfn-type-label">Severity</dt><dd>Blocking</dd></div>
                <div><dt className="cfn-type-label">Affected IDs</dt><dd className="break-words">{blocker.entityIds.join(", ") || "No entity ID supplied"}</dd></div>
                <div><dt className="cfn-type-label">Remediation</dt><dd>{blocker.remediation}</dd></div>
              </dl>
              <a
                className="cfn-control-target mt-3 inline-flex rounded-[var(--radius-control)] border border-[var(--color-control-border)] px-3 py-2 text-sm font-semibold"
                href={remediationHref(blocker)}
              >
                Go to remediation target
              </a>
            </section>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
