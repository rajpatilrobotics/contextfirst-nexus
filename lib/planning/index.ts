import type {
  CaseState,
  CaseTask,
  InterviewQuestion,
  InterviewSessionSetup,
  PractitionerNote,
  ReferralPlan,
  ServiceProviderDirectoryRecord,
  UrgentNeed,
} from "../contracts";
import { ServiceProviderDirectoryRecordSchema } from "../contracts";

export const serviceProviderDirectory: ServiceProviderDirectoryRecord[] = [
  {
    id: "SERVICE-1",
    name: "211 Community Resource Search",
    category: "Broad social-service navigation",
    needCategories: [
      "emergency_accommodation",
      "mental_health_support",
      "interpretation",
      "documentation",
      "safe_contact",
      "other",
    ],
    resourceType: "funded_navigation_service",
    coverageArea: "United States; local 211 coverage and services vary",
    hours: "Local service hours vary; use the official location search to verify.",
    languages: [],
    accessibility: "Accessibility and communication accommodations vary by local 211.",
    eligibilityCaveat: "211 supplies local resource information; program eligibility and capacity must be verified with the listed service.",
    safeContactMethodLabel: "Open the official directory manually; this workspace sends no case information.",
    sourceLabel: "United Way 211 official website",
    sourceUrl: "https://www.211.org/",
    lastVerifiedDate: "2026-07-26",
    verificationStatus: "official_source_verified",
    availabilityStatus: "not_verified",
  },
  {
    id: "SERVICE-2",
    name: "Legal Services Corporation — Find Legal Help",
    category: "Civil legal aid",
    needCategories: ["legal_support", "documentation"],
    resourceType: "official_locator",
    coverageArea: "Every U.S. state, the District of Columbia, and U.S. territories",
    hours: "Online locator; each independent legal-aid organization sets its own hours.",
    languages: [],
    accessibility: "Accommodation and language access must be verified with the selected legal-aid organization.",
    eligibilityCaveat: "LSC-funded programs generally apply income and case-type eligibility rules; criminal representation is outside LSC civil legal aid.",
    safeContactMethodLabel: "Use the official locator and contact a selected organization only after consent and safe-contact review.",
    sourceLabel: "Legal Services Corporation official website",
    sourceUrl: "https://www.lsc.gov/",
    lastVerifiedDate: "2026-07-26",
    verificationStatus: "official_source_verified",
    availabilityStatus: "not_verified",
  },
  {
    id: "SERVICE-3",
    name: "Office for Victims of Crime — Service Directory",
    category: "Nonemergency victim services",
    needCategories: ["legal_support", "safe_contact", "other"],
    resourceType: "official_directory",
    coverageArea: "United States and participating programs abroad",
    hours: "Directory access is online; listed programs set their own hours.",
    languages: [],
    accessibility: "Accessibility and language access are supplied by listed programs and must be verified.",
    eligibilityCaveat: "OVC does not endorse listed programs; directory information is supplied by participating organizations and agencies.",
    safeContactMethodLabel: "Search the official directory manually; no case information is transmitted from this workspace.",
    sourceLabel: "U.S. Department of Justice, Office for Victims of Crime",
    sourceUrl: "https://ovc.ojp.gov/directory-crime-victim-services",
    lastVerifiedDate: "2026-07-26",
    verificationStatus: "official_source_verified",
    availabilityStatus: "not_verified",
  },
  {
    id: "SERVICE-4",
    name: "HUD Find Shelter",
    category: "Shelter and basic-needs locator",
    needCategories: ["emergency_accommodation"],
    resourceType: "official_locator",
    coverageArea: "Communities across the United States",
    hours: "Online locator; each listed provider sets its own hours.",
    languages: [],
    accessibility: "Accessibility must be verified with the selected shelter or service provider.",
    eligibilityCaveat: "HUD does not endorse listed providers and does not verify openings, eligibility, or current capacity.",
    safeContactMethodLabel: "Use the official search manually and verify openings without transmitting case data from this app.",
    sourceLabel: "U.S. Department of Housing and Urban Development",
    sourceUrl: "https://www.hud.gov/FindShelter",
    lastVerifiedDate: "2026-07-26",
    verificationStatus: "official_source_verified",
    availabilityStatus: "not_verified",
  },
  {
    id: "SERVICE-5",
    name: "FindTreatment.gov",
    category: "Mental-health and substance-use treatment locator",
    needCategories: ["mental_health_support"],
    resourceType: "official_locator",
    coverageArea: "United States and U.S. territories",
    hours: "Online locator; each listed treatment facility sets its own hours.",
    languages: ["English", "Spanish"],
    accessibility: "Facility accessibility and accommodations must be verified directly.",
    eligibilityCaveat: "The locator does not establish clinical need, eligibility, insurance coverage, or current appointment availability.",
    safeContactMethodLabel: "Search anonymously on the official site; this workspace sends no case or referral information.",
    sourceLabel: "SAMHSA FindTreatment.gov",
    sourceUrl: "https://findtreatment.gov/locator",
    lastVerifiedDate: "2026-07-26",
    verificationStatus: "official_source_verified",
    availabilityStatus: "not_verified",
  },
  {
    id: "SERVICE-6",
    name: "DOJ EOIR — Find Legal Representation",
    category: "Immigration legal representation",
    needCategories: ["legal_support", "documentation"],
    resourceType: "official_roster",
    coverageArea: "United States immigration courts and recognized organizations",
    hours: "Official roster and representation resources are online; organizations set their own hours.",
    languages: [],
    accessibility: "Language and accessibility support must be verified with the selected organization or representative.",
    eligibilityCaveat: "Roster presence does not guarantee acceptance, eligibility, capacity, or free representation; representative authorization must be verified.",
    safeContactMethodLabel: "Review the official roster and contact a selected organization manually after consent.",
    sourceLabel: "U.S. Department of Justice, Executive Office for Immigration Review",
    sourceUrl: "https://www.justice.gov/eoir/find-legal-representation",
    lastVerifiedDate: "2026-07-26",
    verificationStatus: "official_source_verified",
    availabilityStatus: "not_verified",
  },
  {
    id: "SERVICE-7",
    name: "VictimConnect Resource Center",
    category: "Victim-service navigation",
    needCategories: ["safe_contact", "legal_support", "other"],
    resourceType: "funded_navigation_service",
    coverageArea: "United States",
    hours: "Verify current channels and hours on the official website.",
    languages: [],
    accessibility: "Communication and accessibility options must be verified on the official site.",
    eligibilityCaveat: "VictimConnect is a navigation resource; service eligibility, availability, and safety must be confirmed independently.",
    safeContactMethodLabel: "Open the official resource center only when it is safe; this workspace does not initiate contact.",
    sourceLabel: "VictimConnect Resource Center, an NCVC program funded by OVC",
    sourceUrl: "https://victimconnect.org/victim-connect-resource-map/",
    lastVerifiedDate: "2026-07-26",
    verificationStatus: "official_source_verified",
    availabilityStatus: "not_verified",
  },
].map((record) => ServiceProviderDirectoryRecordSchema.parse(record));

