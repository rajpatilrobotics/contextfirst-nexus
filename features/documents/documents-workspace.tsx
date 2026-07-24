"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FixtureProcessingStageNameSchema,
  SafeErrorCodeSchema,
  type CaseCommand,
  type FixtureProcessingStageName,
  type SafeErrorCode,
} from "../../lib/contracts";
import {
  CfnDemoPdfSourceService,
  processLocalPdfSources,
  processCfnDemoPdfSources,
  type CfnDemoDocumentServiceResult,
  type LocalPdfDocumentServiceResult,
} from "../../lib/documents";
import { cfnDemoFixture } from "../../lib/fixtures";
import { useCaseState } from "../../components/shell";
import { SectionTitle } from "../../components/lovable/nexus-ui";
import { Alert, Select } from "../../components/ui";
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
import { DocumentCards } from "./document-cards";
import { MaskingReviewPanel } from "./masking-review-panel";
import {
  PdfSelectionPanel,
  type PdfSelectionMode,
  type PdfSelectionValidator,
} from "./pdf-selection-panel";
import { ProcessingStageList } from "./processing-stage-list";
import { SensitiveReveal } from "./sensitive-reveal";

type ProcessSources = () => Promise<CfnDemoDocumentServiceResult>;
type ProcessSelectedSources = (
  files: readonly File[],
) => Promise<CfnDemoDocumentServiceResult>;
type ProcessLocalSources = (
  files: readonly File[],
) => Promise<LocalPdfDocumentServiceResult>;
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

type IntakeMode = "none" | PdfSelectionMode;

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

async function processSelectedPdfSources(files: readonly File[]) {
  const service = new CfnDemoPdfSourceService();
  try {
    return await service.processSelectedFiles(files);
  } finally {
    await service.cleanup();
  }
}

