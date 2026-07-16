"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FixtureProcessingStageNameSchema,
  SafeErrorCodeSchema,
  type CaseCommand,
  type FixtureProcessingStageName,
  type MaskClass,
  type SafeErrorCode,
} from "../../lib/contracts";
import {
  processCfnDemoPdfSources,
  type CfnDemoDocumentServiceResult,
} from "../../lib/documents";
import { cfnDemoFixture } from "../../lib/fixtures";
import { useCaseState } from "../../components/shell";
import { Alert, Button, Select } from "../../components/ui";
import {
  runSelectedAnalysis,
  type RunControllerOptions,
  type RunControllerResult,
} from "../analysis/run-controller";
import {
  AnalysisPrerequisites,
  deriveAnalysisPrerequisites,
  type AnalysisPresentation,
} from "./analysis-prerequisites";
import { CoverageManifest } from "./coverage-manifest";
import { DocumentCards, initialSyntheticDocuments } from "./document-cards";
import { MaskingReviewPanel } from "./masking-review-panel";
import { ProcessingStageList } from "./processing-stage-list";
import { SensitiveReveal } from "./sensitive-reveal";

type ProcessSources = () => Promise<CfnDemoDocumentServiceResult>;
type RunAnalysis = (options: RunControllerOptions) => Promise<RunControllerResult>;
type MaskReviewStatus = Extract<
  CaseCommand,
  { type: "review_mask" }
>["reviewStatus"];
type ManualMaskInput = Extract<
  CaseCommand,
  { type: "add_mask_suggestion" }
>["input"];

type SafeProcessingFailure = {
  code: SafeErrorCode;
  stage: FixtureProcessingStageName;
  documentId?: string;
  pageId?: string;
};

function commandMeta(caseRevision: number, purpose: string): CaseCommand["meta"] {
  const createdAt = new Date().toISOString();
  const nonce =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    commandId: `CMD-DOCUMENTS-${purpose}-${nonce}`,
    idempotencyKey: `IDEM-DOCUMENTS-${purpose}-${nonce}`,
    expectedCaseRevision: caseRevision,
    actor: "current_practitioner",
    createdAt,
  };
}

const fixtureDocumentIds = new Set(
  cfnDemoFixture.documents.map((document) => document.id),
);
const fixturePageIds = new Set(
  cfnDemoFixture.documents.flatMap((document) =>
    document.pages.map((page) => page.id),
  ),
);

function safeProcessingFailure(error: unknown): SafeProcessingFailure {
  if (typeof error !== "object" || error === null) {
    return { code: "INTERNAL_SAFE_FAILURE", stage: "text_extraction" };
  }
  const candidate = error as Record<string, unknown>;
  const parsedCode = SafeErrorCodeSchema.safeParse(candidate.code);
  const parsedStage = FixtureProcessingStageNameSchema.safeParse(candidate.stage);
  const documentId =
    typeof candidate.documentId === "string" &&
    fixtureDocumentIds.has(candidate.documentId)
      ? candidate.documentId
      : undefined;
  const pageId =
    typeof candidate.pageId === "string" && fixturePageIds.has(candidate.pageId)
      ? candidate.pageId
      : undefined;
  return {
    code: parsedCode.success ? parsedCode.data : "INTERNAL_SAFE_FAILURE",
    stage: parsedStage.success ? parsedStage.data : "text_extraction",
    documentId,
    pageId,
  };
}

function fixtureProcessingResult(result: CfnDemoDocumentServiceResult) {
  return {
    caseId: result.caseId,
    fixtureVersion: result.fixtureVersion,
    canonicalFixtureDigest: result.canonicalFixtureDigest,
    documents: result.documents,
    coverage: result.coverage,
    processing: result.processing,
    selectedSegmentIds: result.selectedSegmentIds,
  };
}

function terminalPresentation(result: RunControllerResult): AnalysisPresentation {
  if (result.status === "completed") {
    return { status: "completed", outcome: result.outcome };
  }
  if (result.status === "failed" || result.status === "rejected") {
    return {
      status: result.status,
      code: result.error.code,
      userMessage: result.error.userMessage,
    };
  }
  if (result.status === "transport_failed") {
    return {
      status: "transport_failed",
      reasonCode: result.reasonCode,
      requestId: result.requestId,
    };
  }
  return { status: "blocked", reason: result.reason };
}

