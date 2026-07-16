import type { ExportManifest } from "../../contracts";

export type ExportDocumentSection = Readonly<{
  id: string;
  title: string;
  items: readonly string[];
}>;

function value(value: string | number | boolean | null | undefined) {
  return value === null || value === undefined || value === "" ? "Not recorded" : String(value);
}

function candidateLines(manifest: ExportManifest) {
  return manifest.includedCandidates.flatMap((candidate) => [
    `${candidate.candidateId} — ${candidate.effectiveReviewedText}`,
    `Review: ${candidate.reviewStatus}; support: ${candidate.supportStatus}; origin: ${candidate.currentTextOrigin}; assertion: ${candidate.assertionMode}.`,
    ...candidate.dependencies.map((dependency) => {
      if (dependency.kind === "source") {
        return `Dependency ${dependency.dependencyId}: source citation ${dependency.citationId} (${dependency.relationship}; ${dependency.evidenceNature}).`;
      }
      const target = dependency.kind === "candidate" ? dependency.candidateId : dependency.nexusCandidateId;
      return `Dependency ${dependency.dependencyId}: ${target} (${dependency.relationship}).`;
    }),
    ...candidate.unknowns.map((unknown) => `Unknown: ${unknown}`),
    ...candidate.limitationTexts.map((limitation) => `Limitation: ${limitation}`),
  ]);
}

function gapLines(manifest: ExportManifest) {
  return manifest.reviewedGaps.flatMap((gap) => [
    `${gap.candidateId} — ${gap.effectiveReviewedText}`,
    `Review: ${gap.reviewStatus}; response: ${gap.responseStatus}; evidence nature: ${gap.responseEvidenceNature}.`,
    gap.response ? `Reviewed response: ${gap.response}` : "Reviewed response: preserved as unknown.",
    gap.responseExplanation ? `Explanation: ${gap.responseExplanation}` : "",
  ].filter(Boolean));
}

function runLines(manifest: ExportManifest) {
  const run = manifest.runManifest;
  return [
    `Run ID: ${run.id}. Mode: ${run.mode}. Status: ${run.status}.`,
    `Provider: ${run.provider.providerId}; release: ${run.provider.releaseConfigurationId}; requested model: ${run.provider.requestedModel}; returned model: ${value(run.provider.returnedModel)}.`,
    `Service tier: ${run.provider.serviceTier}; adapter: ${run.provider.adapterVersion}; disclosure: ${run.provider.disclosureVersion}; provider transmission: ${run.provider.providerTransmission}.`,
    `Prompt: ${run.promptVersion}; request contract: ${run.requestSchemaVersion}; response contract: ${run.responseSchemaVersion}; fixture: ${run.fixtureVersion}; ruleset: ${run.rulesetVersion}.`,
    run.checkpointProvenance
      ? `Checkpoint: ${run.checkpointProvenance.checkpointId}; checkpoint version: ${run.checkpointProvenance.checkpointVersion}; replay version: ${run.checkpointProvenance.replayVersion}.`
      : "Checkpoint: none.",
    `Recovery: ${value(run.recovery.selectionReason)}; recovery of run: ${value(run.recovery.recoveryOfRunId)}; automatic failover: ${run.recovery.automaticFailover}; outputs merged: ${run.recovery.outputsMerged}.`,
  ];
}

