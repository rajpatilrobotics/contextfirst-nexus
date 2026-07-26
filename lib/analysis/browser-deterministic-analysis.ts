import {
  AnalysisExecutionResultSchema,
  CaseCandidateSchema,
  CitationSchema,
  type AnalysisExecutionResult,
  type CaseCandidate,
  type Citation,
  type DocumentRecord,
  type ReviewLane,
  type SafeShareRecipientCategory,
  type SourceSegment,
} from "../contracts";

const VERSION = "1.0.0" as const;
export const CURRENT_BROWSER_DETERMINISTIC_ADAPTER_VERSION =
  "browser-deterministic-analysis-v4" as const;
const MAX_CANDIDATES = 30;
const MAX_CONTEXT_GAPS = 6;
const MAX_TIMELINE_EVENTS = 8;
const MAX_QUOTE_LENGTH = 320;
const CONTEXT_WINDOW_RADIUS = 240;

type ReviewRule = {
  code: string;
  lane: ReviewLane;
  title: string;
  strongPatterns: readonly RegExp[];
  contextualPatterns?: readonly RegExp[];
  contextPatterns?: readonly RegExp[];
  contextDescription: string;
  reviewQuestion: string;
  gapQuestion: string;
};

type MatchedRuleRecord = {
  candidateId: string;
  exactPhrase: string;
  matchRationale: string;
  quote: { start: number; end: number; text: string };
  rule: ReviewRule;
  segment: SourceSegment;
};

type RuleMatch = {
  index: number;
  length: number;
  exactPhrase: string;
  rationale: string;
};

const CASE_NARRATIVE_PATTERNS: readonly RegExp[] = [
  /\b(?:the |a )?(?:person|worker|applicant|employee|client|patient|witness|complainant|accused)\b/i,
  /\b(?:he|she|they|them|their|hers?|his|me|my|we|our|us)\b/i,
  /\b(?:recruiter|employer|supervisor|agent|broker|police|officer|court|lawyer)\b/i,
  /\bjob offer\b/i,
  /\b(?:forced|threatened|coerced|confined|withheld|retained)\b/i,
  /\b(?:passport|visa|wages?|salary|hearing|arrested|charged|shelter|interpreter)\b/i,
];

const OUT_OF_SCOPE_CATEGORY_PATTERNS = {
  technical: [
    /\b(?:source code|codebase|repository|github|gitlab|pull request|commit hash)\b/i,
    /\b(?:api|endpoint|http|html|css|javascript|typescript|react|next\.?js|database|sql)\b/i,
    /\b(?:bug bounty|vulnerability|exploit|authentication|authorization|security header)\b/i,
    /\b(?:algorithm|machine learning|large language model|retrieval augmented generation|vector indexing)\b/i,
    /\b(?:server|client-side|browser compatibility|test suite|unit test|deployment)\b/i,
  ],
  hackathon: [
    /\b(?:hackathon|call for code|judging criteria|judge demo|submission deadline)\b/i,
    /\b(?:prototype|project architecture|technical stack|pitch deck|demo script)\b/i,
    /\b(?:team member|challenge statement|solution overview|implementation plan)\b/i,
  ],
  resume: [
    /\b(?:curriculum vitae|résumé|resume)\b/i,
    /\b(?:education|technical skills|professional experience|employment history)\b/i,
    /\b(?:linkedin|github profile|references available on request)\b/i,
  ],
} as const;