export function DocumentsWorkspace({
  processSources = processCfnDemoPdfSources,
  runAnalysis = runSelectedAnalysis,
}: {
  processSources?: ProcessSources;
  runAnalysis?: RunAnalysis;
}) {
  const { state, dispatchCaseCommand } = useCaseState();
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "neutral" | "warning" | "danger";
    title: string;
    message: string;
  } | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisPresentation>({
    status: "idle",
  });

  useEffect(() => {
    if (
      state.segments.length > 0 &&
      !state.segments.some((segment) => segment.id === selectedSegmentId)
    ) {
      setSelectedSegmentId(state.segments[0]?.id ?? "");
    }
  }, [selectedSegmentId, state.segments]);

  const selectedSegment = state.segments.find(
    (segment) => segment.id === selectedSegmentId,
  );
  const analysisPending = analysisResult.status === "pending";
  const actionsDisabled = processing || analysisPending;
  const purposeComplete = state.purposeBrief?.status === "complete";

  function showCommandFailure(title: string) {
    setNotice({
      tone: "danger",
      title,
      message: "The canonical case command was not applied. Review the current case state and try again.",
    });
  }

  async function processFixture(retryStage?: FixtureProcessingStageName) {
    if (!purposeComplete || actionsDisabled) return;
    setNotice(null);
    setProcessing(true);

    const startResult = dispatchCaseCommand(
      retryStage
        ? {
            type: "retry_fixture_processing_stage",
            meta: commandMeta(state.caseRevision, `RETRY-${retryStage}`),
            stageName: retryStage,
          }
        : {
            type: "begin_fixture_processing",
            meta: commandMeta(state.caseRevision, "BEGIN"),
          },
    );
    if (!startResult.ok) {
      showCommandFailure("Local processing could not start");
      setProcessing(false);
      return;
    }

    try {
      const localResult = await processSources();
      const completion = dispatchCaseCommand({
        type: "complete_fixture_processing",
        meta: commandMeta(startResult.state.caseRevision, "COMPLETE"),
        result: fixtureProcessingResult(localResult),
      });
      if (!completion.ok) {
        showCommandFailure("Local processing result was rejected");
        return;
      }

      const suggestionRefresh = dispatchCaseCommand({
        type: "refresh_mask_suggestions",
        meta: commandMeta(completion.state.caseRevision, "REFRESH-MASKS"),
        sensitiveTerms: [cfnDemoFixture.seededIdentifiers[0]],
      });
      if (!suggestionRefresh.ok) {
        showCommandFailure("Mask suggestions could not be prepared");
        return;
      }
      setNotice({
        tone: "neutral",
        title: "Browser-local processing complete",
        message:
          "The seven bundled synthetic PDFs were processed locally. Review coverage and every retained mask before analysis.",
      });
    } catch (error) {
      const failure = safeProcessingFailure(error);
      const failureResult = dispatchCaseCommand({
        type: "fail_fixture_processing",
        meta: commandMeta(startResult.state.caseRevision, `FAIL-${failure.stage}`),
        stageName: failure.stage,
        safeErrorCode: failure.code,
      });
      const location = [failure.documentId, failure.pageId]
        .filter(Boolean)
        .join(" / ");
      setNotice({
        tone: "danger",
        title: "Browser-local processing failed",
        message: failureResult.ok
          ? `Safe code: ${failure.code}. Stage: ${failure.stage.replaceAll("_", " ")}.${location ? ` Affected record: ${location}.` : ""} Use the permitted targeted retry when available.`
          : "The failure could not be recorded in canonical case state. Reset or reload the synthetic case before retrying.",
      });
    } finally {
      setProcessing(false);
    }
  }

  function reviewMask(
    maskId: string,
    reviewStatus: MaskReviewStatus,
    replacementToken: string,
  ) {
    const result = dispatchCaseCommand({
      type: "review_mask",
      meta: commandMeta(state.caseRevision, "REVIEW-MASK"),
      maskId,
      reviewStatus,
      replacementToken,
    });
    if (!result.ok) showCommandFailure("Mask decision was not recorded");
  }

  function removeMask(maskId: string) {
    const result = dispatchCaseCommand({
      type: "remove_mask_suggestion",
      meta: commandMeta(state.caseRevision, "REMOVE-MASK"),
      maskId,
    });
    if (!result.ok) showCommandFailure("Mask suggestion was not removed");
  }

  function addMask(input: ManualMaskInput) {
    const result = dispatchCaseCommand({
      type: "add_mask_suggestion",
      meta: commandMeta(state.caseRevision, "ADD-MASK"),
      input,
    });
    if (!result.ok) showCommandFailure("Range-based mask was not added");
  }

  function completeMaskReview() {
    const result = dispatchCaseCommand({
      type: "complete_mask_review",
      meta: commandMeta(state.caseRevision, "COMPLETE-MASKS"),
    });
    if (!result.ok) {
      setNotice({
        tone: "warning",
        title: "Masking review remains blocked",
        message:
          "Resolve every pending or rejected retained mask and any invalid range before completing the deterministic leak scan.",
      });
      return;
    }
    setNotice({
      tone: "neutral",
      title: "Masking review approved",
      message:
        "Human review is recorded and the deterministic leak scan passed for the canonical redacted projection.",
    });
  }

  function reviewCoverageIssue(
    issueId: string,
    reviewedConsequence: "consequential" | "non_consequential",
    limitationText: string,
    reason: string,
  ) {
    const result = dispatchCaseCommand({
      type: "review_coverage_issue",
      meta: commandMeta(state.caseRevision, "REVIEW-COVERAGE"),
      intent: { issueId, reviewedConsequence, limitationText, reason },
    });
    if (!result.ok) showCommandFailure("Coverage limitation was not recorded");
  }

  function revealSource(segmentId: string) {
    const result = dispatchCaseCommand({
      type: "reveal_source",
      meta: commandMeta(state.caseRevision, "REVEAL-SOURCE"),
      citationId: segmentId,
      reasonCode: "explicit_synthetic_source_review",
    });
    if (!result.ok) showCommandFailure("Synthetic source reveal was not recorded");
    return result.ok;
  }

  async function startAnalysis() {
    if (
      analysisPending ||
      !deriveAnalysisPrerequisites(state).ready
    ) {
      return;
    }
    setAnalysisResult({ status: "pending" });
    try {
      const result = await runAnalysis({ state, dispatchCaseCommand });
      setAnalysisResult(terminalPresentation(result));
    } catch {
      setAnalysisResult({
        status: "blocked",
        reason: "internal_safe_failure",
      });
    }
  }

  return (
    <div className="grid min-w-0 gap-6">
      <header className="grid gap-2">
        <p className="cfn-type-label text-[var(--color-warning)]">Synthetic-only Documents step</p>
        <h1 className="cfn-type-heading-1">Intake, coverage, and masking</h1>
        <p className="max-w-3xl text-[var(--color-ink-muted)]">
          Inspect the seven read-only fixture PDFs, process them in this browser, review explicit missingness, and approve identifier masking before analysis.
        </p>
      </header>

      {!purposeComplete ? (
        <Alert title="Purpose is required" tone="warning">
          <p>
            Complete the qualified-practitioner purpose and analysis disclosure on the{" "}
            <Link className="font-semibold underline" href="/case/demo/purpose">Purpose step</Link>{" "}
            before local processing.
          </p>
        </Alert>
      ) : null}

      {notice ? (
        <Alert title={notice.title} tone={notice.tone}>
          <p>{notice.message}</p>
        </Alert>
      ) : null}

      <section aria-labelledby="local-processing-heading" className="grid gap-3">
        <div>
          <h2 className="cfn-type-heading-2" id="local-processing-heading">Browser-local PDF processing</h2>
          <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
            Only the allowlisted bundled files are read. Raw PDF bytes are not persisted or sent to an analysis provider, and image-only pages are not OCR-processed.
          </p>
        </div>
        <div>
          <Button
            disabled={!purposeComplete || actionsDisabled}
            onClick={() => void processFixture()}
            variant="primary"
          >
            {processing ? "Processing bundled PDFs…" : state.documents.length > 0 ? "Reprocess bundled PDFs locally" : "Process bundled PDFs locally"}
          </Button>
        </div>
      </section>

      <DocumentCards documents={state.documents.length > 0 ? state.documents : initialSyntheticDocuments()} />

      <ProcessingStageList
        disabled={actionsDisabled}
        onRetry={(stage) => void processFixture(stage)}
        stages={state.processing}
      />

      <CoverageManifest
        coverage={state.coverage}
        disabled={actionsDisabled}
        onReviewIssue={reviewCoverageIssue}
      />

      <MaskingReviewPanel
        disabled={actionsDisabled}
        onAdd={addMask}
        onComplete={completeMaskReview}
        onRemove={removeMask}
        onReview={reviewMask}
        review={state.masking}
        segmentIds={state.segments.map((segment) => segment.id)}
      />

      <section aria-labelledby="source-review-heading" className="grid gap-4">
        <div>
          <h2 className="cfn-type-heading-2" id="source-review-heading">Redacted source review</h2>
          <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
            Extracted case text is untrusted data and renders as escaped text. The masked derivative appears first.
          </p>
        </div>
        {state.segments.length === 0 ? (
          <Alert title="Source text not processed" tone="warning">
            <p>No extracted segment is available. Nothing is treated as successfully empty.</p>
          </Alert>
        ) : (
          <>
            <div className="max-w-xl">
              <label className="cfn-type-label block" htmlFor="source-segment-select">Synthetic source segment</label>
              <Select
                disabled={actionsDisabled}
                id="source-segment-select"
                onChange={(event) => setSelectedSegmentId(event.currentTarget.value)}
                value={selectedSegmentId}
              >
                {state.segments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.id}{segment.id === "D07-P2-S03" ? " — untrusted evidence only" : ""}
                  </option>
                ))}
              </Select>
            </div>
            {selectedSegment ? (
              <SensitiveReveal
                disabled={actionsDisabled}
                key={selectedSegment.id}
                onReveal={revealSource}
                segment={selectedSegment}
              />
            ) : (
              <Alert title="Selected source unavailable" tone="warning">
                <p>The selected segment is not represented in canonical state.</p>
              </Alert>
            )}
          </>
        )}
      </section>

      <AnalysisPrerequisites
        disabled={actionsDisabled}
        onStart={() => void startAnalysis()}
        result={analysisResult}
        state={state}
      />
    </div>
  );
}
