import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BrowserCaseStructuredAnalysisWorkspace } from "../../../features/analysis/structured";
import { trustedPurposeBrief } from "../../../lib/analysis/replay";
import {
  createBrowserCase,
  createEmptyBrowserCaseRegistry,
  loadBrowserCaseRegistry,
  persistBrowserCaseRegistry,
  saveBrowserCaseDocumentPacket,
  saveBrowserCasePurpose,
} from "../../../lib/cases";
import type { BrowserCaseAnalysisStore } from "../../../lib/cases/browser-case-analysis-store";
import type { BrowserCaseFileStore } from "../../../lib/cases/browser-case-file-store";
import type {
  BrowserAnalyzeResponse,
  CaseState,
  SourceSegment,
} from "../../../lib/contracts";
import type { LocalPdfDocumentServiceResult } from "../../../lib/documents";
import {
  applyLeakScanResult,
  approveMaskingReview,
  createEmptyMaskingReview,
  scanProviderPayload,
} from "../../../lib/redaction";
import { multipleSelectableProviderOptions } from "../provider/fixtures";

const CASE_ID = "CFN-CASE-ANALYSIS";
const DIGEST = "d".repeat(64);
const NOW = "2026-07-26T00:00:00.000Z";
const TEXT =
  "A recruiter advertised travel and later threatened the worker. An interpreter may be needed for the hearing.";

function sourceSegment(): SourceSegment {
  return {
    id: "D01-P1-S1",
    documentId: "D01",
    pageId: "D01-P1",
    pageNumber: 1,
    ordinal: 1,
    rawText: TEXT,
    redactedText: TEXT,
    boundingBoxes: [],
    sourceLanguage: "en",
    translationStatus: "original_language",
    extractionQuality: "machine_extracted",
    instructionAdvisory: "no_signal",
    modelVisibility: "not_sent",
    supportEligibility: "candidate_eligible",
  };
}

function processedResult(): LocalPdfDocumentServiceResult {
  return {
    caseId: CASE_ID,
    fixtureVersion: "1.0.0",
    documentSetDigest: DIGEST,
    fileMetadata: [
      {
        documentId: "D01",
        fileName: "authorized-public.pdf",
        byteLength: 8,
        sha256: DIGEST,
      },
    ],
    documents: [
      {
        id: "D01",
        caseId: CASE_ID,
        fixtureVersion: "1.0.0",
        fileName: "authorized-public.pdf",
        displayName: "Authorized public source",
        sourceType: "communication",
        dataOrigin: "browser_local",
        expectedPageCount: 1,
        pages: [
          {
            id: "D01-P1",
            documentId: "D01",
            pageNumber: 1,
            expected: true,
            availability: "available",
            extractionStatus: "completed",
            extractedCharacterCount: TEXT.length,
          },
        ],
        provenanceStatus: "unverified",
        processingStatus: "completed",
        syntheticLabelPresent: false,
      },
    ],
    segments: [sourceSegment()],
    coverage: {
      expectedDocuments: 1,
      processedDocuments: 1,
      expectedPages: 1,
      availablePages: 1,
      issues: [],
      hasConsequentialOpenIssue: false,
    },
    processing: [],
    selectedSegmentIds: ["D01-P1-S1"],
  };
}

function approvedMasking() {
  const approved = approveMaskingReview(
    createEmptyMaskingReview(),
    [sourceSegment()],
    NOW,
  );
  if (!approved.ok) throw new Error("expected_masking_approval");
  return applyLeakScanResult(
    approved.review,
    scanProviderPayload(TEXT),
  );
}

function storeReadyCase() {
  const created = createBrowserCase(
    createEmptyBrowserCaseRegistry(),
    {
      assignedPractitioner: "Demo practitioner",
      displayReference: "REF-2026-ANALYSIS",
      personAlias: "J. Example",
    },
    { idNonce: "ANALYSIS", now: NOW },
  );
  if (!created.ok) throw new Error(created.reason);
  const purpose = trustedPurposeBrief();
  const withPurpose = saveBrowserCasePurpose(created.registry, CASE_ID, {
    ...purpose,
    id: `PURPOSE-${CASE_ID}`,
    caseId: CASE_ID,
    sourceMaterialClassification: "user_attested_authorized_public",
    authority: {
      ...purpose.authority,
      basis: "user_attested_authorized_public_material",
      consentStatus: "not_applicable_authorized_public_material",
    },
    createdAt: NOW,
    updatedAt: NOW,
  });
  if (!withPurpose.ok) throw new Error(withPurpose.reason);
  const withPacket = saveBrowserCaseDocumentPacket(
    withPurpose.registry,
    CASE_ID,
    {
      schemaVersion: "1.0.0",
      caseId: CASE_ID,
      documentSetDigest: DIGEST,
      fileMetadata: processedResult().fileMetadata!,
      documents: processedResult().documents,
      coverage: processedResult().coverage,
      processing: [],
      masking: approvedMasking(),
      ocrVerifications: [],
      contentPersistence: "browser_indexeddb",
      updatedAt: NOW,
    },
  );
  if (!withPacket.ok) throw new Error(withPacket.reason);
  const persisted = persistBrowserCaseRegistry(
    window.localStorage,
    withPacket.registry,
  );
  if (!persisted.ok) throw new Error(persisted.reason);
}

