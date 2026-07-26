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
  "The authorized public source describes a work arrangement for review.";

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
        releaseConfigurationId: "groq-oss-free-v1",
        requestedModel: "openai/gpt-oss-120b",
        serviceTier: "unpaid",
        adapterVersion: "test",
        returnedModel: "openai/gpt-oss-120b",
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
      screen.getByRole("checkbox", {
        name: /I confirm this packet contains only synthetic or authorized public material/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Start analysis" }));
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
});
