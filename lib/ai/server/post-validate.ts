import "server-only";

import {
  AnalyzeResponseSchema,
  CaseCandidateSchema,
  ModelAnalysisProposalSchema,
  QuarantinedProposalSchema,
  type CaseCandidate,
  type Citation,
  type EvidenceDependency,
  type SafeShareRecipientCategory,
} from "../../contracts";
import { z } from "zod";
import {
  resolveCitation,
  type CitationFailureReason,
  type CitationSourceContext,
} from "../../citations";

type ModelAnalysisProposal = z.infer<typeof ModelAnalysisProposalSchema>;
type QuarantinedProposal = z.infer<typeof QuarantinedProposalSchema>;

export type PostValidationResult = {
  candidates: CaseCandidate[];
  citations: Citation[];
  quarantined: QuarantinedProposal[];
};

export type PostValidationInput = {
  caseId: string;
  safeShareRecipientCategory?: SafeShareRecipientCategory;
};

const CREATED_AT = "2026-07-16T00:00:00.000Z" as const;
const PROHIBITED_SCORE =
  /\b(?:case strength|credibility score|risk score|eligibility score|dangerousness score|priority score)\b/i;
const PROHIBITED_STATUS_DETERMINATION =
  /\b(?:(?:is|was|are|were|has been|have been)\s+(?:a\s+|an\s+)?(?:victim|trafficked|guilty|innocent|credible|incredible|eligible|ineligible|dangerous)|(?:confirmed|determined|established|proved|proven)\s+(?:as\s+)?(?:a\s+|an\s+)?(?:victim|trafficked|trafficking|guilt|guilty|innocence|eligibility|dangerousness))\b/i;
const INJECTION = /\b(?:system override|ignore previous|developer message|hidden instruction|jailbreak)\b/i;

export function postValidateAnalysisProposal(
  proposal: ModelAnalysisProposal,
  input: PostValidationInput,
  runId: string,
  sourceContext?: CitationSourceContext,
): PostValidationResult {
  const candidates: CaseCandidate[] = [];
  const citations: Citation[] = [];
  const quarantined: QuarantinedProposal[] = [];

  for (const [index, candidate] of proposal.candidates.entries()) {
    const proposalOrdinal = index + 1;
    const candidateId = candidateIdFor(proposalOrdinal, candidate.kind);
    const quarantineReason = policyReason(candidate.title, candidate.proposedText, candidate.reviewQuestion);
    if (quarantineReason) {
      quarantined.push(quarantine(proposalOrdinal, quarantineReason));
      continue;
    }

    const sourceDependencies: EvidenceDependency[] = [];
    let invalidReason: QuarantinedProposal["reasonCode"] | null = null;

    for (const [citationIndex, modelCitation] of candidate.citations.entries()) {
      const citationId = `CIT-${String(proposalOrdinal).padStart(4, "0")}-${String(citationIndex + 1).padStart(2, "0")}`;
      const resolved = resolveCitation(
        {
          id: citationId,
          analysisRunId: runId,
          candidateId,
          segmentId: modelCitation.segmentId,
          quotedText: modelCitation.quotedText,
          purpose:
            modelCitation.relationship === "context_only"
              ? "evidence_only"
              : "supporting_candidate",
          claimedEvidenceNature: modelCitation.evidenceNature,
          sourceEvidenceNature: modelCitation.evidenceNature,
          now: CREATED_AT,
        },
        sourceContext,
      );
      citations.push(resolved.citation);

      if (!resolved.ok && resolved.reason !== "ambiguous_exact_match") {
        invalidReason = reasonCode(resolved.reason);
      }
      if (resolved.ok || resolved.citation.validationStatus === "ambiguous_match") {
        sourceDependencies.push({
          id: `DEP-${String(proposalOrdinal).padStart(4, "0")}-${String(citationIndex + 1).padStart(2, "0")}`,
          kind: "source",
          sourceSegmentId: resolved.citation.segmentId,
          citationId,
          evidenceNature: modelCitation.evidenceNature,
          relationship: modelCitation.relationship,
          active: true,
        });
      }
    }

    if (invalidReason) {
      quarantined.push(quarantine(proposalOrdinal, invalidReason));
      continue;
    }
    if (candidate.citations.length > 0 && sourceDependencies.length !== candidate.citations.length) {
      quarantined.push(quarantine(proposalOrdinal, "INVALID_DEPENDENCY"));
      continue;
    }

    candidates.push(buildCandidate(candidate, candidateId, runId, sourceDependencies, input));
  }

  return {
    candidates: completeSourceGroundedContextGaps(candidates),
    citations,
    quarantined,
  };
}

