"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useCaseState } from "../../components/shell";
import { Alert, Button, Card, Checkbox } from "../../components/ui";
import type { CaseCommand, ExportManifest, ExportSelection } from "../../lib/contracts";
import { renderExportJson, renderExportJsonBlob, SemanticExportPreview } from "../../lib/export/renderers";
import { ExportGatePanel } from "./export-gate-panel";
import { downloadLocalBlob, exportFilename } from "./local-download";

type PreviewTab = "semantic" | "json";

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

export function ExportWorkspace() {
  const { state, dispatchCaseCommand } = useCaseState();
  const requestedKind = state.purposeBrief?.requestedExport;
  const allSelectableCandidates = useMemo(
    () => state.candidates
      .filter((candidate) => candidate.kind !== "context_gap" && candidate.inclusionStatus === "active")
      .sort((left, right) => left.id.localeCompare(right.id)),
    [state.candidates],
  );
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [minimumConfirmed, setMinimumConfirmed] = useState(false);
  const [showGatePanel, setShowGatePanel] = useState(false);
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
    setSelectedCandidateIds(saved?.selectedCandidateIds ?? []);
    setMinimumConfirmed(saved?.confirmed ?? false);
  }, [requestedKind, state.purposeBrief?.revision]);

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

  useEffect(() => {
    if (state.exportGate) setShowGatePanel(true);
  }, [state.exportGate?.id]);

  function focusGate() {
    setShowGatePanel(true);
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
    selectTab(activeTab === "semantic" ? "json" : "semantic");
  }

  const gateStatus = !state.exportGate
    ? "Not evaluated"
    : state.exportGate.status === "ready" && gateMatchesSelection
      ? "Ready"
      : state.exportGate.status === "blocked" && gateMatchesSelection
        ? `Blocked (${state.exportGate.blockers.length})`
        : "Stale for this selection";

  return (
    <div className="grid min-w-0 gap-6">
      <header className="grid gap-2">
        <p className="cfn-type-label text-[var(--color-ink-muted)]">Final step</p>
        <h2 className="cfn-type-heading-2">Create your handoff</h2>
        <p className="max-w-[780px]">
          Check that the case is ready, create the reviewed handoff, then download it locally. Nothing is sent from this page.
        </p>
      </header>

      <details className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <summary className="cursor-pointer font-semibold">Handoff settings</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div><p className="cfn-type-label">Handoff type</p><p>{handoffLabel(requestedKind)}</p></div>
          <div><p className="cfn-type-label">Recipient</p><p>{state.purposeBrief?.intendedRecipient ?? "Complete the Case Purpose Brief"}</p></div>
          <div><p className="cfn-type-label">Readiness</p><p>{gateStatus}</p></div>
        </div>
        <a className="mt-4 inline-flex min-h-10 w-fit items-center rounded-[var(--radius-control)] border border-[var(--color-control-border)] px-3 py-2 text-sm font-semibold" href="/case/demo/purpose#requested-export">
          Change handoff kind in Purpose
        </a>
      </details>

      {requestedKind === "minimum_necessary_safe_share" ? (
        <Card className="grid gap-4" >
          <header className="grid gap-1" id="minimum-necessary-selection" tabIndex={-1}>
            <p className="cfn-type-label text-[var(--color-ink-muted)]">Minimum necessity</p>
            <h3 className="cfn-type-heading-3">Review included and excluded candidate IDs</h3>
            <p>Recipient category: {state.purposeBrief?.intendedRecipientCategory}</p>
          </header>
          <fieldset className="grid gap-2">
            <legend className="cfn-type-label">Candidate selection</legend>
            {allSelectableCandidates.map((candidate) => {
              const eligible = candidate.safeShareRecipientCategories.includes(state.purposeBrief?.intendedRecipientCategory ?? "legal_aid_team");
              return (
                <Checkbox
                  checked={selectedCandidateIds.includes(candidate.id)}
                  id={`safe-share-${candidate.id}`}
                  key={candidate.id}
                  label={<span><span className="font-semibold">{candidate.id}</span> · {eligible ? "eligible for recipient" : "not eligible for recipient"}</span>}
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
            <div><dt className="cfn-type-label">Included IDs</dt><dd className="break-words">{selection.minimumNecessarySelection?.selectedCandidateIds.join(", ") || "None selected"}</dd></div>
            <div><dt className="cfn-type-label">Excluded IDs</dt><dd className="break-words">{selection.minimumNecessarySelection?.excludedCandidateIds.join(", ") || "None excluded"}</dd></div>
          </dl>
          <Checkbox
            checked={minimumConfirmed}
            id="minimum-necessity-confirmed"
            label="I confirm this is the minimum necessary candidate selection for the Purpose recipient."
            onChange={(event) => setMinimumConfirmed(event.currentTarget.checked)}
          />
        </Card>
      ) : null}

      {message ? <Alert title="Export action needs attention" tone="danger"><p>{message}</p></Alert> : null}

      <section className={`grid gap-4 rounded-[var(--radius-card)] border p-5 ${readyGate ? "border-[var(--color-supported)] bg-[var(--color-supported-subtle)]" : "border-[var(--color-brand)] bg-[var(--color-brand-subtle)]"}`}>
        <div>
          <p className="cfn-type-label">{readyGate ? "Ready for handoff" : "Check readiness"}</p>
          <h3 className="cfn-type-heading-3">
            {readyGate ? "All required checks passed" : "Make sure every required review is complete"}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {readyGate
              ? "Create the reviewed handoff from the current case state."
              : "The readiness check will show one clear list of anything that still needs attention."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!readyGate ? <Button onClick={evaluateGate} variant="primary">Check readiness</Button> : null}
          {readyGate && !manifest ? <Button onClick={createHandoff} variant="primary">Create reviewed handoff</Button> : null}
          {readyGate ? <Button onClick={evaluateGate} variant="secondary">Check again</Button> : null}
        </div>
      </section>

      {showGatePanel ? <ExportGatePanel gate={gateMatchesSelection ? state.exportGate : null} headingRef={gateHeadingRef} /> : null}

      {manifest && canonicalJson ? (
        <Card className="grid min-w-0 gap-5">
          <header className="grid gap-1">
            <p className="cfn-type-label text-[var(--color-supported)]">Handoff created</p>
            <h3 className="cfn-type-heading-3">Preview and download</h3>
            <p className="text-sm text-[var(--color-ink-muted)]">Both downloads use this same reviewed case snapshot.</p>
          </header>

          <details className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 text-sm">
            <summary className="cursor-pointer font-semibold">Technical manifest details</summary>
            <dl className="mt-3 grid gap-2">
              <div><dt className="cfn-type-label">Manifest ID</dt><dd className="break-all">{manifest.id}</dd></div>
              <div><dt className="cfn-type-label">Reviewed-state hash</dt><dd className="break-all">{manifest.reviewedStateHash}</dd></div>
            </dl>
          </details>

          <div aria-label="Handoff previews" className="flex flex-wrap gap-2" role="tablist">
            {(["semantic", "json"] as const).map((tab) => (
              <button
                aria-controls={`${tab}-panel`}
                aria-selected={activeTab === tab}
                className="cfn-control-target rounded-[var(--radius-control)] border border-[var(--color-control-border)] px-3 py-2 font-semibold"
                id={`${tab}-tab`}
                key={tab}
                onClick={() => selectTab(tab)}
                onKeyDown={handleTabKey}
                role="tab"
                tabIndex={activeTab === tab ? 0 : -1}
                type="button"
              >
                {tab === "semantic" ? "Readable preview" : "Structured JSON"}
              </button>
            ))}
          </div>

          <div aria-labelledby={`${activeTab}-tab`} className="min-w-0" id={`${activeTab}-panel`} role="tabpanel" tabIndex={0}>
            {activeTab === "semantic" ? <SemanticExportPreview manifest={manifest} /> : (
              <div className="grid min-w-0 gap-3">
                <h4 className="font-semibold">Canonical structured JSON</h4>
                <pre className="min-w-0 max-w-full whitespace-pre-wrap break-all rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)] p-3 text-xs">{canonicalJson}</pre>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button disabled={pdfState === "generating"} onClick={() => void generatePdf()} variant="primary">
              {pdfState === "generating" ? "Generating PDF locally…" : "Generate PDF locally"}
            </Button>
            {pdfBlob ? (
              <Button onClick={() => downloadLocalBlob(pdfBlob, exportFilename("pdf", manifest.id))}>Download PDF locally</Button>
            ) : null}
            <Button onClick={() => downloadLocalBlob(renderExportJsonBlob(manifest), exportFilename("json", manifest.id))}>Download JSON locally</Button>
          </div>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Downloads are created only in this browser. Sharing a downloaded copy happens outside this app.
          </p>
          {pdfState === "ready" ? <p role="status">PDF is ready for local download from the same canonical manifest.</p> : null}
          {pdfState === "error" ? <Alert title="PDF generation failed" tone="danger"><p>The local PDF could not be generated. The semantic preview and canonical JSON remain available.</p></Alert> : null}
        </Card>
      ) : null}
    </div>
  );
}
