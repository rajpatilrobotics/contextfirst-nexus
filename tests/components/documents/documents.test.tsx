import { useMemo } from "react";
import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CaseStateProvider, useCaseState } from "../../../components/shell";
import {
  DocumentsWorkspace,
  PROCESSING_STAGE_ORDER,
  ProcessingStageList,
} from "../../../features/documents";
import {
  runSelectedAnalysis,
  type RunControllerOptions,
} from "../../../features/analysis/run-controller";
import type { CaseState, ProcessingStage } from "../../../lib/contracts";
import {
  CfnDemoPdfSourceService,
  type CfnDemoDocumentServiceResult,
  type CfnDemoPdfSelectionValidation,
  type PdfDocumentLike,
  type PdfJsRuntimeLike,
} from "../../../lib/documents";
import { cfnDemoFixture } from "../../../lib/fixtures";
import { trustedPurposeBrief } from "../../../lib/analysis/replay";
import {
  CASE_STATE_STORAGE_KEY,
  createInitialCaseState,
} from "../../../lib/state";

const NOW = "2026-07-16T10:00:00.000Z";
let processedFixture: CfnDemoDocumentServiceResult;

function selectedDemoFiles() {
  return cfnDemoFixture.documents.map(
    (document) =>
      new File([`%PDF-1.7 ${document.id}`], document.fileName, {
        type: "application/pdf",
      }),
  );
}

async function verifiedSelection(
  files: readonly File[],
): Promise<CfnDemoPdfSelectionValidation> {
  return {
    status: "verified",
    packetStatus: "success",
    files: files.map((file, index) => ({
      documentId: `D0${index + 1}`,
      fileName: file.name,
      byteLength: file.size,
      sha256: "verified-in-service-tests",
      selectionStatus: "selected",
      verificationStatus: "verified",
      readinessStatus: "ready",
      file,
    })),
    issues: [],
    error: null,
  } as CfnDemoPdfSelectionValidation;
}

function pageText(pageId: string) {
  return cfnDemoFixture.segments
    .filter((segment) => segment.pageId === pageId)
    .map((segment) => segment.rawText)
    .join(" ");
}

function fixtureRuntime(): PdfJsRuntimeLike {
  return {
    GlobalWorkerOptions: {},
    getDocument(input) {
      if (!("url" in input)) throw new Error("expected fixture URL");
      const { url } = input;
      const fixtureDocument = cfnDemoFixture.documents.find((document) =>
        url.endsWith(document.fileName),
      );
      if (!fixtureDocument) throw new Error("unexpected fixture path");
      const availablePages = fixtureDocument.pages.filter(
        (page) => page.availability === "available",
      );
      const document: PdfDocumentLike = {
        numPages: availablePages.length,
        async getPage(pageNumber) {
          const page = availablePages[pageNumber - 1];
          return {
            async getTextContent() {
              return {
                items: pageText(page.id)
                  .split(" ")
                  .map((word, index) => ({
                    str: word,
                    transform: [1, 0, 0, 1, 72 + index, 120],
                    width: Math.max(word.length * 5, 1),
                    height: 10,
                  })),
              };
            },
          };
        },
      };
      return { promise: Promise.resolve(document) };
    },
  };
}

function purposeReadyState(): CaseState {
  return {
    ...createInitialCaseState(NOW),
    purposeBrief: trustedPurposeBrief(),
  };
}

function StateProbe() {
  const { state } = useCaseState();
  const lastAuditType = useMemo(
    () => state.audit.at(-1)?.eventType ?? "none",
    [state.audit],
  );
  return (
    <aside aria-label="Test state probe">
      <span data-testid="last-audit-event">{lastAuditType}</span>
      <span data-testid="mask-review-state">{state.masking.reviewStatus}</span>
      <span data-testid="leak-scan-state">{state.masking.leakScanStatus}</span>
    </aside>
  );
}

function renderWorkspace({
  initialState = purposeReadyState(),
  processSources = vi.fn(async () => processedFixture),
  processSelectedSources = vi.fn(async () => processedFixture),
  runAnalysis,
}: {
  initialState?: CaseState;
  processSources?: () => Promise<CfnDemoDocumentServiceResult>;
  processSelectedSources?: (
    files: readonly File[],
  ) => Promise<CfnDemoDocumentServiceResult>;
  runAnalysis?: (
    options: RunControllerOptions,
  ) => ReturnType<typeof runSelectedAnalysis>;
} = {}) {
  return render(
    <CaseStateProvider initialState={initialState}>
      <DocumentsWorkspace
        processSources={processSources}
        processSelectedSources={processSelectedSources}
        runAnalysis={runAnalysis}
        validateSelection={verifiedSelection}
      />
      <StateProbe />
    </CaseStateProvider>,
  );
}