export function assertAnalyzeResponse(value: unknown) {
  return AnalyzeResponseSchema.parse(value);
}

function buildCandidate(
  candidate: ModelAnalysisProposal["candidates"][number],
  id: string,
  runId: string,
  dependencies: EvidenceDependency[],
  input: PostValidationInput,
): CaseCandidate {
  const base = {
    id,
    revision: 0,
    caseId: input.caseId,
    analysisRunId: runId,
    lane: candidate.lane,
    title: candidate.title,
    proposedText: candidate.proposedText,
    currentText: candidate.proposedText,
    currentTextOrigin: "ai_suggestion" as const,
    itemOrigin: "ai_suggestion" as const,
    assertionMode: candidate.assertionMode,
    reviewRequirement: "individual" as const,
    inclusionStatus: "active" as const,
    supportStatus: dependencies.some((dependency) => dependency.relationship !== "context_only")
      ? ("exact_source_supported" as const)
      : ("insufficient_evidence" as const),
    reviewStatus: "pending" as const,
    dependencies,
    relatedCoverageIssueIds: [],
    unknowns: candidate.unknowns,
    reviewQuestion: candidate.reviewQuestion,
    consequential: candidate.assertionMode === "positive_proposition",
    prohibitedConclusionCheck: "passed" as const,
    safeShareRecipientCategories: [
      input.safeShareRecipientCategory ?? "legal_aid_team",
    ],
    createdAt: CREATED_AT,
  };

  if (candidate.kind === "timeline_event") {
    const datePrecision =
      candidate.datePrecision === "day" && !candidate.dateStart
        ? "unknown"
        : candidate.datePrecision ?? "unknown";
    return CaseCandidateSchema.parse({
      ...base,
      kind: "timeline_event",
      ...(datePrecision !== "unknown" && candidate.dateStart
        ? { dateStart: candidate.dateStart }
        : {}),
      ...(candidate.dateEnd ? { dateEnd: candidate.dateEnd } : {}),
      datePrecision,
      dateAlternatives: candidate.dateAlternatives ?? [],
      ...(candidate.locationLabel
        ? { locationLabel: candidate.locationLabel }
        : {}),
      actorLabels: candidate.actorLabels ?? [],
    });
  }
  if (candidate.kind === "context_gap") {
    return CaseCandidateSchema.parse({
      ...base,
      safeShareRecipientCategories: [],
      kind: "context_gap",
      response: null,
      responseStatus: "unanswered",
      responseEvidenceNature: "unknown",
      responseExplanation: null,
    });
  }
  if (candidate.kind === "nexus_relationship") {
    return CaseCandidateSchema.parse({
      ...base,
      id: `NEXUS-AI-${String(id.match(/\d+$/)?.[0] ?? "1").padStart(4, "0")}`,
      kind: "nexus_relationship",
      category: candidate.nexusCategory ?? inferNexusCategory(candidate),
      requiredDependencyIds: dependencies.map((dependency) => dependency.id),
      childCandidateIds: [],
      relationshipSummary: candidate.proposedText,
    });
  }
  return CaseCandidateSchema.parse({ ...base, kind: candidate.kind });
}

function completeSourceGroundedContextGaps(
  candidates: CaseCandidate[],
): CaseCandidate[] {
  const representedGapLanes = new Set(
    candidates.flatMap((candidate) =>
      candidate.kind === "context_gap" && candidate.lane
        ? [candidate.lane]
        : [],
    ),
  );
  const completed = [...candidates];
  const laneCodes = {
    trafficking_indicators: "A",
    non_punishment_relevance: "B",
    protection_remedy_urgency: "C",
  } as const;
  const laneOrder = [
    "trafficking_indicators",
    "non_punishment_relevance",
    "protection_remedy_urgency",
  ] as const;

  for (const lane of laneOrder) {
    if (representedGapLanes.has(lane)) continue;
    const sourceCandidate = candidates.find(
      (candidate) =>
        candidate.kind !== "context_gap" &&
        candidate.kind !== "timeline_event" &&
        candidate.kind !== "nexus_relationship" &&
        candidate.lane === lane &&
        candidate.inclusionStatus === "active" &&
        candidate.dependencies.some(
          (dependency) => dependency.kind === "source" && dependency.active,
        ),
    );
    if (!sourceCandidate) continue;

    const sourceDependencies = sourceCandidate.dependencies.flatMap(
      (dependency, index) =>
        dependency.kind === "source" && dependency.active
          ? [
              {
                ...dependency,
                id: `DEP-AI-GAP-${laneCodes[lane]}-${String(index + 1).padStart(2, "0")}`,
                relationship: "context_only" as const,
              },
            ]
          : [],
    );
    if (!sourceDependencies.length) continue;

    const text =
      `The current source-grounded analysis raises a review question related to “${sourceCandidate.title},” but it does not resolve the surrounding context. This gap is not a finding.`;
    completed.push(
      CaseCandidateSchema.parse({
        id: `CAND-AI-GAP-${laneCodes[lane]}`,
        revision: 0,
        caseId: sourceCandidate.caseId,
        analysisRunId: sourceCandidate.analysisRunId,
        kind: "context_gap",
        lane,
        title: `Context to verify · ${sourceCandidate.title}`,
        proposedText: text,
        currentText: text,
        currentTextOrigin: "ai_suggestion",
        itemOrigin: "ai_suggestion",
        assertionMode: "gap",
        reviewRequirement: "individual",
        inclusionStatus: "active",
        supportStatus: "insufficient_evidence",
        reviewStatus: "pending",
        dependencies: sourceDependencies,
        relatedCoverageIssueIds: sourceCandidate.relatedCoverageIssueIds,
        unknowns: [
          ...sourceCandidate.unknowns,
          "The cited source does not itself answer this gap, and missing information must not be treated as negative evidence.",
        ],
        reviewQuestion: gapQuestionForLane(lane),
        consequential: false,
        prohibitedConclusionCheck: "passed",
        safeShareRecipientCategories: [],
        createdAt: sourceCandidate.createdAt,
        response: null,
        responseStatus: "unanswered",
        responseEvidenceNature: "unknown",
        responseExplanation: null,
      }),
    );
  }

  return completed;
}

