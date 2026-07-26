import {
  AuditEventSchema,
  CaseStateSchema,
  type BrowserAnalyzeResponse,
  type CaseState,
} from "../contracts";
import type { CitationSourceContext } from "../citations";
import type { BrowserCaseRecord } from "../cases";
import { bundledGuidancePack } from "../guidance";
import { deriveCaseStatus } from "./index";

export function createBrowserAnalysisCaseState(input: {
  record: BrowserCaseRecord;
  sourceContext: CitationSourceContext;
  response: Extract<BrowserAnalyzeResponse, { outcome: "succeeded" }>;
  approvedRedactedInputDigest: string;
  now?: string;
}): CaseState {
  const { record, sourceContext, response } = input;
  const purpose = record.purposeBrief;
  const packet = record.documentPacket;
  if (!purpose || !packet) {
    throw new Error("browser_analysis_prerequisites_missing");
  }
  const now = input.now ?? new Date().toISOString();
  const run = {
    ...response.run,
    recovery: {
      recoveryOfRunId: null,
      selectionReason: "initial_choice",
      selectedBy: "practitioner",
      automaticFailover: false,
      outputsMerged: false,
    },
    inputState: {
      sourceCaseRevision: purpose.revision + 1,
      canonicalFixtureDigest: packet.documentSetDigest,
      purposeBriefId: purpose.id,
      purposeBriefRevision: purpose.revision,
      maskingRevision: packet.masking.revision,
      selectedSegmentIds: [...sourceContext.selectedSegmentIds],
      approvedRedactedInputDigest: input.approvedRedactedInputDigest,
    },
  };
  const audit = [
    AuditEventSchema.parse({
      id: "AUDIT-0001",
      caseId: record.id,
      eventType: "analysis_started",
      sequence: 1,
      actor: "practitioner",
      actorRole: purpose.practitionerRole,
      entityIds: [run.id],
      summary: "analysis_started",
      createdAt: response.run.startedAt,
      commandId: null,
      idempotencyKey: null,
      analysisRunId: run.id,
      providerId: run.provider.providerId,
      releaseConfigurationId: run.provider.releaseConfigurationId,
      providerDisclosureVersion: run.provider.disclosureVersion,
      promptVersion: run.promptVersion,
      rulesetVersion: run.rulesetVersion,
    }),
    AuditEventSchema.parse({
      id: "AUDIT-0002",
      caseId: record.id,
      eventType: "analysis_completed",
      sequence: 2,
      actor: "system",
      entityIds: [run.id],
      summary: "analysis_completed",
      createdAt: response.run.completedAt,
      commandId: null,
      idempotencyKey: null,
      analysisRunId: run.id,
      providerId: run.provider.providerId,
      releaseConfigurationId: run.provider.releaseConfigurationId,
      providerDisclosureVersion: run.provider.disclosureVersion,
      promptVersion: run.promptVersion,
      rulesetVersion: run.rulesetVersion,
    }),
  ];
  const draft = CaseStateSchema.parse({
    schemaVersion: "1.0.0",
    caseId: record.id,
    caseRevision: purpose.revision + 2,
    caseStatus: "draft",
    fixtureVersion: "1.0.0",
    documentSetDigest: packet.documentSetDigest,
    guidancePack: bundledGuidancePack.identity,
    purposeBrief: purpose,
    documents: packet.documents,
    segments: sourceContext.segments,
    selectedSegmentIds: [...sourceContext.selectedSegmentIds],
    masking: packet.masking,
    coverage: packet.coverage,
    coverageReviews: [],
    processing: packet.processing,
    pendingLiveAnalysis: null,
    analysisRuns: [run],
    activeAnalysisRunId: run.id,
    citations: response.citations,
    citationResolutions: [],
    candidates: response.candidates,
    reviews: [],
    dependencyChanges: [],
    urgentNeeds: [],
    interviewSetup: {
      id: "INTERVIEW-SESSION-001",
      caseId: record.id,
      purpose: "Practitioner-controlled interview planning",
      language: "Not recorded",
      interpreter: "Not recorded",
      accessibility: "Not recorded",
      safeContact: "Not recorded",
      consentConfirmed: false,
      updatedAt: now,
    },
    interviewQuestions: [],
    caseTasks: [],
    practitionerNotes: [],
    referralPlans: [],
    audit,
    exportGate: null,
    exports: [],
    currentExportId: null,
    currentExportManifest: null,
    exportedRevision: null,
    lastUpdatedAt: now,
  });
  return CaseStateSchema.parse({
    ...draft,
    caseStatus: deriveCaseStatus(draft),
  });
}
