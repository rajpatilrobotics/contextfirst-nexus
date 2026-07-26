import type { CaseCandidate, ExportGate } from "../../lib/contracts";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  XCircle,
} from "lucide-react";
import { Chip } from "../../components/lovable/nexus-ui";
import { Button } from "../../components/ui";

type Blocker = Extract<ExportGate, { status: "blocked" }>["blockers"][number];

const blockerLabels: Record<Blocker["code"], string> = {
  PURPOSE_INCOMPLETE: "Finish the case purpose",
  AUTHORITY_INVALID: "Confirm practitioner authority",
  DATA_ORIGIN_PROHIBITED: "Confirm the packet source classification",
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

const routeByCode: Record<Blocker["code"], { demoRoute: string; dynamicRoute: string; target: string }> = {
  PURPOSE_INCOMPLETE: { demoRoute: "purpose", dynamicRoute: "purpose", target: "purpose-form" },
  AUTHORITY_INVALID: { demoRoute: "purpose", dynamicRoute: "purpose", target: "authority-attested" },
  DATA_ORIGIN_PROHIBITED: { demoRoute: "purpose", dynamicRoute: "purpose", target: "source-material-classification" },
  REVIEW_INCOMPLETE: { demoRoute: "review", dynamicRoute: "analysis", target: "review-workspace" },
  CITATION_UNRESOLVED: { demoRoute: "review", dynamicRoute: "analysis", target: "citations" },
  COVERAGE_CONSEQUENTIAL: { demoRoute: "intake", dynamicRoute: "documents", target: "coverage" },
  JURISDICTION_UNVERIFIED: { demoRoute: "purpose", dynamicRoute: "purpose", target: "jurisdiction-code" },
  DEPENDENCY_UNRESOLVED: { demoRoute: "review", dynamicRoute: "nexus", target: "dependencies" },
  MASK_REVIEW_INCOMPLETE: { demoRoute: "intake", dynamicRoute: "documents", target: "masking" },
  PII_CHECK_FAILED: { demoRoute: "intake", dynamicRoute: "documents", target: "masking" },
  PROCESSING_FAILED: { demoRoute: "intake", dynamicRoute: "documents", target: "processing" },
  SAFETY_VALIDATION_FAILED: { demoRoute: "intake", dynamicRoute: "analysis", target: "analysis" },
  ANALYSIS_RUN_STALE: { demoRoute: "intake", dynamicRoute: "analysis", target: "analysis" },
  GATE_EVALUATION_STALE: { demoRoute: "export", dynamicRoute: "export", target: "export-gate" },
  MINIMUM_NECESSITY_UNCONFIRMED: { demoRoute: "export", dynamicRoute: "export", target: "minimum-necessary-selection" },
  OUTSIDE_STATED_PURPOSE: { demoRoute: "purpose", dynamicRoute: "purpose", target: "requested-export" },
};

function remediationHref(blocker: Blocker, caseBasePath: string) {
  const destination = routeByCode[blocker.code];
  const route = caseBasePath === "/case/demo"
    ? destination.demoRoute
    : destination.dynamicRoute;
  return `${caseBasePath}/${route}?exportBlocker=${encodeURIComponent(blocker.code)}#${encodeURIComponent(destination.target)}`;
}

function remediationLabel(blocker: Blocker, caseBasePath: string) {
  const destination = routeByCode[blocker.code];
  const route = caseBasePath === "/case/demo"
    ? destination.demoRoute
    : destination.dynamicRoute;
  if (route === "purpose") return "Return to Purpose";
  if (route === "intake" || route === "documents") return "Return to Documents";
  if (route === "review") return "Return to Review";
  if (route === "analysis") return "Return to Analysis";
  if (route === "nexus") return "Return to Nexus";
  return "Review this selection";
}

function candidateReviewDestination(
  candidate: CaseCandidate | undefined,
  caseBasePath: string,
) {
  if (caseBasePath === "/case/demo") {
    return {
      href: `${caseBasePath}/review?exportBlocker=REVIEW_INCOMPLETE#review-workspace`,
      label: "Review",
    };
  }
  const route =
    candidate?.kind === "context_gap"
      ? "gaps"
      : candidate?.kind === "timeline_event"
        ? "timeline"
        : candidate?.kind === "nexus_relationship"
          ? "nexus"
          : "analysis";
  const label =
    route === "gaps"
      ? "Evidence Gaps"
      : route === "timeline"
        ? "Timeline"
        : route === "nexus"
          ? "Evidence Integrity Map"
          : "Structured Analysis";
  return {
    href: `${caseBasePath}/${route}?exportBlocker=REVIEW_INCOMPLETE#candidate-${encodeURIComponent(candidate?.id ?? "unknown")}`,
    label,
  };
}

function blockerGroup(code: Blocker["code"]) {
  if (code === "REVIEW_INCOMPLETE") return "human-review";
  if (code === "CITATION_UNRESOLVED") return "citations";
  if (code === "DEPENDENCY_UNRESOLVED") return "dependencies";
  if (code === "COVERAGE_CONSEQUENTIAL" || code === "DATA_ORIGIN_PROHIBITED") return "coverage";
  if (code === "MASK_REVIEW_INCOMPLETE" || code === "PII_CHECK_FAILED") return "masking";
  if (code === "PROCESSING_FAILED") return "documents";
  if (code === "SAFETY_VALIDATION_FAILED") return "safety";
  if (code === "ANALYSIS_RUN_STALE") return "analysis";
  if (code === "MINIMUM_NECESSITY_UNCONFIRMED") return "safe-share";
  if (code === "GATE_EVALUATION_STALE") return "export";
  return "purpose";
}

export function ExportGatePanel({ candidates = [], caseBasePath = "/case/demo", gate, headingRef, onEvaluate }: {
  candidates?: CaseCandidate[];
  caseBasePath?: string;
  gate: ExportGate | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onEvaluate?: () => void;
}) {
  return (
    <section className="grid gap-3" id="export-gate" tabIndex={-1}>
      <h3 className="sr-only" ref={headingRef} tabIndex={-1}>Readiness result</h3>

      {!gate ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--amber)]" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="mute">readiness</Chip>
                <h4 className="font-serif text-lg">Readiness not checked</h4>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Check the current canonical case state before a handoff can be created.
              </p>
            </div>
            {onEvaluate ? (
              <Button className="shrink-0" onClick={onEvaluate} variant="primary">
                Check readiness
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {gate?.status === "ready" ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--sage)]" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="mute">readiness</Chip>
                <h4 className="font-serif text-lg">Ready to create the handoff</h4>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                All required purpose, document, review, citation, and safety checks are current.
              </p>
            </div>
            <Chip tone="sage">ready</Chip>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </div>
      ) : null}

      {gate?.status === "blocked" ? (
        <>
          <p className="sr-only" role="alert">
            {gate.blockers.length} {gate.blockers.length === 1 ? "item needs" : "items need"} attention.
            Finish the steps below before creating a handoff. There is no bypass.
          </p>
          {gate.blockers.map((blocker) => (
            <section key={blocker.id}>
              <details className="rounded-xl border border-border bg-card">
                <summary className="flex cursor-pointer items-start gap-3 p-4">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--rust)]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone="mute">{blockerGroup(blocker.code)}</Chip>
                      <h4 className="font-serif text-lg">{blockerLabels[blocker.code]}</h4>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{blocker.message}</p>
                  </div>
                  <Chip tone="rust">critical</Chip>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform" />
                </summary>
                <div className="border-t border-border p-4 text-sm">
                  {blocker.entityIds.length ? (
                    <div className="mb-2 flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground">Affected:</span>
                      {blocker.entityIds.map((id) => (
                        <Chip key={id} tone="neutral">{id}</Chip>
                      ))}
                    </div>
                  ) : null}
                  {blocker.code === "REVIEW_INCOMPLETE" && blocker.entityIds.length ? (
                    <div className="mb-3 grid gap-2">
                      <p className="text-xs font-semibold">Open each required review</p>
                      <ul className="grid gap-1.5 sm:grid-cols-2">
                        {blocker.entityIds.map((id) => {
                          const candidate = candidates.find((item) => item.id === id);
                          const destination = candidateReviewDestination(candidate, caseBasePath);
                          return (
                            <li key={id}>
                              <a
                                className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-xs"
                                href={destination.href}
                              >
                                <span className="min-w-0 truncate font-mono">{id}</span>
                                <span className="shrink-0 font-semibold">{destination.label}</span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Remediation:</span>{" "}
                    {blocker.remediation}
                  </p>
                  <a
                    className="mt-3 inline-flex min-h-10 items-center rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold"
                    href={remediationHref(blocker, caseBasePath)}
                  >
                    {remediationLabel(blocker, caseBasePath)}
                  </a>
                  <dl className="mt-3 grid gap-1 text-xs text-muted-foreground">
                    <div><dt className="inline font-semibold">Code: </dt><dd className="inline">{blocker.code}</dd></div>
                    <div><dt className="inline font-semibold">Affected IDs: </dt><dd className="inline break-words">{blocker.entityIds.join(", ") || "No entity ID supplied"}</dd></div>
                  </dl>
                </div>
              </details>
            </section>
          ))}
        </>
      ) : null}
      {gate && onEvaluate ? (
        <Button className="w-fit" onClick={onEvaluate} variant="secondary">
          Check readiness again
        </Button>
      ) : null}
    </section>
  );
}