export function deriveServiceResourceMatches(state: CaseState) {
  const activeNeeds = state.urgentNeeds.filter(
    (need) => !["resolved", "cancelled"].includes(need.status),
  );
  return serviceProviderDirectory
    .map((resource) => {
      const matchedNeeds = activeNeeds.filter((need) =>
        resource.needCategories.includes(need.category),
      );
      return {
        resource,
        matchedNeedIds: matchedNeeds.map((need) => need.id),
        matchedCategories: [...new Set(matchedNeeds.map((need) => need.category))],
      };
    })
    .sort(
      (left, right) =>
        right.matchedNeedIds.length - left.matchedNeedIds.length ||
        left.resource.name.localeCompare(right.resource.name),
    );
}

export function deriveUrgentNeedSuggestions(state: CaseState) {
  return state.candidates
    .filter(
      (candidate) =>
        candidate.kind === "review_lane_item" &&
        candidate.inclusionStatus === "active" &&
        candidate.lane === "protection_remedy_urgency",
    )
    .map((candidate) => {
      const citationIds = candidate.dependencies.flatMap((dependency) =>
        dependency.kind === "source" && dependency.active
          ? [dependency.citationId]
          : [],
      );
      const sourceText = citationIds
        .map((citationId) => state.citations.find((citation) => citation.id === citationId)?.quotedText ?? "")
        .join(" ")
        .toLowerCase();
      const category: UrgentNeed["category"] =
        /\b(?:interpreter|translation|language support)\b/.test(sourceText)
          ? "interpretation"
          : /\b(?:mental health|counsell?ing|medical|hospital|medication)\b/.test(sourceText)
            ? "mental_health_support"
            : /\b(?:homeless|housing|shelter|accommodation)\b/.test(sourceText)
              ? "emergency_accommodation"
              : /\b(?:hearing|court date|deadline|legal aid|lawyer)\b/.test(sourceText)
                ? "legal_support"
                : "safe_contact";
      return {
        id: `NEED-SUGGESTION-${candidate.id}`,
        candidateId: candidate.id,
        category,
        linkedCitationIds: citationIds,
        description:
          `Verify whether ${category.replaceAll("_", " ")} is currently needed. The source-linked analysis raised a review question; it did not confirm a need.`,
        nextAction:
          "Confirm the need, consent, urgency, and safe-contact constraints before any follow-up.",
      };
    });
}

