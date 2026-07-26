"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Lock } from "lucide-react";
import { useCaseState } from "../../components/shell";
import {
  Chip,
  DemoOnlyNotice,
  SectionTitle,
} from "../../components/lovable/nexus-ui";
import { Alert, Button, Card, Checkbox } from "../../components/ui";
import type { CaseCommand, ExportManifest, ExportSelection } from "../../lib/contracts";
import { renderExportJson, renderExportJsonBlob, SemanticExportPreview } from "../../lib/export/renderers";
import { ExportGatePanel } from "./export-gate-panel";
import { downloadLocalBlob, exportFilename } from "./local-download";

type PreviewTab = "semantic" | "json" | "pdf";

function commandMeta(caseRevision: number): CaseCommand["meta"] {
  const now = new Date().toISOString();
  const nonce = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    commandId: `CMD-EXPORT-${nonce}`,
    idempotencyKey: `IDEM-EXPORT-${nonce}`,
    expectedCaseRevision: caseRevision,
    actor: "current_practitioner",
    createdAt: now,
  };
}

function handoffLabel(kind: ExportSelection["kind"] | undefined) {
  return kind === "minimum_necessary_safe_share"
    ? "Minimum-necessary safe share"
    : "Full practitioner handoff";
}

function sameSelection(left: ExportSelection | undefined, right: ExportSelection) {
  if (!left || left.kind !== right.kind) return false;
  if (left.kind === "full_practitioner_handoff" || right.kind === "full_practitioner_handoff") return true;
  return left.minimumNecessarySelection.confirmed === right.minimumNecessarySelection.confirmed
    && left.minimumNecessarySelection.intendedRecipientCategory === right.minimumNecessarySelection.intendedRecipientCategory
    && left.minimumNecessarySelection.selectedCandidateIds.join("|") === right.minimumNecessarySelection.selectedCandidateIds.join("|")
    && left.minimumNecessarySelection.excludedCandidateIds.join("|") === right.minimumNecessarySelection.excludedCandidateIds.join("|");
}

function manifestStillCurrent(manifest: ExportManifest | null, selection: ExportSelection, caseRevision: number) {
  return Boolean(manifest && manifest.caseRevision === caseRevision && sameSelection(manifest.exportSelection, selection));
}

