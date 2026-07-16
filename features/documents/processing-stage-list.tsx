import { AlertCircle, Check, Clock, LoaderCircle, TriangleAlert } from "lucide-react";
import type {
  FixtureProcessingStageName,
  ProcessingStage,
} from "../../lib/contracts";
import { Button, Card } from "../../components/ui";

export const PROCESSING_STAGE_ORDER = [
  "intake_validation",
  "text_extraction",
  "coverage_calculation",
  "identifier_masking",
  "candidate_extraction",
  "citation_validation",
  "timeline_nexus_assembly",
  "safety_export_gate_checks",
] as const satisfies readonly ProcessingStage["name"][];

const STAGE_LABELS: Record<ProcessingStage["name"], string> = {
  intake_validation: "Intake validation",
  text_extraction: "Text extraction",
  coverage_calculation: "Coverage calculation",
  identifier_masking: "Identifier masking",
  candidate_extraction: "Candidate extraction",
  citation_validation: "Citation validation",
  timeline_nexus_assembly: "Timeline and Nexus assembly",
  safety_export_gate_checks: "Safety and export-gate checks",
};

const FIXTURE_STAGES = new Set<ProcessingStage["name"]>([
  "intake_validation",
  "text_extraction",
  "coverage_calculation",
  "identifier_masking",
]);

function stageIcon(status: ProcessingStage["status"]) {
  if (status === "completed") return <Check aria-hidden="true" size={18} />;
  if (status === "active") return <LoaderCircle aria-hidden="true" size={18} />;
  if (status === "warning") return <TriangleAlert aria-hidden="true" size={18} />;
  if (status === "failed") return <AlertCircle aria-hidden="true" size={18} />;
  return <Clock aria-hidden="true" size={18} />;
}

export function ProcessingStageList({
  stages,
  disabled = false,
  onRetry,
}: {
  stages: ProcessingStage[];
  disabled?: boolean;
  onRetry?: (stage: FixtureProcessingStageName) => void;
}) {
  const stageByName = new Map(stages.map((stage) => [stage.name, stage]));

  return (
    <Card className="grid gap-4">
      <div>
        <h2 className="cfn-type-heading-2">Processing progress</h2>
        <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
          Completed safe work remains visible if a later stage fails. No blank stage means success.
        </p>
      </div>
      <ol aria-label="Eight processing stages" className="grid gap-2" aria-live="polite">
        {PROCESSING_STAGE_ORDER.map((name) => {
          const stage = stageByName.get(name) ?? {
            name,
            status: "pending" as const,
            affectedDocumentIds: [],
            retryable: false,
          };
          const canRetry =
            stage.status === "failed" &&
            stage.retryable &&
            FIXTURE_STAGES.has(stage.name) &&
            onRetry;

          return (
            <li
              className="grid gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              key={name}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 shrink-0">{stageIcon(stage.status)}</span>
                <div className="min-w-0">
                  <p className="font-semibold">{STAGE_LABELS[name]}</p>
                  <p className="cfn-type-body-small capitalize">Status: {stage.status}</p>
                  {stage.affectedDocumentIds.length > 0 ? (
                    <p className="cfn-type-body-small break-words">
                      Affected records: {stage.affectedDocumentIds.join(", ")}
                    </p>
                  ) : null}
                  {stage.errorCode ? (
                    <p className="cfn-type-body-small text-[var(--color-danger)]" role="alert">
                      Safe code: {stage.errorCode}. Review the affected record and retry only this stage when allowed.
                    </p>
                  ) : null}
                </div>
              </div>
              {canRetry ? (
                <Button
                  disabled={disabled}
                  onClick={() => onRetry?.(stage.name as FixtureProcessingStageName)}
                >
                  Retry {STAGE_LABELS[name]}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