export function buildExportDocumentSections(manifest: ExportManifest): readonly ExportDocumentSection[] {
  const selection = manifest.exportSelection.minimumNecessarySelection;
  return [
    {
      id: "handoff-summary",
      title: "Handoff summary",
      items: [
        `Manifest ID: ${manifest.id}. Reviewed-state hash: ${manifest.reviewedStateHash}.`,
        `Case: ${manifest.caseId}; case revision: ${manifest.caseRevision}; generated: ${manifest.generatedAt}.`,
        `Handoff kind: ${manifest.kind}; synthetic: ${manifest.synthetic}; redaction check: ${manifest.redactionCheck}.`,
        `Purpose: ${manifest.purposeSummary.sanitizedPurpose}`,
        `Recipient category: ${manifest.purposeSummary.intendedRecipientCategory}; jurisdiction: ${manifest.purposeSummary.jurisdictionCode}.`,
        `Excluded decisions: ${manifest.purposeSummary.excludedDecisions.join(", ")}.`,
      ],
    },
    {
      id: "required-labels",
      title: "Required labels",
      items: manifest.labels,
    },
    {
      id: "minimum-necessary-selection",
      title: "Minimum-necessary selection",
      items: selection
        ? [
            `Confirmed: ${selection.confirmed}; recipient category: ${selection.intendedRecipientCategory}.`,
            `Included candidate IDs: ${selection.selectedCandidateIds.join(", ") || "None"}.`,
            `Excluded candidate IDs: ${selection.excludedCandidateIds.join(", ") || "None"}.`,
          ]
        : ["Full practitioner handoff selected in the Case Purpose Brief; no safe-share subset applies."],
    },
    {
      id: "reviewed-findings",
      title: "Reviewed findings and evidence relationships",
      items: candidateLines(manifest).length > 0 ? candidateLines(manifest) : ["No eligible reviewed findings were included."],
    },
    {
      id: "reviewed-gaps",
      title: "Reviewed unknowns and gaps",
      items: gapLines(manifest).length > 0 ? gapLines(manifest) : ["No reviewed gaps were included."],
    },
    {
      id: "citations",
      title: "Exact reviewed citations",
      items: manifest.citations.length > 0
        ? manifest.citations.flatMap((citation) => [
            `${citation.citationId} — document ${citation.documentId}, segment ${citation.segmentId}, page ${value(citation.pageNumber)}.`,
            `Validation: ${citation.validationStatus}; extraction: ${citation.extractionQuality}; source language: ${citation.sourceLanguage}; translation: ${citation.translationStatus}.`,
            `Approved redacted quote: ${citation.redactedQuotedText}`,
          ])
        : ["No source citation is included in this purpose-bound projection."],
    },
    {
      id: "coverage",
      title: "Coverage and contrary or limiting context",
      items: [
        `Documents processed: ${manifest.coverage.processedDocuments} of ${manifest.coverage.expectedDocuments}; pages available: ${manifest.coverage.availablePages} of ${manifest.coverage.expectedPages}.`,
        `Consequential open issue: ${manifest.coverage.hasConsequentialOpenIssue}.`,
        ...manifest.coverage.issues.map((issue) => `Coverage issue ${issue.id}: ${issue.rationale} (${issue.activeConsequence}; ${issue.resolutionStatus}).`),
        ...manifest.coverageLimitations.map((limitation) => `Reviewed coverage limitation ${limitation.issueId}: ${limitation.limitationText}`),
      ],
    },
    {
      id: "limitations",
      title: "Limitations",
      items: manifest.limitations.length > 0 ? manifest.limitations : ["No additional limitation was recorded."],
    },
    {
      id: "guidance",
      title: "Guidance scope and local verification",
      items: manifest.guidanceCards.length > 0
        ? manifest.guidanceCards.flatMap((card) => [
            `${card.id} — ${card.issuer}, ${card.title}. Source ${card.sourceRegisterId}; version ${card.sourceVersion}; publication/version date ${card.publicationOrVersionDate}.`,
            `Scope: ${card.jurisdictionOrScope}; locator: ${card.locator}; verification: ${card.verificationStatus}.`,
            `Allowed use: ${card.allowedUse}`,
            `Limitation: ${card.limitation}`,
            `Local legal verification required: ${card.localLegalVerificationRequired}.`,
          ])
        : ["No guidance card is included in this projection."],
    },
    {
      id: "review-actions",
      title: "Human review actions",
      items: manifest.reviewDecisions.length > 0
        ? manifest.reviewDecisions.map((decision) => `${decision.decisionId}: ${decision.action} for ${decision.candidateId}; resulting status ${decision.resultingStatus}; actor ${decision.actor}; ${decision.createdAt}.`)
        : ["No review action is included in this projection."],
    },
    {
      id: "audit-provenance",
      title: "Safe audit provenance",
      items: manifest.auditEvents.length > 0
        ? manifest.auditEvents.map((event) => `${event.auditId}, sequence ${event.sequence}: ${event.eventType}; entities ${event.entityIds.join(", ") || "none"}; ${event.safeSummary}; ${event.createdAt}.`)
        : ["No audit event is included in this projection."],
    },
    {
      id: "run-provenance",
      title: "Single-run provenance",
      items: runLines(manifest),
    },
  ];
}