function memoryAnalysisStore(): BrowserCaseAnalysisStore & {
  snapshots: Map<string, CaseState>;
} {
  const snapshots = new Map<string, CaseState>();
  return {
    snapshots,
    async load(caseId) {
      return snapshots.get(caseId) ?? null;
    },
    async save(caseId, state) {
      snapshots.set(caseId, state);
    },
  };
}

function successfulResponse(): BrowserAnalyzeResponse {
  return {
    schemaVersion: "1.0.0",
    outcome: "succeeded",
    run: {
      id: "RUN-DYNAMIC-001",
      mode: "live",
      provider: {
        providerId: "groq",
        releaseConfigurationId: "groq-oss-20b-free-v1",
        requestedModel: "openai/gpt-oss-20b",
        serviceTier: "unpaid",
        adapterVersion: "test",
        returnedModel: "openai/gpt-oss-20b",
        inferenceSetting: { kind: "reasoning_effort", value: "medium" },
        disclosureVersion: "1.0.0",
        providerTransmission: true,
      },
      promptVersion: "1.0.0",
      requestSchemaVersion: "1.0.0",
      responseSchemaVersion: "1.0.0",
      fixtureVersion: "1.0.0",
      rulesetVersion: "1.0.0",
      checkpointProvenance: null,
      startedAt: NOW,
      completedAt: NOW,
      durationMs: 0,
      inputSegmentCount: 1,
      candidateCount: 0,
      citationCount: 0,
      quarantinedCount: 0,
      status: "succeeded",
      failure: null,
    },
    candidates: [],
    citations: [],
    quarantined: [],
    attempts: [
      {
        providerId: "mistral",
        outcome: "data_policy_blocked",
        failureClassification: null,
      },
      {
        providerId: "google_gemini",
        outcome: "data_policy_blocked",
        failureClassification: null,
      },
      {
        providerId: "groq",
        outcome: "accepted",
        failureClassification: null,
      },
    ],
    error: null,
  };
}