const REVIEW_RULES: readonly ReviewRule[] = [
  {
    code: "A-RECRUITMENT",
    lane: "trafficking_indicators",
    title: "Recruitment or deception language",
    strongPatterns: [
      /\brecruit(?:ed|er|ers|ing|ment)?\b/i,
      /\bjob offer\b/i,
      /\bfalse promis(?:e|es)\b/i,
      /\bmisled\b/i,
      /\bdecei(?:ve|ved|ving|t|ts|ption)\b/i,
    ],
    contextualPatterns: [
      /\badvertis(?:e|ed|ement|ements|ing)\b/i,
    ],
    contextPatterns: [
      /\b(?:job|role|work|worker|applicant|recruiter|employer|terms?|wages?|salary)\b/i,
    ],
    contextDescription:
      "recruitment, work, applicant, employer, or promised-terms context",
    reviewQuestion:
      "Does this source language warrant practitioner review for recruitment or deception context?",
    gapQuestion:
      "What source, if any, clarifies who made the recruitment representation and whether the terms changed?",
  },
  {
    code: "A-MOVEMENT",
    lane: "trafficking_indicators",
    title: "Movement, travel, or accommodation language",
    strongPatterns: [
      /\bborder crossing\b/i,
      /\bshared housing\b/i,
      /\bmoved (?:me|them|us)\b/i,
      /\b(?:travel|transport|accommodation) (?:was |were )?(?:arranged|controlled|required)\b/i,
    ],
    contextualPatterns: [
      /\btravel(?:led|ed|ing)?\b/i,
      /\btransport(?:ed|ation|ing)?\b/i,
      /\bpassport\b/i,
      /\baccommodation\b/i,
    ],
    contextPatterns: [
      /\b(?:person|worker|applicant|employee|recruiter|employer|agent|broker)\b/i,
      /\b(?:he|she|they|them|their|me|my|we|our|us)\b/i,
      /\b(?:job|work|visa|country|city|airport|journey|crossing|housing|route)\b/i,
    ],
    contextDescription:
      "nearby person, recruitment, work, location, journey, visa, or housing context",
    reviewQuestion:
      "What context, if any, connects this movement, travel, or accommodation language to the stated purpose?",
    gapQuestion:
      "What source, if any, clarifies why and how the travel or movement occurred, who arranged it, and whether it could be declined?",
  },
  {
    code: "A-CONTROL",
    lane: "trafficking_indicators",
    title: "Restriction, threat, or control language",
    strongPatterns: [
      /\blocked (?:in|inside)\b/i,
      /\bretained? (?:my |the )?passport\b/i,
      /\bwithheld (?:my |the )?passport\b/i,
      /\bnot allowed to leave\b/i,
      /\bcould not leave\b/i,
      /\bdebt bondage\b/i,
    ],
    contextualPatterns: [
      /\bthreat(?:en|ened|ening|ens|s)?\b/i,
      /\bcoerc(?:e|ed|ion|ive)\b/i,
      /\brestrict(?:ed|ing|ion|ions)\b/i,
      /\bconfin(?:e|ed|ement)\b/i,
      /\bwithheld\b/i,
      /\bdebt(?:s)?\b/i,
    ],
    contextPatterns: [
      /\b(?:person|worker|employee|recruiter|employer|supervisor|agent|family)\b/i,
      /\b(?:he|she|they|them|their|me|my|we|our|us)\b/i,
      /\b(?:leave|passport|wages?|money|housing|work|violence|police)\b/i,
    ],
    contextDescription:
      "nearby person, work, money, document, movement, or safety context",
    reviewQuestion:
      "Does the surrounding source context support retaining this as a possible restriction, threat, or control indicator?",
    gapQuestion:
      "What source, if any, clarifies who exercised the reported restriction or control, when, and what alternatives were available?",
  },
  {
    code: "A-WORK",
    lane: "trafficking_indicators",
    title: "Work-condition or withheld-payment language",
    strongPatterns: [
      /\bforced to work\b/i,
      /\bmade (?:me|them|us) work\b/i,
      /\bworking without pay\b/i,
      /\bunpaid wages?\b/i,
      /\bwages? (?:were )?withheld\b/i,
      /\bexcessive hours?\b/i,
      /\bpay deduction(?:s)?\b/i,
    ],
    contextDescription:
      "an explicit work-condition or withheld-payment phrase",
    reviewQuestion:
      "Does the source provide enough context for a practitioner to assess this work-condition or payment language?",
    gapQuestion:
      "What source, if any, documents the promised terms, hours, payment, deductions, and whether the work could be stopped?",
  },
  {
    code: "B-COMPELLED",
    lane: "non_punishment_relevance",
    title: "Compelled-conduct language",
    strongPatterns: [
      /\b(?:ordered|instructed|forced|compelled|required) (?:me|them|us|the person)? ?to\b/i,
      /\bmade (?:me|them|us) (?:send|transfer|carry|sign|open|withdraw|deposit|message)\b/i,
      /\btold (?:me|them|us) to (?:send|transfer|carry|sign|open|withdraw|deposit|message)\b/i,
    ],
    contextDescription:
      "an explicit instruction or compelled-conduct phrase involving a person",
    reviewQuestion:
      "What, if any, relationship does the source describe between this conduct and pressure or compulsion?",
    gapQuestion:
      "What source, if any, clarifies the instruction, pressure, and connection to the alleged conduct?",
  },
  {
    code: "B-PROCEEDING",
    lane: "non_punishment_relevance",
    title: "Proceeding or alleged-offence language",
    strongPatterns: [
      /\barrest(?:ed|s)?\b/i,
      /\bprosecut(?:e|ed|ion|ing)\b/i,
      /\bdetain(?:ed|ment)\b/i,
      /\bpolice (?:charged|arrested|detained)\b/i,
    ],
    contextualPatterns: [
      /\bcharg(?:e|ed|es|ing)\b/i,
      /\boffen[cs]e(?:s)?\b/i,
      /\billegal\b/i,
      /\bfraud(?:ulent)?\b/i,
      /\bpolice\b/i,
    ],
    contextPatterns: [
      /\b(?:person|worker|accused|defendant|suspect|police|officer|court|prosecutor)\b/i,
      /\b(?:he|she|they|them|their|me|my|we|our|us)\b/i,
      /\b(?:arrest|charge|offence|offense|case|hearing|trial|detention)\b/i,
    ],
    contextDescription:
      "nearby person, police, court, detention, or alleged-offence context",
    reviewQuestion:
      "Is this proceeding or alleged-offence language relevant to a qualified non-punishment review without determining eligibility?",
    gapQuestion:
      "What source, if any, records the alleged act, date, and current procedural status without assuming guilt?",
  },
  {
    code: "C-SAFETY",
    lane: "protection_remedy_urgency",
    title: "Immediate safety or retaliation language",
    strongPatterns: [
      /\bimmediate danger\b/i,
      /\bviolence\b/i,
      /\bretaliat(?:e|ed|ion|ory)\b/i,
      /\binjur(?:y|ies|ed)\b/i,
      /\bhomeless\b/i,
      /\bemergency shelter\b/i,
    ],
    contextualPatterns: [
      /\burgent(?:ly)?\b/i,
      /\bunsafe\b/i,
      /\bthreat(?:en|ened|ening|ens|s)?\b/i,
    ],
    contextPatterns: [
      /\b(?:person|worker|client|child|family|recruiter|employer|agent)\b/i,
      /\b(?:he|she|they|them|their|me|my|we|our|us)\b/i,
      /\b(?:danger|violence|injury|housing|shelter|contact|retaliation|leave)\b/i,
    ],
    contextDescription:
      "nearby person, danger, violence, housing, retaliation, or safe-contact context",
    reviewQuestion:
      "Does this source language indicate a safety question that requires prompt practitioner review?",
    gapQuestion:
      "What current practitioner-confirmed information, if any, is available about immediate safety and safe contact?",
  },
  {
    code: "C-ACCESS",
    lane: "protection_remedy_urgency",
    title: "Health, interpretation, or accessibility language",
    strongPatterns: [
      /\b(?:needs?|requires?) (?:an? )?interpreter\b/i,
      /\btranslation support\b/i,
      /\blanguage support\b/i,
      /\bmental health\b/i,
    ],
    contextualPatterns: [
      /\bmedical\b/i,
      /\bhospital\b/i,
      /\bmedication\b/i,
      /\bcounsell?ing\b/i,
      /\binterpreter\b/i,
      /\bdisabilit(?:y|ies)\b/i,
      /\baccessibility\b/i,
    ],
    contextPatterns: [
      /\b(?:person|worker|client|patient|applicant|witness)\b/i,
      /\b(?:he|she|they|them|their|me|my|we|our|us)\b/i,
      /\b(?:needs?|requires?|support|hearing|court|appointment|spoken|language|treatment|care)\b/i,
    ],
    contextDescription:
      "nearby person, hearing, language, appointment, care, or support context",
    reviewQuestion:
      "What support, if any, should a practitioner verify in response to this health, interpretation, or accessibility language?",
    gapQuestion:
      "What support, interpretation, accessibility, or health need has been confirmed by the person or a qualified practitioner?",
  },
  {
    code: "C-PROCEDURAL",
    lane: "protection_remedy_urgency",
    title: "Time-sensitive support language",
    strongPatterns: [
      /\bcourt date\b/i,
      /\blegal aid\b/i,
      /\blawyer\b/i,
      /\bsafe contact\b/i,
      /\bchildcare\b/i,
      /\bfood support\b/i,
    ],
    contextualPatterns: [
      /\bhearing\b/i,
      /\bdeadline\b/i,
      /\bhousing\b/i,
    ],
    contextPatterns: [
      /\b(?:person|worker|client|applicant|defendant|witness|court|lawyer)\b/i,
      /\b(?:he|she|they|them|their|me|my|we|our|us)\b/i,
      /\b(?:legal|appeal|application|case|shelter|unsafe|support|appointment|date)\b/i,
    ],
    contextDescription:
      "nearby person, court, legal, appointment, housing, or support context",
    reviewQuestion:
      "Does this source language identify a time-sensitive support or procedural question for practitioner review?",
    gapQuestion:
      "What deadline, hearing, or support need and responsible follow-up have been confirmed?",
  },
] as const;