export function DocumentsWorkspace({
  processLocalSources = processLocalPdfSources,
  processSources = processCfnDemoPdfSources,
  processSelectedSources = processSelectedPdfSources,
  runAnalysis = runSelectedAnalysis,
  validateSelection,
}: {
  processLocalSources?: ProcessLocalSources;
  processSources?: ProcessSources;
  processSelectedSources?: ProcessSelectedSources;
  runAnalysis?: RunAnalysis;
  validateSelection?: PdfSelectionValidator;
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
  const [intakeReady, setIntakeReady] = useState(false);
  const [readyFiles, setReadyFiles] = useState<readonly File[]>([]);
  const [intakeMode, setIntakeMode] = useState<IntakeMode>("none");

  useEffect(() => {
    if (
      state.segments.length > 0 &&
      !state.segments.some((segment) => segment.id === selectedSegmentId)
    ) {
      setSelectedSegmentId(state.segments[0]?.id ?? "");
    }
  }, [selectedSegmentId, state.segments]);

  useEffect(() => {
    const requiredLocalStages = [
      "intake_validation",
      "text_extraction",
      "coverage_calculation",
      "identifier_masking",
    ] as const;
    const processingSucceeded =
      state.documents.length > 0 &&
      requiredLocalStages.every((name) =>
        state.processing.some(
          (stage) =>
            stage.name === name &&
            (stage.status === "completed" || stage.status === "warning"),
        ),
      ) && state.selectedSegmentIds.length > 0;
    if (processingSucceeded) {
      setIntakeReady(true);
      setIntakeMode(
        state.documents.some((document) => document.dataOrigin === "browser_local")
          ? "local_preview"
          : "prepared_demo",
      );
    }
  }, [state.documents, state.processing]);

  const selectedSegment = state.segments.find(
    (segment) => segment.id === selectedSegmentId,
  );
  const analysisPending = analysisResult.status === "pending";
  const actionsDisabled = processing || analysisPending;
  const purposeComplete = state.purposeBrief?.status === "complete";
  const prerequisites = deriveAnalysisPrerequisites(state);
  const documentsProcessed = Boolean(
    prerequisites.items.find((item) => item.id === "sources")?.satisfied,
  );
  const processingFailed = state.processing.some(
    (stage) => stage.status === "failed",
  );
  const checksComplete =
    documentsProcessed &&
    state.masking.reviewStatus === "approved" &&
    state.masking.leakScanStatus === "passed" &&
    !state.coverage.hasConsequentialOpenIssue;
  const activeStep = processingFailed
    ? 2
    : !intakeReady
      ? 1
      : !documentsProcessed
      ? 2
      : !checksComplete
        ? 3
        : 4;
  const activeRun = state.analysisRuns.find(
    (run) => run.id === state.activeAnalysisRunId,
  );
  const reviewReady =
    activeRun?.status === "succeeded" && state.candidates.length > 0;

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
      const localResult =
        readyFiles.length > 0
          ? await processSelectedSources(readyFiles)
          : await processSources();
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
          "The seven selected demo PDFs were processed locally. Review coverage and every retained mask before analysis.",
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
          : "The failure could not be recorded in case state. Reset or reload the demo before retrying.",
      });
    } finally {
      setProcessing(false);
    }
  }

  async function processSelectedFiles(
    files: readonly File[],
    mode: PdfSelectionMode,
  ) {
    if (actionsDisabled) {
      throw new Error("document_intake_not_ready");
    }
    setNotice(null);
    setProcessing(true);

    if (mode === "local_preview") {
      try {
        const localResult = await processLocalSources(files);
        if (localResult.segments.length === 0) {
          throw new Error("no_readable_pdf_text");
        }
        const completion = dispatchCaseCommand({
          type: "complete_local_document_processing",
          meta: commandMeta(state.caseRevision, "COMPLETE-LOCAL"),
          result: localResult,
        });
        if (!completion.ok) throw new Error(completion.reason);
        const suggestionRefresh = dispatchCaseCommand({
          type: "refresh_mask_suggestions",
          meta: commandMeta(completion.state.caseRevision, "REFRESH-LOCAL-MASKS"),
          sensitiveTerms: [],
        });
        if (!suggestionRefresh.ok) throw new Error(suggestionRefresh.reason);
        setIntakeMode("local_preview");
        setIntakeReady(true);
        const attentionCount = localResult.coverage.issues.length;
        setNotice({
          tone: attentionCount > 0 ? "warning" : "neutral",
          title: "PDF text prepared locally",
          message:
            attentionCount > 0
              ? `${localResult.documents.length} PDFs were read in this browser. Review ${attentionCount} ${attentionCount === 1 ? "page limitation" : "page limitations"} before analysis.`
              : `${localResult.documents.length} PDFs were read in this browser and are ready for the required checks.`,
        });
        return;
      } catch (error) {
        setNotice({
          tone: "danger",
          title: "The PDFs could not be prepared",
          message:
            error instanceof Error && error.message === "no_readable_pdf_text"
              ? "No embedded text was found. This build does not OCR scanned image-only pages; choose a text-based PDF."
              : "The browser could not read the selected PDF text. Replace only the affected file and try again.",
        });
        throw error;
      } finally {
        setProcessing(false);
      }
    }

    const startResult = dispatchCaseCommand({
      type: "begin_fixture_processing",
      meta: commandMeta(state.caseRevision, "BEGIN-SELECTED"),
    });
    if (!startResult.ok) {
      setProcessing(false);
      throw new Error("document_processing_start_rejected");
    }

    let canonicalResultRecorded = false;
    try {
      const localResult = await processSelectedSources(files);
      const failedStage = localResult.processing.find(
        (stage) => stage.status === "failed",
      );
      const completion = dispatchCaseCommand({
        type: "complete_fixture_processing",
        meta: commandMeta(startResult.state.caseRevision, "COMPLETE-SELECTED"),
        result: fixtureProcessingResult(localResult),
      });
      if (!completion.ok) {
        throw new Error("document_processing_result_rejected");
      }
      canonicalResultRecorded = true;
      if (failedStage) {
        throw {
          code: failedStage.errorCode ?? "INTERNAL_SAFE_FAILURE",
          stage: failedStage.name,
        };
      }

      const suggestionRefresh = dispatchCaseCommand({
        type: "refresh_mask_suggestions",
        meta: commandMeta(completion.state.caseRevision, "REFRESH-SELECTED-MASKS"),
        sensitiveTerms: [cfnDemoFixture.seededIdentifiers[0]],
      });
      if (!suggestionRefresh.ok) {
        throw new Error("mask_suggestion_refresh_rejected");
      }

      setNotice({
        tone: "neutral",
        title: "Browser-local processing complete",
        message:
          "The exact demo files were verified in this browser. Review coverage and every retained mask before analysis.",
      });
      setIntakeMode("prepared_demo");
    } catch (error) {
      const failure = safeProcessingFailure(error);
      if (!canonicalResultRecorded) {
        dispatchCaseCommand({
          type: "fail_fixture_processing",
          meta: commandMeta(startResult.state.caseRevision, `FAIL-SELECTED-${failure.stage}`),
          stageName: failure.stage,
          safeErrorCode: failure.code,
        });
      }
      throw error;
    } finally {
      setProcessing(false);
    }
  }

  function resetDocumentIntake() {
    const result = dispatchCaseCommand({
      type: "reset_case",
      meta: commandMeta(state.caseRevision, "RESET-DOCUMENT-INTAKE"),
    });
    if (!result.ok) {
      showCommandFailure("Document intake could not be reset");
      return;
    }
    setReadyFiles([]);
    setIntakeMode("none");
    setIntakeReady(false);
    setNotice(null);
    setAnalysisResult({ status: "idle" });
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
    if (result.state.masking.leakScanStatus !== "passed") {
      setNotice({
        tone: "warning",
        title: "Privacy scan found a remaining detail",
        message:
          "The reviewed masks were applied, but the deterministic scan still found a supported identifier. Add or correct a mask before analysis.",
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
      reasonCode: state.documents.some(
        (document) => document.dataOrigin === "browser_local",
      )
        ? "explicit_local_source_review"
        : "explicit_synthetic_source_review",
    });
    if (!result.ok) showCommandFailure("Source reveal was not recorded");
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
    <div className="space-y-6">
      <SectionTitle
        description="Every source declares what was extracted, what needs OCR, and what remains unreadable. Nothing is silently pretended-processed."
        eyebrow="Stage 2 · Intake"
        title="Documents & Source Health"
      />

      {state.documents.length > 0 ? (
        <DocumentCards
          documents={state.documents}
          maskingStatus={state.masking.reviewStatus}
        />
      ) : null}

      <nav aria-label="Document preparation progress">
        <ol className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {([
            [1, "Choose PDFs"],
            [2, "Process locally"],
            [3, "Required checks"],
            [4, "Start analysis"],
          ] as const).map(([step, label]) => {
            const failed = step === 2 && processingFailed;
            const complete = !failed && (step < activeStep || (step === 4 && prerequisites.ready));
            const active = step === activeStep;
            return (
              <li
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2 text-sm ${
                  failed
                    ? "border-[var(--color-danger)] bg-[var(--color-danger-subtle)] font-semibold"
                    : active
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] font-semibold"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]"
                }`}
                key={step}
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  failed
                    ? "bg-[var(--color-danger)] text-white"
                    : complete || active
                    ? "bg-[var(--color-brand)] text-white"
                    : "bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]"
                }`}>
                  {failed ? "!" : complete ? "✓" : step}
                </span>
                <span>{label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {!purposeComplete ? (
        <Alert title="Purpose is required" tone="warning">
          <p>
            You can add and check PDFs now. Complete the qualified-practitioner purpose and
            analysis disclosure on the{" "}
            <Link className="font-semibold underline" href="/case/demo/purpose">Purpose step</Link>{" "}
            before starting analysis.
          </p>
        </Alert>
      ) : null}

      <PdfSelectionPanel
        onClear={resetDocumentIntake}
        onReady={({ files, mode }) => {
          setReadyFiles(files);
          setIntakeReady(true);
          setIntakeMode(mode);
        }}
        onReset={() => {
          setReadyFiles([]);
          setIntakeReady(false);
          setIntakeMode("none");
        }}
        processFiles={processSelectedFiles}
        replaceAllowed={intakeMode !== "prepared_demo"}
        validateSelection={validateSelection}
      />

      {intakeReady ? (
        <div className="grid gap-4">
          <section
            aria-labelledby="local-processing-heading"
            className="grid scroll-mt-28 gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
            id="processing"
            tabIndex={-1}
          >
            <div>
              <p className="text-sm font-semibold text-[var(--color-brand)]">Step 2</p>
              <h2 className="font-serif text-2xl leading-tight" id="local-processing-heading">
                {intakeMode === "local_preview" ? "Documents processed locally" : "Demo packet processed locally"}
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)]">
                The selected PDFs were read in this browser. No upload was sent to a server.
              </p>
            </div>

            {notice ? (
              <Alert title={notice.title} tone={notice.tone}>
                <p>{notice.message}</p>
              </Alert>
            ) : null}

            <details className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
              <summary className="cursor-pointer font-semibold text-[var(--color-brand)]">
                View technical processing details
              </summary>
              <div className="mt-3">
                <ProcessingStageList
                  disabled={
                    actionsDisabled ||
                    readyFiles.length === 0 ||
                    intakeMode === "local_preview"
                  }
                  onRetry={(stage) => void processFixture(stage)}
                  stages={state.processing}
                />
              </div>
            </details>
          </section>

          {documentsProcessed ? (
          <section
            aria-labelledby="required-checks-heading"
            className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--color-brand)]">Step 3</p>
              <h2 className="font-serif text-2xl leading-tight" id="required-checks-heading">
                Complete required checks
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Confirm missing-page limitations and approve the suggested privacy masks.
              </p>
            </div>

            <details className="scroll-mt-28 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3" id="coverage" tabIndex={-1}>
              <summary className="cursor-pointer font-semibold">
                Coverage check · {state.coverage.hasConsequentialOpenIssue ? "needs review" : "ready"}
              </summary>
              <div className="mt-3">
                <CoverageManifest
                  coverage={state.coverage}
                  disabled={actionsDisabled}
                  onReviewIssue={reviewCoverageIssue}
                />
              </div>
            </details>

            <details
              className="scroll-mt-28 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3"
              id="masking"
              tabIndex={-1}
            >
              <summary className="cursor-pointer font-semibold">
                Privacy masking · {state.masking.reviewStatus === "approved" ? "approved" : "action required"}
              </summary>
              <div className="mt-3">
                <MaskingReviewPanel
                  disabled={actionsDisabled}
                  onAdd={addMask}
                  onComplete={completeMaskReview}
                  onRemove={removeMask}
                  onReview={reviewMask}
                  review={state.masking}
                  segmentIds={state.segments.map((segment) => segment.id)}
                />
              </div>
            </details>

            <details className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
              <summary className="cursor-pointer font-semibold">
                Optional: inspect redacted source text
              </summary>
              <section aria-labelledby="source-review-heading" className="mt-3 grid gap-4">
                <div>
                  <h3 className="font-serif text-lg leading-tight" id="source-review-heading">Source review</h3>
                  <p className="text-sm leading-5 text-[var(--color-ink-muted)]">
                    Redacted text is shown first. Original source text is revealed only after confirmation.
                  </p>
                </div>
                {state.segments.length === 0 ? (
                  <Alert title="Source text not processed" tone="warning">
                    <p>No extracted segment is available.</p>
                  </Alert>
                ) : (
                  <>
                    <div className="max-w-xl">
                      <label className="text-sm font-semibold block" htmlFor="source-segment-select">Source segment</label>
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
                    ) : null}
                  </>
                )}
              </section>
            </details>
          </section>
          ) : null}

          {documentsProcessed ? (
          <section aria-labelledby="start-analysis-heading" className="grid scroll-mt-28 gap-3" id="analysis" tabIndex={-1}>
            <div>
              <p className="text-sm font-semibold text-[var(--color-brand)]">Step 4</p>
              <h2 className="font-serif text-2xl leading-tight" id="start-analysis-heading">Start analysis</h2>
            </div>
            <AnalysisPrerequisites
              disabled={actionsDisabled}
              onStart={() => void startAnalysis()}
              result={analysisResult}
              state={state}
            />
            {reviewReady ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand)] px-4 py-2 font-semibold !text-white"
                href="/case/demo/review"
              >
                Continue to Review
              </Link>
            ) : null}
          </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
