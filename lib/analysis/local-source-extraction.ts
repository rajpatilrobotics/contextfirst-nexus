import {
  AnalysisRunSchema,
  CaseCandidateSchema,
  CitationSchema,
  type AnalysisRun,
  type CaseCandidate,
  type Citation,
  type DocumentRecord,
  type RunInputStateProvenance,
  type SourceSegment,
} from "../contracts";

const VERSION = "1.0.0" as const;
const DEFAULT_RUN_ID = "RUN-LOCAL-SOURCE-001";
const DEFAULT_MAX_ITEMS = 50;
const MAX_ITEMS = 100;
const MAX_CANDIDATE_EXCERPT = 900;

export type LocalSourceExtractionOptions = {
  inputState: RunInputStateProvenance;
  runId?: string;
  completedAt?: string;
  maxItems?: number;
};

export type LocalSourceExtractionResult = {
  run: AnalysisRun;
  candidates: CaseCandidate[];
  citations: Citation[];
};

function normalizeQuotedText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function candidateExcerpt(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= MAX_CANDIDATE_EXCERPT) return compact;
  return `${compact.slice(0, MAX_CANDIDATE_EXCERPT - 1).trimEnd()}…`;
}

function orderedReadableSegments(
  documents: readonly DocumentRecord[],
  segments: readonly SourceSegment[],
) {
  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const unique = new Map<string, SourceSegment>();

  for (const segment of segments) {
    if (
      segment.extractionQuality === "unavailable" ||
      segment.supportEligibility !== "candidate_eligible" ||
      !segment.rawText.trim() ||
      !segment.redactedText.trim()
    ) {
      continue;
    }
    if (!documentsById.has(segment.documentId)) {
      throw new Error(`Source segment ${segment.id} does not reference an available document.`);
    }
    if (!unique.has(segment.id)) unique.set(segment.id, segment);
  }

  return [...unique.values()].sort((left, right) => {
    const documentOrder = left.documentId.localeCompare(right.documentId);
    if (documentOrder !== 0) return documentOrder;
    const pageOrder = (left.pageNumber ?? Number.MAX_SAFE_INTEGER) -
      (right.pageNumber ?? Number.MAX_SAFE_INTEGER);
    if (pageOrder !== 0) return pageOrder;
    const ordinalOrder = left.ordinal - right.ordinal;
    return ordinalOrder !== 0 ? ordinalOrder : left.id.localeCompare(right.id);
  });
}

/**
 * Builds a local, source-only review queue. It deliberately makes no legal,
 * credibility, trafficking, or other substantive inference from the text.
 */
export function buildLocalSourceExtraction(
  documents: readonly DocumentRecord[],
  segments: readonly SourceSegment[],
  options: LocalSourceExtractionOptions,
): LocalSourceExtractionResult {
  const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
  if (!Number.isInteger(maxItems) || maxItems < 1 || maxItems > MAX_ITEMS) {
    throw new Error(`maxItems must be an integer between 1 and ${MAX_ITEMS}.`);
  }

  const runId = options.runId ?? DEFAULT_RUN_ID;
  const completedAt = options.completedAt ?? new Date().toISOString();
  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const selectedSegmentIds = new Set(options.inputState.selectedSegmentIds);
  const selectedSegments = orderedReadableSegments(
    documents,
    segments.filter((segment) => selectedSegmentIds.has(segment.id)),
  ).slice(0, maxItems);

  if (selectedSegments.length === 0) {
    throw new Error("Local source extraction requires at least one readable, candidate-eligible segment.");
  }

  const candidates: CaseCandidate[] = [];
  const citations: Citation[] = [];

  for (const segment of selectedSegments) {
    const document = documentsById.get(segment.documentId)!;
    const suffix = segment.id;
    const citationId = `CIT-LOCAL-${suffix}`;
    const pageLabel = segment.pageNumber ? `, page ${segment.pageNumber}` : "";
    const excerpt = candidateExcerpt(segment.redactedText);

    const citation = CitationSchema.parse({
      id: citationId,
      caseId: "CFN-DEMO-001",
      analysisRunId: runId,
      documentId: segment.documentId,
      ...(segment.pageNumber ? { pageNumber: segment.pageNumber } : {}),
      segmentId: segment.id,
      quotedText: segment.redactedText,
      normalizedQuotedText: normalizeQuotedText(segment.redactedText),
      quoteForm: "approved_redacted_derivative",
      redactionMapVersion: VERSION,
      sourceLanguage: segment.sourceLanguage,
      translationStatus: segment.translationStatus,
      extractionQuality: segment.extractionQuality,
      validationStatus: "exact_match",
      redactedSegmentRange: { start: 0, end: segment.redactedText.length },
      sourceSegmentRange: { start: 0, end: segment.rawText.length },
      boundingBoxes: segment.boundingBoxes,
      resolutionMethod: "exact_codepoint",
      resolvedBy: "system",
      validatedAt: completedAt,
    });

    const candidate = CaseCandidateSchema.parse({
      id: `CAND-LOCAL-${suffix}`,
      revision: 0,
      caseId: "CFN-DEMO-001",
      analysisRunId: runId,
      kind: "review_lane_item",
      title: `Source excerpt: ${document.displayName}${pageLabel}`,
      proposedText: `Extracted source text for human review: “${excerpt}”`,
      currentText: `Extracted source text for human review: “${excerpt}”`,
      currentTextOrigin: "source_extraction",
      itemOrigin: "source_extraction",
      assertionMode: "neutral_procedural_fact",
      reviewRequirement: "individual",
      inclusionStatus: "active",
      supportStatus: "exact_source_supported",
      reviewStatus: "pending",
      dependencies: [
        {
          id: `DEP-LOCAL-${suffix}`,
          kind: "source",
          sourceSegmentId: segment.id,
          citationId,
          evidenceNature: "documented_in_source",
          relationship: "context_only",
          active: true,
        },
      ],
      relatedCoverageIssueIds: [],
      unknowns: ["No substantive inference was generated from this source excerpt."],
      reviewQuestion:
        "Is this extracted source text accurate and relevant enough to retain for human review?",
      consequential: false,
      prohibitedConclusionCheck: "passed",
      safeShareRecipientCategories: [],
      createdAt: completedAt,
    });

    citations.push(citation);
    candidates.push(candidate);
  }

  const run = AnalysisRunSchema.parse({
    id: runId,
    mode: "deterministic_replay",
    provider: {
      providerId: "local_replay",
      releaseConfigurationId: "prepared-replay-v1",
      requestedModel: "frozen_replay_output",
      serviceTier: "local",
      adapterVersion: "local-source-extraction-v1",
      returnedModel: null,
      inferenceSetting: { kind: "not_applicable", value: "not_applicable" },
      disclosureVersion: VERSION,
      providerTransmission: false,
    },
    promptVersion: VERSION,
    requestSchemaVersion: VERSION,
    responseSchemaVersion: VERSION,
    fixtureVersion: VERSION,
    rulesetVersion: VERSION,
    checkpointProvenance: null,
    startedAt: completedAt,
    completedAt,
    durationMs: 0,
    inputSegmentCount: selectedSegments.length,
    candidateCount: candidates.length,
    citationCount: citations.length,
    quarantinedCount: 0,
    status: "succeeded",
    failure: null,
    recovery: {
      recoveryOfRunId: null,
      selectionReason: "explicit_deterministic_replay",
      selectedBy: "practitioner",
      automaticFailover: false,
      outputsMerged: false,
    },
    inputState: options.inputState,
  });

  return { run, candidates, citations };
}