export type BrowserDeterministicAnalysisResult = {
  run: AnalysisExecutionResult;
  candidates: CaseCandidate[];
  citations: Citation[];
};

export function buildBrowserDeterministicAnalysis(input: {
  caseId: string;
  approvedRedactedInputDigest: string;
  safeShareRecipientCategory: SafeShareRecipientCategory;
  documents: readonly DocumentRecord[];
  segments: readonly SourceSegment[];
  runId?: string;
  completedAt?: string;
}): BrowserDeterministicAnalysisResult {
  const completedAt = input.completedAt ?? new Date().toISOString();
  const runId =
    input.runId ??
    `RUN-LOCAL-${input.approvedRedactedInputDigest.slice(0, 12).toUpperCase()}`;
  const documentsById = new Map(
    input.documents.map((document) => [document.id, document]),
  );
  const candidates: CaseCandidate[] = [];
  const citations: Citation[] = [];
  const matchedRecords: MatchedRuleRecord[] = [];
  const eligibleSegments = [...input.segments]
    .filter(
      (segment) =>
        segment.supportEligibility === "candidate_eligible" &&
        segment.instructionAdvisory !== "advisory_signal" &&
        segment.extractionQuality !== "unavailable" &&
        segment.redactedText.trim().length > 0,
    )
    .sort(compareSegments);
  const documentScope = new Map(
    input.documents.map((document) => [
      document.id,
      assessBrowserAnalysisDocumentScope({
        document,
        segments: eligibleSegments.filter(
          (segment) => segment.documentId === document.id,
        ),
      }),
    ]),
  );
  const scopedSegments = eligibleSegments.filter((segment) => {
    const assessment = documentScope.get(segment.documentId);
    if (!assessment) return false;
    const segmentAssessment = assessTextScope(segment.redactedText);
    if (assessment.inScope) {
      return !(
        segmentAssessment.outOfScopeSignalCount >= 2 &&
        segmentAssessment.caseContextSignalCount < 2
      );
    }
    return (
      segmentAssessment.caseContextSignalCount >= 2 &&
      segmentAssessment.caseContextSignalCount >
        segmentAssessment.outOfScopeSignalCount
    );
  });

  for (const segment of scopedSegments) {
    if (!documentsById.has(segment.documentId)) {
      throw new Error(
        `Source segment ${segment.id} does not reference an available document.`,
      );
    }
    for (const rule of REVIEW_RULES) {
      const matched = firstRuleMatch(segment.redactedText, rule);
      if (!matched) continue;
      const quote = exactReviewExcerpt(
        segment.redactedText,
        matched.index,
        matched.length,
      );
      const ordinal = candidates.length + 1;
      const suffix = String(ordinal).padStart(4, "0");
      const candidateId = `CAND-LOCAL-${rule.code}-${suffix}`;
      const citationId = `CIT-LOCAL-${rule.code}-${suffix}`;
      const dependencyId = `DEP-LOCAL-${rule.code}-${suffix}`;
      const pageLabel = segment.pageNumber
        ? ` · page ${segment.pageNumber}`
        : "";

      citations.push(
        exactCitation({
          caseId: input.caseId,
          completedAt,
          id: citationId,
          quote,
          runId,
          segment,
        }),
      );
      candidates.push(
        CaseCandidateSchema.parse({
          id: candidateId,
          revision: 0,
          caseId: input.caseId,
          analysisRunId: runId,
          kind: "review_lane_item",
          lane: rule.lane,
          title: `${rule.title}${pageLabel}`,
          proposedText:
            `Exact source phrase “${matched.exactPhrase}” triggered this review prompt. ${matched.rationale} This is a review prompt, not a finding.`,
          currentText:
            `Exact source phrase “${matched.exactPhrase}” triggered this review prompt. ${matched.rationale} This is a review prompt, not a finding.`,
          deterministicMatch: {
            ruleCode: rule.code,
            exactPhrase: matched.exactPhrase,
            rationale: matched.rationale,
          },
          currentTextOrigin: "source_extraction",
          itemOrigin: "source_extraction",
          assertionMode: "neutral_procedural_fact",
          reviewRequirement: "individual",
          inclusionStatus: "active",
          supportStatus: "exact_source_supported",
          reviewStatus: "pending",
          dependencies: [
            {
              id: dependencyId,
              kind: "source",
              sourceSegmentId: segment.id,
              citationId,
              evidenceNature: "documented_in_source",
              relationship: "context_only",
              active: true,
            },
          ],
          relatedCoverageIssueIds: [],
          unknowns: [
            "The meaning, surrounding context, and legal relevance of this language have not been determined.",
            "Browser-local deterministic review is pattern-based, not semantic AI analysis, and is capped at 30 review prompts per run.",
          ],
          reviewQuestion: rule.reviewQuestion,
          consequential: false,
          prohibitedConclusionCheck: "passed",
          safeShareRecipientCategories: [input.safeShareRecipientCategory],
          createdAt: completedAt,
        }),
      );
      matchedRecords.push({
        candidateId,
        exactPhrase: matched.exactPhrase,
        matchRationale: matched.rationale,
        quote,
        rule,
        segment,
      });
      if (candidates.length >= MAX_CANDIDATES) break;
    }
    if (candidates.length >= MAX_CANDIDATES) break;
  }

  appendContextGaps({
    candidates,
    caseId: input.caseId,
    citations,
    completedAt,
    matchedRecords,
    runId,
  });
  appendTimelineEvents({
    candidates,
    caseId: input.caseId,
    citations,
    completedAt,
    matchedRecords,
    runId,
    safeShareRecipientCategory: input.safeShareRecipientCategory,
  });
  appendNexusRelationships({
    candidates,
    caseId: input.caseId,
    citations,
    completedAt,
    matchedRecords,
    runId,
    safeShareRecipientCategory: input.safeShareRecipientCategory,
  });

  const run = AnalysisExecutionResultSchema.parse({
    id: runId,
    mode: "deterministic_replay",
    provider: {
      providerId: "local_replay",
      releaseConfigurationId: "prepared-replay-v1",
      requestedModel: "frozen_replay_output",
      serviceTier: "local",
      adapterVersion: CURRENT_BROWSER_DETERMINISTIC_ADAPTER_VERSION,
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
    inputSegmentCount: eligibleSegments.length,
    candidateCount: candidates.length,
    citationCount: citations.length,
    quarantinedCount: 0,
    status: "succeeded",
    failure: null,
  });

  return { run, candidates, citations };
}

function appendContextGaps({
  candidates,
  caseId,
  citations,
  completedAt,
  matchedRecords,
  runId,
}: {
  candidates: CaseCandidate[];
  caseId: string;
  citations: Citation[];
  completedAt: string;
  matchedRecords: MatchedRuleRecord[];
  runId: string;
}) {
  const firstByRule = new Map<string, MatchedRuleRecord>();
  for (const record of matchedRecords) {
    if (!firstByRule.has(record.rule.code)) {
      firstByRule.set(record.rule.code, record);
    }
  }

  const balancedRecords: MatchedRuleRecord[] = [];
  const lanes: ReviewLane[] = [
    "trafficking_indicators",
    "non_punishment_relevance",
    "protection_remedy_urgency",
  ];
  for (const lane of lanes) {
    balancedRecords.push(
      ...[...firstByRule.values()]
        .filter((record) => record.rule.lane === lane)
        .slice(0, 2),
    );
  }

  for (const record of balancedRecords.slice(0, MAX_CONTEXT_GAPS)) {
    const suffix = record.rule.code;
    const candidateId = `CAND-LOCAL-GAP-${suffix}`;
    const citationId = `CIT-LOCAL-GAP-${suffix}`;
    const dependencyId = `DEP-LOCAL-GAP-${suffix}`;
    citations.push(
      exactCitation({
        caseId,
        completedAt,
        id: citationId,
        quote: record.quote,
        runId,
        segment: record.segment,
      }),
    );
    const text =
      `Browser-local deterministic review detected source language for ${record.rule.title.toLowerCase()}, but it cannot establish the surrounding meaning or case relevance.`;
    candidates.push(
      CaseCandidateSchema.parse({
        id: candidateId,
        revision: 0,
        caseId,
        analysisRunId: runId,
        kind: "context_gap",
        lane: record.rule.lane,
        title: `Context to verify · ${record.rule.title}`,
        proposedText: text,
        currentText: text,
        deterministicMatch: {
          ruleCode: record.rule.code,
          exactPhrase: record.exactPhrase,
          rationale: record.matchRationale,
        },
        currentTextOrigin: "source_extraction",
        itemOrigin: "source_extraction",
        assertionMode: "gap",
        reviewRequirement: "individual",
        inclusionStatus: "active",
        supportStatus: "insufficient_evidence",
        reviewStatus: "pending",
        dependencies: [{
          id: dependencyId,
          kind: "source",
          sourceSegmentId: record.segment.id,
          citationId,
          evidenceNature: "documented_in_source",
          relationship: "context_only",
          active: true,
        }],
        relatedCoverageIssueIds: [],
        unknowns: [
          "The deterministic rule identifies language for review but cannot determine the surrounding facts or legal relevance.",
        ],
        reviewQuestion: record.rule.gapQuestion,
        consequential: false,
        prohibitedConclusionCheck: "passed",
        safeShareRecipientCategories: [],
        createdAt: completedAt,
        response: null,
        responseStatus: "unanswered",
        responseEvidenceNature: "unknown",
        responseExplanation: null,
      }),
    );
  }
}

function appendTimelineEvents({
  candidates,
  caseId,
  citations,
  completedAt,
  matchedRecords,
  runId,
  safeShareRecipientCategory,
}: {
  candidates: CaseCandidate[];
  caseId: string;
  citations: Citation[];
  completedAt: string;
  matchedRecords: MatchedRuleRecord[];
  runId: string;
  safeShareRecipientCategory: SafeShareRecipientCategory;
}) {
  const seen = new Set<string>();
  let ordinal = 0;
  for (const record of matchedRecords) {
    const date = firstExplicitDate(record.quote.text);
    if (!date) continue;
    const key = `${record.segment.id}:${date.dateStart}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ordinal += 1;
    const suffix = String(ordinal).padStart(4, "0");
    const candidateId = `CAND-LOCAL-TIMELINE-${suffix}`;
    const citationId = `CIT-LOCAL-TIMELINE-${suffix}`;
    const dependencyId = `DEP-LOCAL-TIMELINE-${suffix}`;
    citations.push(
      exactCitation({
        caseId,
        completedAt,
        id: citationId,
        quote: record.quote,
        runId,
        segment: record.segment,
      }),
    );
    const text =
      `The approved source places ${record.rule.title.toLowerCase()} language on an explicit date. The event meaning remains subject to human review.`;
    candidates.push(
      CaseCandidateSchema.parse({
        id: candidateId,
        revision: 0,
        caseId,
        analysisRunId: runId,
        kind: "timeline_event",
        lane: record.rule.lane,
        title: `${record.rule.title} · ${date.label}`,
        proposedText: text,
        currentText: text,
        deterministicMatch: {
          ruleCode: record.rule.code,
          exactPhrase: record.exactPhrase,
          rationale: record.matchRationale,
        },
        currentTextOrigin: "source_extraction",
        itemOrigin: "source_extraction",
        assertionMode: "neutral_procedural_fact",
        reviewRequirement: "individual",
        inclusionStatus: "active",
        supportStatus: "exact_source_supported",
        reviewStatus: "pending",
        dependencies: [{
          id: dependencyId,
          kind: "source",
          sourceSegmentId: record.segment.id,
          citationId,
          evidenceNature: "documented_in_source",
          relationship: "context_only",
          active: true,
        }],
        relatedCoverageIssueIds: [],
        unknowns: [
          "The explicit date and source language are preserved without determining what occurred.",
        ],
        reviewQuestion:
          "Does this dated source detail belong in the practitioner-reviewed chronology?",
        consequential: false,
        prohibitedConclusionCheck: "passed",
        safeShareRecipientCategories: [safeShareRecipientCategory],
        createdAt: completedAt,
        dateStart: date.dateStart,
        datePrecision: "day",
        dateAlternatives: [],
        actorLabels: [],
      }),
    );
    if (ordinal >= MAX_TIMELINE_EVENTS) break;
  }
}

function appendNexusRelationships({
  candidates,
  caseId,
  citations,
  completedAt,
  matchedRecords,
  runId,
  safeShareRecipientCategory,
}: {
  candidates: CaseCandidate[];
  caseId: string;
  citations: Citation[];
  completedAt: string;
  matchedRecords: MatchedRuleRecord[];
  runId: string;
  safeShareRecipientCategory: SafeShareRecipientCategory;
}) {
  const byCategory = new Map<
    ReturnType<typeof nexusCategoryForRule>,
    MatchedRuleRecord[]
  >();
  for (const record of matchedRecords) {
    const category = nexusCategoryForRule(record.rule);
    const current = byCategory.get(category) ?? [];
    current.push(record);
    byCategory.set(category, current);
  }

  for (const [category, records] of byCategory) {
    const uniqueRecords = records.filter(
      (record, index, all) =>
        all.findIndex((item) => item.candidateId === record.candidateId) === index,
    );
    const sourceRecords = uniqueRecords.filter(
      (record, index, all) =>
        all.findIndex((item) => item.segment.id === record.segment.id) === index,
    ).slice(0, 3);
    const dependencies = [
      ...uniqueRecords.map((record, index) => ({
        id: `DEP-NEXUS-LOCAL-${category.toUpperCase()}-C${String(index + 1).padStart(2, "0")}`,
        kind: "candidate" as const,
        candidateId: record.candidateId,
        relationship: "context_only" as const,
        active: true,
      })),
      ...sourceRecords.map((record, index) => {
        const citationId = `CIT-NEXUS-LOCAL-${category.toUpperCase()}-${String(index + 1).padStart(2, "0")}`;
        citations.push(
          exactCitation({
            caseId,
            completedAt,
            id: citationId,
            quote: record.quote,
            runId,
            segment: record.segment,
          }),
        );
        return {
          id: `DEP-NEXUS-LOCAL-${category.toUpperCase()}-S${String(index + 1).padStart(2, "0")}`,
          kind: "source" as const,
          sourceSegmentId: record.segment.id,
          citationId,
          evidenceNature: "documented_in_source" as const,
          relationship: "context_only" as const,
          active: true,
        };
      }),
    ];
    const label = category.replaceAll("_", " ");
    const text =
      `The current approved packet contains source-grounded review items grouped under ${label}. This relationship is an organizational aid, not a legal conclusion.`;
    const exactPhrases = [
      ...new Set(sourceRecords.map((record) => record.exactPhrase)),
    ]
      .join(" · ")
      .slice(0, 240);
    candidates.push(
      CaseCandidateSchema.parse({
        id: `NEXUS-LOCAL-${category.toUpperCase().replaceAll("_", "-")}`,
        revision: 0,
        caseId,
        analysisRunId: runId,
        kind: "nexus_relationship",
        category,
        title: `${titleCase(label)} relationship for review`,
        proposedText: text,
        currentText: text,
        deterministicMatch: {
          ruleCode: `NEXUS-${category.toUpperCase()}`,
          exactPhrase: exactPhrases,
          rationale:
            `This grouping exists because the listed exact phrases produced source-grounded ${label} review prompts. It is not a legal conclusion.`,
        },
        currentTextOrigin: "source_extraction",
        itemOrigin: "source_extraction",
        assertionMode: "neutral_procedural_fact",
        reviewRequirement: "optional",
        inclusionStatus: "active",
        supportStatus: "exact_source_supported",
        reviewStatus: "pending",
        dependencies,
        requiredDependencyIds: dependencies.map((dependency) => dependency.id),
        childCandidateIds: uniqueRecords.map((record) => record.candidateId),
        relationshipSummary: text,
        relatedCoverageIssueIds: [],
        unknowns: [
          "Grouping source-linked review items does not establish a trafficking, offence, credibility, or eligibility determination.",
        ],
        reviewQuestion:
          "Does this source-grounded grouping help the practitioner review the packet without overstating the evidence?",
        consequential: false,
        prohibitedConclusionCheck: "passed",
        safeShareRecipientCategories: [safeShareRecipientCategory],
        createdAt: completedAt,
      }),
    );
  }
}

function nexusCategoryForRule(rule: ReviewRule) {
  if (rule.code === "A-RECRUITMENT") return "recruitment" as const;
  if (rule.code === "A-MOVEMENT") return "movement" as const;
  if (rule.code === "A-CONTROL") return "control" as const;
  if (rule.code === "A-WORK" || rule.code === "B-COMPELLED") {
    return "compelled_tasks" as const;
  }
  if (rule.code === "B-PROCEEDING") return "offence_timing" as const;
  return "urgency" as const;
}

function firstExplicitDate(text: string) {
  const iso = /\b((?:19|20)\d{2})-(0[1-9]|1[0-2])-([0-2]\d|3[01])\b/.exec(text);
  if (iso) {
    const value = iso[0];
    if (validDateOnly(value)) return { dateStart: value, label: value };
  }

  const months = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  } as const;
  const monthNames = Object.keys(months).join("|");
  const monthFirst = new RegExp(
    `\\b(${monthNames})\\s+([0-3]?\\d)(?:st|nd|rd|th)?(?:,\\s*|\\s+)((?:19|20)\\d{2})\\b`,
    "i",
  ).exec(text);
  const dayFirst = new RegExp(
    `\\b([0-3]?\\d)(?:st|nd|rd|th)?\\s+(${monthNames})\\s+((?:19|20)\\d{2})\\b`,
    "i",
  ).exec(text);
  const match = monthFirst ?? dayFirst;
  if (!match) return null;
  const monthName = (monthFirst ? match[1] : match[2]).toLowerCase() as keyof typeof months;
  const day = Number(monthFirst ? match[2] : match[1]);
  const year = Number(match[3]);
  const value = `${year}-${String(months[monthName]).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return validDateOnly(value) ? { dateStart: value, label: match[0] } : null;
}

function validDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function exactCitation({
  caseId,
  completedAt,
  id,
  quote,
  runId,
  segment,
}: {
  caseId: string;
  completedAt: string;
  id: string;
  quote: { start: number; end: number; text: string };
  runId: string;
  segment: SourceSegment;
}) {
  return CitationSchema.parse({
    id,
    caseId,
    analysisRunId: runId,
    documentId: segment.documentId,
    ...(segment.pageNumber ? { pageNumber: segment.pageNumber } : {}),
    segmentId: segment.id,
    quotedText: quote.text,
    normalizedQuotedText: normalizeQuotedText(quote.text),
    quoteForm: "approved_redacted_derivative",
    redactionMapVersion: VERSION,
    sourceLanguage: segment.sourceLanguage,
    translationStatus: segment.translationStatus,
    extractionQuality: segment.extractionQuality,
    validationStatus: "exact_match",
    redactedSegmentRange: {
      start: quote.start,
      end: quote.end,
    },
    sourceSegmentRange: {
      start: quote.start,
      end: quote.end,
    },
    boundingBoxes: segment.boundingBoxes,
    resolutionMethod: "exact_codepoint",
    resolvedBy: "system",
    validatedAt: completedAt,
  });
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compareSegments(left: SourceSegment, right: SourceSegment) {
  const documentOrder = left.documentId.localeCompare(right.documentId);
  if (documentOrder !== 0) return documentOrder;
  const pageOrder =
    (left.pageNumber ?? Number.MAX_SAFE_INTEGER) -
    (right.pageNumber ?? Number.MAX_SAFE_INTEGER);
  if (pageOrder !== 0) return pageOrder;
  const ordinalOrder = left.ordinal - right.ordinal;
  return ordinalOrder !== 0 ? ordinalOrder : left.id.localeCompare(right.id);
}

export type BrowserAnalysisDocumentScopeAssessment = {
  inScope: boolean;
  classification:
    | "case_material"
    | "technical"
    | "hackathon"
    | "resume"
    | "unrelated";
  caseContextSignalCount: number;
  outOfScopeSignalCount: number;
};

export function assessBrowserAnalysisDocumentScope({
  document,
  segments,
}: {
  document: DocumentRecord;
  segments: readonly SourceSegment[];
}): BrowserAnalysisDocumentScopeAssessment {
  const label = `${document.fileName} ${document.displayName}`;
  const text = `${label}\n${segments
    .map((segment) => segment.redactedText)
    .join("\n")}`;
  const scope = assessTextScope(text);
  const labelCategory = strongestOutOfScopeCategory(label);
  const contentCategory = strongestOutOfScopeCategory(text);
  const classification = labelCategory.category ?? contentCategory.category;
  const explicitlyUnrelatedLabel =
    labelCategory.count > 0 &&
    ["technical", "hackathon", "resume"].includes(
      labelCategory.category ?? "",
    );
  const inScope =
    (!explicitlyUnrelatedLabel && scope.outOfScopeSignalCount < 2) ||
    (scope.caseContextSignalCount >= 2 &&
      scope.caseContextSignalCount > scope.outOfScopeSignalCount);
  return {
    inScope,
    classification: inScope
      ? "case_material"
      : classification ?? "unrelated",
    caseContextSignalCount: scope.caseContextSignalCount,
    outOfScopeSignalCount: scope.outOfScopeSignalCount,
  };
}

function assessTextScope(text: string) {
  const caseContextSignalCount = countMatchingPatterns(
    text,
    CASE_NARRATIVE_PATTERNS,
  );
  const category = strongestOutOfScopeCategory(text);
  return {
    caseContextSignalCount,
    outOfScopeSignalCount: category.count,
  };
}

function strongestOutOfScopeCategory(text: string): {
  category: "technical" | "hackathon" | "resume" | null;
  count: number;
} {
  const results = (
    Object.entries(OUT_OF_SCOPE_CATEGORY_PATTERNS) as Array<
      [
        "technical" | "hackathon" | "resume",
        readonly RegExp[],
      ]
    >
  )
    .map(([category, patterns]) => ({
      category,
      count: countMatchingPatterns(text, patterns),
    }))
    .sort((left, right) => right.count - left.count);
  return results[0]?.count
    ? results[0]
    : { category: null, count: 0 };
}

function countMatchingPatterns(text: string, patterns: readonly RegExp[]) {
  return patterns.reduce(
    (count, pattern) => count + (pattern.test(text) ? 1 : 0),
    0,
  );
}

function firstRuleMatch(text: string, rule: ReviewRule): RuleMatch | null {
  const strongMatches = findPatternMatches(text, rule.strongPatterns).map(
    (match) => ({
      ...match,
      rationale:
        `It matched the browser-local “${rule.title}” rule because it is ${rule.contextDescription}.`,
    }),
  );
  const contextualMatches = findPatternMatches(
    text,
    rule.contextualPatterns ?? [],
  )
    .filter((match) =>
      hasNearbyContext(
        text,
        match.index,
        match.length,
        rule.contextPatterns ?? [],
      ),
    )
    .map((match) => ({
      ...match,
      rationale:
        `It matched the browser-local “${rule.title}” rule because the phrase appears within ${rule.contextDescription}.`,
    }));
  const matches = [...strongMatches, ...contextualMatches].sort(
    (left, right) => left.index - right.index,
  );
  const first = matches[0];
  if (!first) return null;
  return {
    ...first,
    exactPhrase: displayPhrase(
      text.slice(first.index, first.index + first.length),
    ),
  };
}

function findPatternMatches(text: string, patterns: readonly RegExp[]) {
  return patterns
    .map((pattern) => {
      const match = pattern.exec(text);
      return match
        ? { index: match.index, length: match[0].length }
        : null;
    })
    .filter(
      (match): match is { index: number; length: number } => match !== null,
    );
}

function hasNearbyContext(
  text: string,
  matchStart: number,
  matchLength: number,
  patterns: readonly RegExp[],
) {
  if (patterns.length === 0) return false;
  const start = Math.max(0, matchStart - CONTEXT_WINDOW_RADIUS);
  const end = Math.min(
    text.length,
    matchStart + matchLength + CONTEXT_WINDOW_RADIUS,
  );
  const context = text.slice(start, end);
  return patterns.some((pattern) => pattern.test(context));
}

function displayPhrase(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

function exactReviewExcerpt(
  text: string,
  matchStart: number,
  matchLength: number,
) {
  const sentenceStart = Math.max(
    text.lastIndexOf(".", matchStart - 1),
    text.lastIndexOf("!", matchStart - 1),
    text.lastIndexOf("?", matchStart - 1),
    text.lastIndexOf("\n", matchStart - 1),
  );
  const nextBoundaries = [".", "!", "?", "\n"]
    .map((delimiter) => text.indexOf(delimiter, matchStart + matchLength))
    .filter((index) => index >= 0);
  const sentenceEnd = nextBoundaries.length
    ? Math.min(...nextBoundaries) + 1
    : text.length;
  let start = sentenceStart < 0 ? 0 : sentenceStart + 1;
  let end = sentenceEnd;
  while (start < end && /\s/.test(text[start] ?? "")) start += 1;
  while (end > start && /\s/.test(text[end - 1] ?? "")) end -= 1;

  if (end - start > MAX_QUOTE_LENGTH) {
    const radius = Math.floor(MAX_QUOTE_LENGTH / 2);
    start = Math.max(start, matchStart - radius);
    end = Math.min(end, start + MAX_QUOTE_LENGTH);
    if (end < matchStart + matchLength) {
      end = matchStart + matchLength;
      start = Math.max(0, end - MAX_QUOTE_LENGTH);
    }
    while (start < matchStart && /\s/.test(text[start] ?? "")) start += 1;
    while (end > matchStart + matchLength && /\s/.test(text[end - 1] ?? "")) {
      end -= 1;
    }
  }

  return { start, end, text: text.slice(start, end) };
}

function normalizeQuotedText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