export function ExportWorkspace({
  caseBasePath = "/case/demo",
}: {
  caseBasePath?: string;
}) {
  const { state, dispatchCaseCommand } = useCaseState();
  const requestedKind = state.purposeBrief?.requestedExport;
  const allSelectableCandidates = useMemo(
    () => state.candidates
      .filter(
        (candidate) =>
          candidate.kind !== "context_gap" &&
          candidate.inclusionStatus === "active" &&
          candidate.reviewRequirement !== "optional",
      )
      .sort((left, right) => left.id.localeCompare(right.id)),
    [state.candidates],
  );
  const informationalCandidateCount = useMemo(
    () =>
      state.candidates.filter(
        (candidate) =>
          candidate.kind !== "context_gap" &&
          candidate.inclusionStatus === "active" &&
          candidate.reviewRequirement === "optional",
      ).length,
    [state.candidates],
  );
  const eligibleCandidateIds = useMemo(
    () =>
      new Set(
        allSelectableCandidates
          .filter(
            (candidate) =>
              candidate.safeShareRecipientCategories.includes(
                state.purposeBrief?.intendedRecipientCategory ??
                  "legal_aid_team",
              ) &&
              ["human_accepted", "human_edited"].includes(
                candidate.reviewStatus,
              ),
          )
          .map((candidate) => candidate.id),
      ),
    [
      allSelectableCandidates,
      state.purposeBrief?.intendedRecipientCategory,
    ],
  );
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [minimumConfirmed, setMinimumConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PreviewTab>("semantic");
  const [pdfState, setPdfState] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const gateHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (requestedKind !== "minimum_necessary_safe_share") {
      setSelectedCandidateIds([]);
      setMinimumConfirmed(false);
      return;
    }
    const saved = state.exportGate?.exportSelection.kind === "minimum_necessary_safe_share"
      ? state.exportGate.exportSelection.minimumNecessarySelection
      : state.currentExportManifest?.exportSelection.kind === "minimum_necessary_safe_share"
        ? state.currentExportManifest.exportSelection.minimumNecessarySelection
        : null;
    setSelectedCandidateIds(
      (saved?.selectedCandidateIds ?? []).filter((id) =>
        eligibleCandidateIds.has(id),
      ),
    );
    setMinimumConfirmed(saved?.confirmed ?? false);
  }, [
    eligibleCandidateIds,
    requestedKind,
    state.purposeBrief?.revision,
  ]);

  const selection = useMemo<ExportSelection>(() => {
    if (requestedKind !== "minimum_necessary_safe_share") {
      return { kind: "full_practitioner_handoff", minimumNecessarySelection: null };
    }
    const selected = [...selectedCandidateIds].sort();
    const selectedSet = new Set(selected);
    return {
      kind: "minimum_necessary_safe_share",
      minimumNecessarySelection: {
        confirmed: minimumConfirmed,
        intendedRecipientCategory: state.purposeBrief?.intendedRecipientCategory ?? "legal_aid_team",
        selectedCandidateIds: selected,
        excludedCandidateIds: allSelectableCandidates.map((candidate) => candidate.id).filter((id) => !selectedSet.has(id)),
      },
    };
  }, [allSelectableCandidates, minimumConfirmed, requestedKind, selectedCandidateIds, state.purposeBrief?.intendedRecipientCategory]);

  const gateMatchesSelection = sameSelection(state.exportGate?.exportSelection, selection);
  const readyGate = gateMatchesSelection && state.exportGate?.status === "ready" ? state.exportGate : null;
  const manifest = manifestStillCurrent(state.currentExportManifest, selection, state.caseRevision)
    ? state.currentExportManifest
    : null;
  const canonicalJson = manifest ? renderExportJson(manifest) : null;

  useEffect(() => {
    setPdfBlob(null);
    setPdfState("idle");
  }, [manifest?.id]);

  function focusGate() {
    const schedule = window.requestAnimationFrame ?? ((callback: FrameRequestCallback) => window.setTimeout(callback, 0));
    schedule(() => gateHeadingRef.current?.focus());
  }

  function evaluateGate() {
    setMessage(null);
    try {
      const result = dispatchCaseCommand({
        type: "evaluate_export_gate",
        meta: commandMeta(state.caseRevision),
        selection,
      });
      if (!result.ok) setMessage(`The export gate could not be evaluated (${result.reason}).`);
    } catch (error) {
      setMessage(error instanceof Error ? `The export gate rejected this selection (${error.message}).` : "The export gate rejected this selection.");
    }
    focusGate();
  }

  function createHandoff() {
    setMessage(null);
    try {
      const result = dispatchCaseCommand({
        type: "create_export",
        meta: commandMeta(state.caseRevision),
        selection,
      });
      if (!result.ok) setMessage(`The canonical handoff could not be created (${result.reason}).`);
      else setActiveTab("semantic");
    } catch {
      setMessage("The canonical handoff was not created because its gate is no longer ready. Review the gate again.");
    }
  }

  async function generatePdf() {
    if (!manifest) return;
    setPdfState("generating");
    setPdfBlob(null);
    try {
      // Keep the PDF renderer out of the route's initial module graph until this explicit action.
      const { renderExportPdf } = await import("../../lib/export/renderers/pdf");
      setPdfBlob(await renderExportPdf(manifest));
      setPdfState("ready");
    } catch {
      setPdfState("error");
    }
  }

  function selectTab(tab: PreviewTab) {
    setActiveTab(tab);
    const schedule = window.requestAnimationFrame ?? ((callback: FrameRequestCallback) => window.setTimeout(callback, 0));
    schedule(() => document.getElementById(`${tab}-tab`)?.focus());
  }

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const tabs: PreviewTab[] = ["semantic", "json", "pdf"];
    const current = tabs.indexOf(activeTab);
    const offset = event.key === "ArrowRight" ? 1 : -1;
    selectTab(tabs[(current + offset + tabs.length) % tabs.length]);
  }

  const gateStatus = !state.exportGate
    ? "Not evaluated"
    : state.exportGate.status === "ready" && gateMatchesSelection
      ? "Ready"
      : state.exportGate.status === "blocked" && gateMatchesSelection
        ? `Blocked (${state.exportGate.blockers.length})`
        : "Stale for this selection";
  const currentBlockerCount =
    gateMatchesSelection && state.exportGate?.status === "blocked"
      ? state.exportGate.blockers.length
      : 0;

  return (
    <div className="space-y-6">
      <SectionTitle
        actions={(
          <div className="flex items-center gap-2">
            <Chip tone={currentBlockerCount > 0 ? "rust" : readyGate ? "sage" : "amber"}>
              <Lock className="h-3 w-3" />
              {currentBlockerCount > 0
                ? `${currentBlockerCount} critical ${currentBlockerCount === 1 ? "blocker" : "blockers"}`
                : gateStatus}
            </Chip>
            <button
              className="cursor-not-allowed rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
              disabled
              type="button"
            >
              Create handoff
            </button>
          </div>
        )}
        description="Handoff fails closed. Critical blockers cannot be overridden."
        eyebrow="Stage 6 · Export"
        title="Export Gate"
      />

      {message ? <Alert title="Export action needs attention" tone="danger"><p>{message}</p></Alert> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3">
          <ExportGatePanel
            candidates={state.candidates}
            caseBasePath={caseBasePath}
            gate={gateMatchesSelection ? state.exportGate : null}
            headingRef={gateHeadingRef}
            onEvaluate={evaluateGate}
          />

          {requestedKind === "minimum_necessary_safe_share" ? (
            <Card className="grid gap-4">
              <header className="grid gap-1" id="minimum-necessary-selection" tabIndex={-1}>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Minimum necessity
                </p>
                <p className="sr-only">{handoffLabel(requestedKind)}</p>
                <h3 className="font-serif text-lg leading-tight">
                  Review included and excluded candidate IDs
                </h3>
                <p className="text-sm">
                  Recipient category: {state.purposeBrief?.intendedRecipientCategory}
                </p>
              </header>
              <fieldset className="grid gap-2">
                <legend className="text-sm font-semibold">Candidate selection</legend>
                {informationalCandidateCount > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {informationalCandidateCount} informational relationship{" "}
                    {informationalCandidateCount === 1 ? "row is" : "rows are"}{" "}
                    not part of minimum-necessary evidence selection and{" "}
                    {informationalCandidateCount === 1 ? "requires" : "require"}{" "}
                    no individual review.
                  </p>
                ) : null}
                {allSelectableCandidates.map((candidate) => {
                  const eligibleForRecipient =
                    candidate.safeShareRecipientCategories.includes(
                    state.purposeBrief?.intendedRecipientCategory ?? "legal_aid_team",
                  );
                  const reviewComplete = [
                    "human_accepted",
                    "human_edited",
                  ].includes(candidate.reviewStatus);
                  const eligible = eligibleForRecipient && reviewComplete;
                  const requiredCandidateIds = candidate.dependencies.flatMap(
                    (dependency) =>
                      !dependency.active || dependency.kind === "source"
                        ? []
                        : [
                            dependency.kind === "candidate"
                              ? dependency.candidateId
                              : dependency.nexusCandidateId,
                          ],
                  );
                  const missingRequiredIds = requiredCandidateIds.filter(
                    (id) => !selectedCandidateIds.includes(id),
                  );
                  const selectable =
                    eligible && missingRequiredIds.length === 0;
                  return (
                    <Checkbox
                      checked={selectedCandidateIds.includes(candidate.id)}
                      disabled={!selectable}
                      id={`safe-share-${candidate.id}`}
                      key={candidate.id}
                      label={(
                        <span>
                          <span className="font-semibold">{candidate.id}</span>
                          {" · "}
                          {!eligibleForRecipient
                            ? "not eligible for recipient"
                            : !reviewComplete
                              ? candidate.reviewStatus === "rejected"
                                ? "excluded after human rejection"
                                : candidate.reviewRequirement === "derived_summary"
                                  ? "available after reviewed dependencies are current"
                                  : "complete human review before sharing"
                            : missingRequiredIds.length > 0
                              ? `select required records first: ${missingRequiredIds.join(", ")}`
                              : "eligible for recipient"}
                        </span>
                      )}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        setSelectedCandidateIds((current) => checked
                          ? [...current, candidate.id].sort()
                          : current.filter((id) => id !== candidate.id));
                        setMinimumConfirmed(false);
                      }}
                    />
                  );
                })}
              </fieldset>
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="font-semibold">Included IDs</dt>
                  <dd className="break-words">
                    {selection.minimumNecessarySelection?.selectedCandidateIds.join(", ") || "None selected"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Excluded IDs</dt>
                  <dd className="break-words">
                    {selection.minimumNecessarySelection?.excludedCandidateIds.join(", ") || "None excluded"}
                  </dd>
                </div>
              </dl>
            </Card>
          ) : null}
        </div>

        <aside className="rounded-xl border border-border bg-card p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Handoff option
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([
              ["full_practitioner_handoff", "Full Practitioner Handoff", "All source-linked observations and reviewed notes."],
              ["minimum_necessary_safe_share", "Minimum-Necessary Safe Share", "Only the fields required by the named recipient and declared purpose."],
            ] as const).map(([kind, title, description]) => (
              <div
                className={`rounded-md border p-3 text-left text-xs ${
                  requestedKind === kind
                    ? "border-[color:var(--amber)] bg-[color-mix(in_oklab,var(--amber)_10%,transparent)]"
                    : "border-border"
                }`}
                key={kind}
              >
                <div className="font-serif text-sm">{title}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{description}</div>
              </div>
            ))}
          </div>
          <a
            className="sr-only"
            href={`${caseBasePath}/purpose#requested-export`}
          >
            Change handoff kind in Purpose
          </a>

          <div className="mt-4 rounded-lg border border-border">
            <div aria-label="Handoff previews" className="flex border-b border-border" role="tablist">
              {(["semantic", "json", "pdf"] as const).map((tab) => (
                <button
                  aria-controls={`${tab}-panel`}
                  aria-label={
                    tab === "semantic"
                      ? "Readable preview"
                      : tab === "json"
                        ? "Structured JSON"
                        : "PDF preview"
                  }
                  aria-selected={activeTab === tab}
                  className={`flex-1 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] ${
                    activeTab === tab
                      ? "border-b-2 border-[color:var(--amber)] text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  id={`${tab}-tab`}
                  key={tab}
                  onClick={() => selectTab(tab)}
                  onKeyDown={handleTabKey}
                  role="tab"
                  tabIndex={activeTab === tab ? 0 : -1}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>
            <div
              aria-labelledby={`${activeTab}-tab`}
              className="min-h-72 min-w-0 max-h-96 overflow-auto p-3 text-xs"
              id={`${activeTab}-panel`}
              role="tabpanel"
              tabIndex={0}
            >
              {!manifest || !canonicalJson ? (
                <div className="grid place-items-center rounded border border-dashed border-border bg-muted/30 py-10 text-center">
                  <div className="font-serif text-lg">
                    {activeTab === "semantic"
                      ? "No canonical handoff created."
                      : activeTab === "json"
                        ? "No canonical JSON created."
                        : "No PDF generated."}
                  </div>
                  <div className="mt-1 max-w-xs text-[11px] text-muted-foreground">
                    {activeTab === "pdf"
                      ? "PDF generation stays unavailable until one reviewed canonical manifest exists."
                      : "Check readiness and resolve every blocker before a preview can be generated."}
                  </div>
                </div>
              ) : activeTab === "semantic" ? (
                <SemanticExportPreview manifest={manifest} />
              ) : activeTab === "json" ? (
                <pre className="min-w-0 max-w-full whitespace-pre-wrap break-all font-mono text-[11px]">
                  {canonicalJson}
                </pre>
              ) : (
                <div className="grid place-items-center rounded border border-dashed border-border bg-muted/30 py-10 text-center">
                  <div className="font-serif text-base">
                    {pdfState === "ready" ? "PDF is ready for local download." : "No PDF generated yet."}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    PDF generation uses the same canonical manifest and stays in this browser.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-md border border-border p-3">
            {requestedKind === "minimum_necessary_safe_share" ? (
              <label className="flex items-start gap-2 text-xs">
                <input
                  checked={minimumConfirmed}
                  className="mt-0.5"
                  id="minimum-necessity-confirmed"
                  onChange={(event) => setMinimumConfirmed(event.currentTarget.checked)}
                  type="checkbox"
                />
                <span>
                  I confirm this is the minimum necessary candidate selection for the Purpose recipient.
                </span>
              </label>
            ) : (
              <label className="flex items-start gap-2 text-xs">
                <input
                  checked={Boolean(readyGate)}
                  className="mt-0.5"
                  disabled
                  readOnly
                  type="checkbox"
                />
                <span>
                  Canonical readiness confirms that review, masking, and handoff checks are current
                  for the declared recipient and purpose.
                </span>
              </label>
            )}
          </div>

          {readyGate && !manifest ? (
            <Button className="mt-3 w-full" onClick={createHandoff} variant="primary">
              Create reviewed handoff
            </Button>
          ) : (
            <button
              className="mt-3 w-full cursor-not-allowed rounded-md bg-muted py-2 text-sm text-muted-foreground"
              disabled
              type="button"
            >
              {manifest ? "Handoff created" : "Create handoff (disabled)"}
            </button>
          )}

          {manifest ? (
            <>
              <details className="mt-4 rounded-md border border-border p-3 text-xs">
                <summary className="cursor-pointer font-medium">Technical manifest details</summary>
                <dl className="mt-2 grid gap-2">
                  <div><dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Manifest ID</dt><dd className="break-all">{manifest.id}</dd></div>
                  <div><dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Reviewed-state hash</dt><dd className="break-all">{manifest.reviewedStateHash}</dd></div>
                </dl>
              </details>
              <div className="mt-3 grid gap-2">
                <Button disabled={pdfState === "generating"} onClick={() => void generatePdf()} variant="primary">
                  {pdfState === "generating" ? "Generating PDF locally…" : "Generate PDF locally"}
                </Button>
                {pdfBlob ? (
                  <Button onClick={() => downloadLocalBlob(pdfBlob, exportFilename("pdf", manifest.id))}>Download PDF locally</Button>
                ) : null}
                <Button onClick={() => downloadLocalBlob(renderExportJsonBlob(manifest), exportFilename("json", manifest.id))}>Download JSON locally</Button>
              </div>
              {pdfState === "ready" ? <p className="mt-2" role="status">PDF is ready for local download from the same canonical manifest.</p> : null}
              {pdfState === "error" ? <div className="mt-3"><Alert title="PDF generation failed" tone="danger"><p>The local PDF could not be generated. The semantic preview and canonical JSON remain available.</p></Alert></div> : null}
            </>
          ) : null}

          <div className="mt-3">
            <DemoOnlyNotice>
              downloads are created locally from one reviewed manifest and are never transmitted here.
            </DemoOnlyNotice>
          </div>
        </aside>
      </div>
    </div>
  );
}