function gapQuestionForLane(
  lane:
    | "trafficking_indicators"
    | "non_punishment_relevance"
    | "protection_remedy_urgency",
) {
  if (lane === "trafficking_indicators") {
    return "What additional source or practitioner-confirmed context, if any, clarifies how this observation arose and whether the surrounding circumstances change its meaning?";
  }
  if (lane === "non_punishment_relevance") {
    return "What additional source or procedural record, if any, clarifies the reported conduct, pressure, timing, and current proceeding without assuming guilt or eligibility?";
  }
  return "What current practitioner-confirmed information, if any, clarifies the support need, urgency, consent, and safe-contact constraints without assuming that a need is established?";
}

function inferNexusCategory(
  candidate: ModelAnalysisProposal["candidates"][number],
) {
  const text = `${candidate.title} ${candidate.proposedText}`.toLowerCase();
  if (/recruit|decept|job offer/.test(text)) return "recruitment" as const;
  if (/mov|travel|transport|accommodation/.test(text)) return "movement" as const;
  if (/compel|task|conduct|ordered|forced to/.test(text)) return "compelled_tasks" as const;
  if (/offen[cs]e|arrest|charge|prosecut|timing/.test(text)) return "offence_timing" as const;
  if (
    candidate.lane === "protection_remedy_urgency" ||
    /urgent|safety|protection|remedy/.test(text)
  ) {
    return "urgency" as const;
  }
  return "control" as const;
}

function candidateIdFor(ordinal: number, kind: string): string {
  if (kind === "nexus_relationship") return `NEXUS-AI-${String(ordinal).padStart(4, "0")}`;
  return `CAND-AI-${String(ordinal).padStart(4, "0")}`;
}

function quarantine(proposalOrdinal: number, reasonCode: QuarantinedProposal["reasonCode"]): QuarantinedProposal {
  return QuarantinedProposalSchema.parse({
    id: `QUARANTINE-${String(proposalOrdinal).padStart(4, "0")}`,
    proposalOrdinal,
    reasonCode,
  });
}

function policyReason(
  ...texts: string[]
): QuarantinedProposal["reasonCode"] | null {
  const joined = texts.join("\n");
  if (INJECTION.test(joined)) return "INJECTION_PROPAGATION";
  if (
    PROHIBITED_SCORE.test(joined) ||
    PROHIBITED_STATUS_DETERMINATION.test(joined)
  ) {
    return "PROHIBITED_CONCLUSION";
  }
  return null;
}

function reasonCode(reason: CitationFailureReason | null): QuarantinedProposal["reasonCode"] {
  if (reason === "unknown_segment" || reason === "unknown_document" || reason === "unknown_page" || reason === "source_unavailable" || reason === "segment_not_allowlisted" || reason === "support_not_candidate_eligible") return "UNKNOWN_SOURCE";
  if (reason === "ambiguous_exact_match" || reason === "unsafe_normalized_ambiguity") return "AMBIGUOUS_QUOTE";
  if (reason === "evidence_nature_upgrade") return "EVIDENCE_NATURE_UPGRADE";
  return "QUOTE_NOT_EXACT";
}