export function createInitialPlanningState(now: string): Pick<
  CaseState,
  | "urgentNeeds"
  | "interviewSetup"
  | "interviewQuestions"
  | "caseTasks"
  | "practitionerNotes"
  | "referralPlans"
> {
  const interviewSetup: InterviewSessionSetup = {
    id: "INTERVIEW-SESSION-001",
    caseId: "CFN-DEMO-001",
    purpose: "Clarify recruitment, document access, and safe-contact context",
    language: "Tagalog interpreter requested",
    interpreter: "Interpreter need remains practitioner-confirmed outside this workspace",
    accessibility: "Quiet room; extended time",
    safeContact: "SMS weekdays 10:00-17:00; no family contact",
    consentConfirmed: false,
    updatedAt: now,
  };

  const urgentNeeds: UrgentNeed[] = [
    {
      id: "NEED-1",
      caseId: "CFN-DEMO-001",
      category: "emergency_accommodation",
      description: "Bundled fictional example indicates possible housing loss within seven days.",
      urgency: "within_72_hours",
      status: "open",
      owner: "M. Chen",
      safeContactConstraints: "Housing research permitted in the fictional packet; no family contact.",
      nextAction: "Identify local emergency-accommodation options for manual verification.",
      followUpAt: "2026-07-25T17:00:00.000Z",
      origin: "bundled_synthetic",
      linkedCandidateIds: [],
      linkedCitationIds: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const interviewQuestions: InterviewQuestion[] = [
    {
      id: "QUESTION-1",
      caseId: "CFN-DEMO-001",
      body: "Could you tell me, in your own words, how the placement was arranged before you travelled?",
      rationale: "Open prompt that does not lead toward a conclusion.",
      status: "draft",
      linkedGapCandidateId: null,
      source: {
        sourceType: "manual",
        sourceId: null,
        sourceAnalysisRunId: null,
        sourceCandidateRevision: null,
      },
      origin: "bundled_synthetic",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "QUESTION-2",
      caseId: "CFN-DEMO-001",
      body: "Were there documents about work or wages that you were given, kept, or not given?",
      rationale: "Asks about document access without assuming an outcome.",
      status: "draft",
      linkedGapCandidateId: null,
      source: {
        sourceType: "manual",
        sourceId: null,
        sourceAnalysisRunId: null,
        sourceCandidateRevision: null,
      },
      origin: "bundled_synthetic",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const caseTasks: CaseTask[] = [
    {
      id: "TASK-1",
      caseId: "CFN-DEMO-001",
      kind: "document_request",
      title: "Request contract addendum",
      description: "Bundled fictional operational reminder. Completion does not resolve any evidence gap.",
      origin: "manual",
      originId: null,
      source: {
        sourceType: "manual",
        sourceId: null,
        sourceAnalysisRunId: null,
        sourceCandidateRevision: null,
      },
      owner: "M. Chen",
      priority: "high",
      status: "todo",
      dueDate: "2026-08-05",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "TASK-2",
      caseId: "CFN-DEMO-001",
      kind: "general_task",
      title: "Identify accommodation options",
      description: "Operational planning task linked to the bundled fictional urgent need.",
      origin: "urgent_need",
      originId: "NEED-1",
      source: {
        sourceType: "urgent_need",
        sourceId: "NEED-1",
        sourceAnalysisRunId: null,
        sourceCandidateRevision: null,
      },
      owner: "M. Chen",
      priority: "high",
      status: "in_progress",
      dueDate: "2026-07-25",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const practitionerNotes: PractitionerNote[] = [
    {
      id: "NOTE-1",
      caseId: "CFN-DEMO-001",
      body: "Deferring acceptance of a synthetic isolation suggestion until source limitations are reviewed. This commentary is not a finding.",
      author: "fixture_reviewer",
      visibility: "team",
      linkedEntityIds: [],
      origin: "bundled_synthetic",
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "NOTE-2",
      caseId: "CFN-DEMO-001",
      body: "Preserve both conflicting fictional arrival dates rather than selecting one without source resolution.",
      author: "fixture_reviewer",
      visibility: "team",
      linkedEntityIds: [],
      origin: "bundled_synthetic",
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    urgentNeeds,
    interviewSetup,
    interviewQuestions,
    caseTasks,
    practitionerNotes,
    referralPlans: [] satisfies ReferralPlan[],
  };
}

export function activeQuestionsByGap(state: CaseState) {
  const result = new Map<string, InterviewQuestion[]>();
  for (const question of state.interviewQuestions) {
    if (!question.linkedGapCandidateId || ["removed", "inappropriate"].includes(question.status)) continue;
    result.set(question.linkedGapCandidateId, [
      ...(result.get(question.linkedGapCandidateId) ?? []),
      question,
    ]);
  }
  return result;
}

export function tasksBySource(state: CaseState) {
  const result = new Map<string, CaseTask[]>();
  for (const task of state.caseTasks) {
    if (!task.originId || ["completed", "cancelled"].includes(task.status)) continue;
    result.set(task.originId, [...(result.get(task.originId) ?? []), task]);
  }
  return result;
}

export function deriveGapActionCoverage(state: CaseState, gapId: string) {
  const questions = activeQuestionsByGap(state).get(gapId) ?? [];
  const tasks = tasksBySource(state).get(gapId) ?? [];
  return {
    hasQuestion: questions.some((question) => question.source.sourceType === "context_gap"),
    hasDocumentRequest: tasks.some((task) => task.kind === "document_request"),
    hasCaseTask: tasks.some((task) => task.kind === "general_task"),
    hasCompareTask: tasks.some((task) => task.kind === "compare_sources_task"),
    questions,
    tasks,
  };
}

export function sourceLinkState(state: CaseState, source: { sourceType: string; sourceId: string | null; sourceAnalysisRunId: string | null; sourceCandidateRevision: number | null }) {
  if (source.sourceType !== "context_gap" || !source.sourceId) return "not_run_scoped" as const;
  const candidate = state.candidates.find((item) => item.id === source.sourceId);
  if (!candidate) return "superseded" as const;
  if (candidate.analysisRunId !== source.sourceAnalysisRunId) return "superseded" as const;
  if (candidate.revision !== source.sourceCandidateRevision) return "superseded" as const;
  return "current" as const;
}

export function deriveOpenTaskCount(state: CaseState) {
  return state.caseTasks.filter((task) => !["completed", "cancelled"].includes(task.status)).length;
}

export function deriveOverdueTaskCount(state: CaseState, today = new Date().toISOString().slice(0, 10)) {
  return state.caseTasks.filter(
    (task) =>
      !["completed", "cancelled"].includes(task.status) &&
      Boolean(task.dueDate) &&
      task.dueDate! < today,
  ).length;
}

export function deriveUrgentNeedCounts(state: CaseState) {
  const open = state.urgentNeeds.filter((need) => !["resolved", "cancelled"].includes(need.status));
  return {
    open: open.length,
    highUrgency: open.filter((need) => need.urgency === "within_24_hours" || need.urgency === "within_72_hours").length,
  };
}

export function derivePendingInterviewReviewCount(state: CaseState) {
  return state.interviewQuestions.filter((question) => question.status === "draft").length;
}

export function derivePlanningDashboardCounts(state: CaseState) {
  const urgentNeeds = deriveUrgentNeedCounts(state);
  return {
    openUrgentNeeds: urgentNeeds.open,
    highUrgencyNeeds: urgentNeeds.highUrgency,
    pendingInterviewQuestions: derivePendingInterviewReviewCount(state),
    openTasks: deriveOpenTaskCount(state),
    overdueTasks: deriveOverdueTaskCount(state),
    referralPlans: state.referralPlans.filter((plan) => plan.planningStatus !== "cancelled").length,
  };
}

export function existingBlockerTracking(state: CaseState) {
  return state.exportGate?.status === "blocked" ? state.exportGate.blockers : [];
}