async function processLocalFixture(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(
    screen.getByLabelText("Choose PDF files", { selector: "input" }),
    selectedDemoFiles(),
  );
  await screen.findByRole("region", {
    name: "Browser-local processing complete",
  });
}

async function approveEveryMask(user: ReturnType<typeof userEvent.setup>) {
  const suggestions = screen.getByRole("list", { name: "Mask suggestions" });
  const suggestionItems = within(suggestions).getAllByRole("listitem");
  for (const suggestion of suggestionItems) {
    await user.click(
      within(suggestion).getByRole("button", { name: "Approve mask" }),
    );
  }
}

beforeAll(async () => {
  const service = new CfnDemoPdfSourceService(async () => fixtureRuntime());
  processedFixture = await service.processFixture();
  await service.cleanup();
});

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("TASK-019 intake, coverage, and containment", () => {
  it("starts empty, then shows the verified seven-file workflow and explicit D04 missingness", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    const picker = screen.getByLabelText("Choose PDF files", { selector: "input" });
    expect(picker).toHaveAttribute("multiple");
    expect(
      screen.getByRole("region", { name: "No documents selected yet" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^D01 ·/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Coverage manifest" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start analysis" })).not.toBeInTheDocument();

    await processLocalFixture(user);

    expect(screen.getAllByText("Hackathon demo record")).toHaveLength(7);
    expect(
      screen.getByText(/Seven selected, verified PDFs/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /case|narrative|identifier/i })).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/synthetic/i);
    expect(document.body).not.toHaveTextContent(/gpt-|gemini-|mistral-|\bmodel\b/i);

    const d04Heading = screen.getByRole("heading", { name: /^D04 ·/ });
    const d04Card = d04Heading.closest("section");
    expect(d04Card).not.toBeNull();
    expect(within(d04Card as HTMLElement).getByText("4")).toBeInTheDocument();
    expect(
      within(d04Card as HTMLElement).getByText("Unavailable, missing page"),
    ).toBeInTheDocument();

    const stages = screen.getByRole("list", { name: "Eight processing stages" });
    expect(within(stages).getAllByRole("listitem")).toHaveLength(8);
    for (const name of [
      "Intake validation",
      "Text extraction",
      "Coverage calculation",
      "Identifier masking",
      "Candidate extraction",
      "Citation validation",
      "Timeline and Nexus assembly",
      "Safety and export-gate checks",
    ]) {
      expect(within(stages).getByText(name)).toBeInTheDocument();
    }
    const coverageCard = screen
      .getByRole("heading", { name: "Coverage manifest" })
      .closest("section");
    expect(coverageCard).not.toBeNull();
    expect(
      within(coverageCard as HTMLElement).getByText("Expected pages").nextElementSibling,
    ).toHaveTextContent("17");
    expect(
      within(coverageCard as HTMLElement).getByText("Available pages").nextElementSibling,
    ).toHaveTextContent("16");
    expect(screen.getByText(/^D04-P3: Unavailable, missing page$/)).toBeInTheDocument();
    expect(screen.getByText(/never as a completeness or confidence score/i)).toHaveTextContent(
      /never as a completeness/i,
    );

    const supportedClasses = screen.getByRole("list", {
      name: "Declared supported mask classes",
    });
    expect(within(supportedClasses).getAllByRole("listitem")).toHaveLength(7);
    for (const label of [
      "Person name",
      "Email",
      "Phone",
      "Passport",
      "Bank account",
      "Address",
      "Date of birth",
    ]) {
      expect(within(supportedClasses).getByText(label)).toBeInTheDocument();
    }

    await user.click(screen.getByText("Add a range-based mask"));
    expect(
      screen.getByLabelText("Source segment", {
        selector: "#manual-mask-segment",
      }),
    ).toHaveValue("D01-P1-S01");

    const persisted = window.sessionStorage.getItem(CASE_STATE_STORAGE_KEY);
    expect(persisted).not.toBeNull();
    expect(persisted).not.toContain("%PDF");
    for (const identifier of cfnDemoFixture.seededIdentifiers.slice(0, 7)) {
      expect(persisted).not.toContain(identifier);
    }
  });

  it("keeps completed work visible and offers only the failed local stage retry", async () => {
    const onRetry = vi.fn();
    const stages: ProcessingStage[] = [
      {
        name: "intake_validation",
        status: "completed",
        affectedDocumentIds: ["D01"],
        retryable: false,
      },
      {
        name: "text_extraction",
        status: "failed",
        errorCode: "SOURCE_UNAVAILABLE",
        affectedDocumentIds: ["D04"],
        retryable: true,
      },
    ];
    const user = userEvent.setup();
    render(<ProcessingStageList onRetry={onRetry} stages={stages} />);

    expect(screen.getAllByText("Status: completed")).toHaveLength(1);
    expect(screen.getByText("Affected records: D04")).toBeInTheDocument();
    expect(screen.getByText(/Safe code: SOURCE_UNAVAILABLE/)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(PROCESSING_STAGE_ORDER.length);
    const retry = screen.getByRole("button", { name: "Retry Text extraction" });
    expect(screen.getAllByRole("button", { name: /Retry/ })).toHaveLength(1);
    await user.click(retry);
    expect(onRetry).toHaveBeenCalledWith("text_extraction");
  });

  it("renders source text redacted first, audits an intentional reveal, restores focus, and contains D07", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await processLocalFixture(user);

    const maskedSegment = cfnDemoFixture.segments.find(
      (segment) => segment.id === "D01-P1-S01",
    );
    if (!maskedSegment) throw new Error("fixture segment missing");
    expect(screen.getByText(maskedSegment.redactedText)).toBeInTheDocument();
    expect(screen.queryByText(maskedSegment.rawText)).not.toBeInTheDocument();

    const revealButton = screen.getByRole("button", {
      name: "Reveal demo original",
    });
    await user.click(revealButton);
    expect(
      screen.getByRole("region", { name: "Intentional sensitive-source review" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(maskedSegment.rawText)).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Confirm demo-original reveal" }),
    );
    expect(screen.getByText(maskedSegment.rawText)).toBeInTheDocument();
    expect(screen.getByTestId("last-audit-event")).toHaveTextContent(
      "source_revealed",
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByText(maskedSegment.rawText)).not.toBeInTheDocument();
    expect(revealButton).toHaveFocus();

    await user.selectOptions(
      screen.getByLabelText("Source segment", {
        selector: "#source-segment-select",
      }),
      "D07-P2-S03",
    );
    const instruction = cfnDemoFixture.segments.find(
      (segment) => segment.id === "D07-P2-S03",
    );
    if (!instruction) throw new Error("instruction fixture missing");
    expect(
      screen.getByRole("region", { name: "Untrusted instruction-like evidence" }),
    ).toHaveTextContent(/inert evidence only/i);
    expect(screen.getByText(instruction.redactedText)).toBeInTheDocument();
    expect(screen.getByText(instruction.redactedText).closest("a")).toBeNull();
    expect(screen.queryByRole("button", { name: instruction.redactedText })).not.toBeInTheDocument();
  });
});