describe("browser-created Structured Analysis workspace", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts from approved redacted input, persists the canonical result, reloads it, and rejects it after Purpose changes", async () => {
    storeReadyCase();
    const analysisStore = memoryAnalysisStore();
    const file = new File(
      [new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])],
      "authorized-public.pdf",
      { type: "application/pdf" },
    );
    const fileStore: BrowserCaseFileStore = {
      async load() {
        return [file];
      },
      async save() {},
    };
    const processSources = vi.fn(async () => processedResult());
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return new Response(JSON.stringify(successfulResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({
          schemaVersion: "1.0.0",
          liveAnalysisEnabled: true,
          replayEnabled: true,
          options: multipleSelectableProviderOptions(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    const first = render(
      <BrowserCaseStructuredAnalysisWorkspace
        analysisStore={analysisStore}
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );
    expect(await screen.findByText("Live service ready")).toBeInTheDocument();
    await user.click(
      screen.getByRole("radio", { name: /Live AI analysis/i }),
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: /I confirm this packet contains only synthetic or authorized public material/i,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Start live AI analysis",
      }),
    );
    expect(
      await screen.findByRole("region", {
        name: "Analysis completed with zero candidates",
      }),
    ).toBeInTheDocument();
    expect(analysisStore.snapshots.get(CASE_ID)).toMatchObject({
      caseId: CASE_ID,
      activeAnalysisRunId: "RUN-DYNAMIC-001",
      candidates: [],
      urgentNeeds: [],
      caseTasks: [],
      practitionerNotes: [],
    });
    expect(
      screen.getByRole("link", { name: "Review Documents" }),
    ).toHaveAttribute("href", `/case/${CASE_ID}/documents`);
    await user.click(
      screen.getByRole("button", { name: "Choose analysis mode" }),
    );
    expect(
      screen.getByRole("region", { name: "Run another analysis" }),
    ).toHaveTextContent(/current reviewed result stays saved/i);
    expect(
      screen.getByRole("radio", { name: /Private browser analysis/i }),
    ).toBeEnabled();
    expect(
      screen.getByRole("radio", { name: /Live AI analysis/i }),
    ).toBeEnabled();
    expect(analysisStore.snapshots.get(CASE_ID)?.activeAnalysisRunId).toBe(
      "RUN-DYNAMIC-001",
    );
    await user.click(
      screen.getByRole("button", { name: "Keep current result" }),
    );
    expect(
      await screen.findByRole("region", {
        name: "Analysis completed with zero candidates",
      }),
    ).toBeInTheDocument();

    first.unmount();
    const second = render(
      <BrowserCaseStructuredAnalysisWorkspace
        analysisStore={analysisStore}
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );
    expect(
      await screen.findByRole("region", {
        name: "Analysis completed with zero candidates",
      }),
    ).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(1);
    second.unmount();

    const loaded = loadBrowserCaseRegistry(window.localStorage);
    const current = loaded.registry.cases[0];
    if (!current?.purposeBrief) throw new Error("missing_purpose");
    const changed = saveBrowserCasePurpose(
      loaded.registry,
      CASE_ID,
      {
        ...current.purposeBrief,
        revision: current.purposeBrief.revision + 1,
        statedPurpose: `${current.purposeBrief.statedPurpose} Updated.`,
        updatedAt: "2026-07-26T00:05:00.000Z",
      },
    );
    if (!changed.ok) throw new Error(changed.reason);
    persistBrowserCaseRegistry(window.localStorage, changed.registry);

    const stale = render(
      <BrowserCaseStructuredAnalysisWorkspace
        analysisStore={analysisStore}
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("region", { name: "Analysis needs rerun" }),
      ).toBeInTheDocument(),
    );
    stale.unmount();
  });

  it("runs deterministic browser-local analysis without a provider call and persists exact cited lane candidates", async () => {
    storeReadyCase();
    const analysisStore = memoryAnalysisStore();
    const file = new File(
      [new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])],
      "authorized-public.pdf",
      { type: "application/pdf" },
    );
    const fileStore: BrowserCaseFileStore = {
      async load() {
        return [file];
      },
      async save() {},
    };
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        void input;
        void init;
        return new Response(
          JSON.stringify({
            schemaVersion: "1.0.0",
            liveAnalysisEnabled: false,
            replayEnabled: true,
            options: multipleSelectableProviderOptions().map((option) =>
              option.mode === "live"
                ? {
                    ...option,
                    availabilityStatus: "disabled",
                    selectable: false,
                  }
                : option,
            ),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    const localWorkspace = render(
      <BrowserCaseStructuredAnalysisWorkspace
        analysisStore={analysisStore}
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={vi.fn(async () => processedResult())}
      />,
    );

    expect(
      await screen.findByRole("button", {
        name: "Run browser-local analysis",
      }),
    ).toBeEnabled();
    expect(
      screen.getByRole("radio", { name: /Private browser analysis/i }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Live AI analysis/i }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", {
        name: "Run browser-local analysis",
      }),
    );

    expect(
      await screen.findByText(
        "Browser-local rules · no provider transmission",
      ),
    ).toBeInTheDocument();
    const saved = analysisStore.snapshots.get(CASE_ID);
    expect(saved?.analysisRuns[0]).toMatchObject({
      mode: "deterministic_replay",
      provider: {
        adapterVersion: "browser-deterministic-analysis-v5",
        providerTransmission: false,
      },
      status: "succeeded",
    });
    expect(
      new Set(
        saved?.candidates
          .filter((candidate) => candidate.kind === "review_lane_item")
          .map((candidate) => candidate.lane),
      ),
    ).toEqual(
      new Set([
        "trafficking_indicators",
        "protection_remedy_urgency",
      ]),
    );
    expect(
      saved?.candidates.some((candidate) => candidate.kind === "context_gap"),
    ).toBe(true);
    expect(
      saved?.candidates
        .filter((candidate) => candidate.kind === "review_lane_item")
        .every(
          (candidate) =>
            candidate.deterministicMatch?.exactPhrase &&
            candidate.deterministicMatch.rationale,
        ),
    ).toBe(true);
    expect(
      await screen.findByLabelText("Deterministic trigger explanation"),
    ).toHaveTextContent("Exact matched phrase");
    expect(
      saved?.candidates.some(
        (candidate) => candidate.kind === "nexus_relationship",
      ),
    ).toBe(true);
    expect(saved?.citations.every((citation) => {
      const segment = saved.segments.find(
        (item) => item.id === citation.segmentId,
      );
      return Boolean(
        segment &&
          citation.validationStatus === "exact_match" &&
          segment.redactedText.slice(
            citation.redactedSegmentRange.start,
            citation.redactedSegmentRange.end,
          ) === citation.quotedText,
      );
    })).toBe(true);
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(0);

    if (!saved) throw new Error("expected_saved_local_analysis");
    localWorkspace.unmount();
    analysisStore.snapshots.set(CASE_ID, {
      ...saved,
      analysisRuns: saved.analysisRuns.map((run) => ({
        ...run,
        provider: {
          ...run.provider,
          adapterVersion: "browser-deterministic-analysis-v1",
        },
      })),
    });
    render(
      <BrowserCaseStructuredAnalysisWorkspace
        analysisStore={analysisStore}
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={vi.fn(async () => processedResult())}
      />,
    );
    expect(
      await screen.findByRole("region", { name: "Analysis needs rerun" }),
    ).toBeInTheDocument();
  });
});
