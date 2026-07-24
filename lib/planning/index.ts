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
    name: "Fictional Harbor Legal Aid",
    category: "Legal aid",
    coverageArea: "Region A demonstration area",
    hours: "Mon-Fri 09:00-17:00",
    languages: ["English", "Tagalog", "Spanish"],
    accessibility: "Wheelchair access; interpreter planning required",
    eligibilityCaveat: "Fictional adult forced-criminality planning example only",
    safeContactMethodLabel: "Manual practitioner follow-up only",
    fixtureReviewDate: "2026-07-15",
    verificationStatus: "fictional_unverified",
  },
  {
    id: "SERVICE-2",
    name: "Fictional Meridian Trauma Support",
    category: "Mental-health support",
    coverageArea: "Region A demonstration area",
    hours: "Mon-Sat 10:00-18:00",
    languages: ["English", "Tagalog"],
    accessibility: "Remote sessions available in the fictional directory",
    eligibilityCaveat: "Consent required; capacity is not verified",
    safeContactMethodLabel: "Manual consent-confirmed outreach only",
    fixtureReviewDate: "2026-06-30",
    verificationStatus: "fictional_unverified",
  },
  {
    id: "SERVICE-3",
    name: "Fictional Bridgeway Interpreter Network",
    category: "Interpretation",
    coverageArea: "Multi-region demonstration area",
    hours: "24/7 listing, unverified",
    languages: ["Tagalog", "Ilocano", "Mandarin", "Spanish"],
    accessibility: "Video relay listed, not verified",
    eligibilityCaveat: "Practitioner-initiated planning example",
    safeContactMethodLabel: "No direct contact from this workspace",
    fixtureReviewDate: "2026-07-02",
    verificationStatus: "fictional_unverified",
  },
  {
    id: "SERVICE-4",
    name: "Fictional Northline Emergency Housing",
    category: "Emergency accommodation",
    coverageArea: "Region A demonstration area",
    hours: "24/7 listing, unverified",
    languages: ["English"],
    accessibility: "Step-free entry listed, not verified",
    eligibilityCaveat: "Adults facing imminent housing loss, demonstration only",
    safeContactMethodLabel: "Practitioner verifies independently",
    fixtureReviewDate: "2026-07-10",
    verificationStatus: "fictional_unverified",
  },
].map((record) => ServiceProviderDirectoryRecordSchema.parse(record));

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