describe("TASK-019 masking and controller-backed analysis", () => {
  it("blocks on pending or rejected masks, passes the leak scan, and invokes TASK-018 exactly once", async () => {
    let continueRun: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      continueRun = resolve;
    });
    const runAnalysis = vi.fn(async (options: RunControllerOptions) => {
      await gate;
      return runSelectedAnalysis(options);
    });
    const user = userEvent.setup();
    renderWorkspace({ runAnalysis });
    await processLocalFixture(user);

    expect(screen.queryByRole("button", { name: "Start analysis" })).not.toBeInTheDocument();
    const suggestions = screen.getByRole("list", { name: "Mask suggestions" });
    const firstSuggestion = within(suggestions).getAllByRole("listitem")[0];
    const replacement = within(firstSuggestion).getByLabelText(
      "Readable replacement preview",
    );
    await user.clear(replacement);
    await user.click(replacement);
    await user.paste("[Reviewed person masked]");
    await user.click(
      within(firstSuggestion).getByRole("button", {
        name: "Save edited replacement",
      }),
    );

    const secondSuggestion = within(
      screen.getByRole("list", { name: "Mask suggestions" }),
    ).getAllByRole("listitem")[1];
    await user.click(
      within(secondSuggestion).getByRole("button", {
        name: "Reject suggestion",
      }),
    );
    expect(
      screen.getByRole("button", {
        name: "Complete masking review and run leak scan",
      }),
    ).toBeDisabled();
    expect(screen.getByTestId("leak-scan-state")).toHaveTextContent("not_run");
    expect(screen.queryByRole("button", { name: "Start analysis" })).not.toBeInTheDocument();

    await approveEveryMask(user);
    await user.click(
      screen.getByRole("button", {
        name: "Complete masking review and run leak scan",
      }),
    );
    expect(screen.getByTestId("mask-review-state")).toHaveTextContent("approved");
    expect(screen.getByTestId("leak-scan-state")).toHaveTextContent("passed");

    const start = await screen.findByRole("button", { name: "Start analysis" });
    await user.click(start);
    await waitFor(() => expect(runAnalysis).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole("region", { name: "Analysis pending" }),
    ).toBeInTheDocument();
    continueRun?.();
    await screen.findByRole("region", { name: "Analysis completed" });
    expect(runAnalysis).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: "Canonical analysis candidates" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Canonical active run" })).toHaveTextContent(
      /RUN-REPLAY-1.*succeeded/i,
    );
  });
});
