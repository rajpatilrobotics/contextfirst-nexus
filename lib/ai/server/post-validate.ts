import "server-only";

import {
  AnalyzeResponseSchema,
  CaseCandidateSchema,
  ModelAnalysisProposalSchema,
  QuarantinedProposalSchema,
  type CaseCandidate,
  type Citation,
  type EvidenceDependency,
} from "../../contracts";
import { z } from "zod";
import { resolveCitation, type CitationFailureReason } from "../../citations";
import type { CanonicalProviderInput } from "./types";

type ModelAnalysisProposal = z.infer<typeof ModelAnalysisProposalSchema>;
type QuarantinedProposal = z.infer<typeof QuarantinedProposalSchema>;

export type PostValidationResult = {
  candidates: CaseCandidate[];
  citations: Citation[];
  quarantined: QuarantinedProposal[];
};

const CREATED_AT = "2026-07-16T00:00:00.000Z" as const;
const PROHIBITED = /\b(?:victim|traffick(?:ed|ing)|guilt|guilty|credib(?:le|ility)|case strength|risk score|eligibility score|dangerousness|priority score)\b/i;
const INJECTION = /\b(?:system override|ignore previous|developer message|hidden instruction|jailbreak)\b/i;

export function postValidateAnalysisProposal(
  proposal: ModelAnalysisProposal,
  input: CanonicalProviderInput,
  runId: string,
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
      const resolved = resolveCitation({
        id: citationId,
        analysisRunId: runId,
        candidateId,
        segmentId: modelCitation.segmentId,
        quotedText: modelCitation.quotedText,
        purpose: modelCitation.relationship === "context_only" ? "evidence_only" : "supporting_candidate",
        claimedEvidenceNature: modelCitation.evidenceNature,
        sourceEvidenceNature: modelCitation.evidenceNature,
        now: CREATED_AT,
      });
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

  return { candidates, citations, quarantined };
}

export function assertAnalyzeResponse(value: unknown) {
  return AnalyzeResponseSchema.parse(value);
}

function buildCandidate(
  candidate: ModelAnalysisProposal["candidates"][number],
  id: string,
  runId: string,
  dependencies: EvidenceDependency[],
  input: CanonicalProviderInput,
): CaseCandidate {
  const base = {
    id,
    revision: 0,
    caseId: input.request.caseId,
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
    safeShareRecipientCategories: ["legal_aid_team" as const],
    createdAt: CREATED_AT,
  };

  if (candidate.kind === "timeline_event") {
    return CaseCandidateSchema.parse({
      ...base,
      kind: "timeline_event",
      datePrecision: "unknown",
      dateAlternatives: [],
      actorLabels: [],
    });
  }
  if (candidate.kind === "context_gap") {
    return CaseCandidateSchema.parse({
      ...base,
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
      category: "control",
      requiredDependencyIds: dependencies.map((dependency) => dependency.id),
      childCandidateIds: [],
      relationshipSummary: candidate.proposedText,
    });
  }
  return CaseCandidateSchema.parse({ ...base, kind: candidate.kind });
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
  if (PROHIBITED.test(joined)) return "PROHIBITED_CONCLUSION";
  return null;
}

function reasonCode(reason: CitationFailureReason | null): QuarantinedProposal["reasonCode"] {
  if (reason === "unknown_segment" || reason === "unknown_document" || reason === "unknown_page" || reason === "source_unavailable" || reason === "segment_not_allowlisted" || reason === "support_not_candidate_eligible") return "UNKNOWN_SOURCE";
  if (reason === "ambiguous_exact_match" || reason === "unsafe_normalized_ambiguity") return "AMBIGUOUS_QUOTE";
  if (reason === "evidence_nature_upgrade") return "EVIDENCE_NATURE_UPGRADE";
  return "QUOTE_NOT_EXACT";
}
