import { createRef } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CaseStateProvider } from "../../../components/shell";
import type { ExportGate } from "../../../lib/contracts";
import { ExportGatePanel } from "../../../features/export/export-gate-panel";
import { ExportWorkspace } from "../../../features/export";
import {
  createGoldenEarlyState,
  createReadyState,
  createReviewedState,
  createSafeShareState,
} from "../../unit/export/renderers/manifest-fixture";

const renderPdfMock = vi.hoisted(() => vi.fn(async () => new Blob(["synthetic-pdf"], { type: "application/pdf" })));

vi.mock("../../../lib/export/renderers/pdf", () => ({
  renderExportPdf: renderPdfMock,
}));

const REQUIRED_LABELS = [
  "AI-assisted, human-reviewed case-preparation draft.",
  "Synthetic case.",
  "Not legal advice.",
  "Local legal verification required.",
];

const EXPECTED_REMEDIATION_DESTINATIONS = {
  PURPOSE_INCOMPLETE: "/case/demo/purpose?exportBlocker=PURPOSE_INCOMPLETE#purpose-form",
  AUTHORITY_INVALID: "/case/demo/purpose?exportBlocker=AUTHORITY_INVALID#authority-attested",
  DATA_ORIGIN_PROHIBITED: "/case/demo/intake?exportBlocker=DATA_ORIGIN_PROHIBITED#documents",
  REVIEW_INCOMPLETE: "/case/demo/review?exportBlocker=REVIEW_INCOMPLETE#review-workspace",
  CITATION_UNRESOLVED: "/case/demo/review?exportBlocker=CITATION_UNRESOLVED#citations",
  COVERAGE_CONSEQUENTIAL: "/case/demo/intake?exportBlocker=COVERAGE_CONSEQUENTIAL#coverage",
  JURISDICTION_UNVERIFIED: "/case/demo/purpose?exportBlocker=JURISDICTION_UNVERIFIED#jurisdiction-code",
  DEPENDENCY_UNRESOLVED: "/case/demo/review?exportBlocker=DEPENDENCY_UNRESOLVED#dependencies",
  MASK_REVIEW_INCOMPLETE: "/case/demo/intake?exportBlocker=MASK_REVIEW_INCOMPLETE#masking",
  PII_CHECK_FAILED: "/case/demo/intake?exportBlocker=PII_CHECK_FAILED#masking",
  PROCESSING_FAILED: "/case/demo/intake?exportBlocker=PROCESSING_FAILED#processing",
  SAFETY_VALIDATION_FAILED: "/case/demo/intake?exportBlocker=SAFETY_VALIDATION_FAILED#analysis",
  ANALYSIS_RUN_STALE: "/case/demo/intake?exportBlocker=ANALYSIS_RUN_STALE#analysis",
  GATE_EVALUATION_STALE: "/case/demo/export?exportBlocker=GATE_EVALUATION_STALE#export-gate",
  MINIMUM_NECESSITY_UNCONFIRMED: "/case/demo/export?exportBlocker=MINIMUM_NECESSITY_UNCONFIRMED#minimum-necessary-selection",
  OUTSIDE_STATED_PURPOSE: "/case/demo/purpose?exportBlocker=OUTSIDE_STATED_PURPOSE#requested-export",
} as const;

function renderWorkspace(initialState = createGoldenEarlyState()) {
  return render(
    <CaseStateProvider initialState={initialState}>
      <ExportWorkspace />
    </CaseStateProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:local-export") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
});

describe("TASK-022 export gate and workspace", () => {
  it("opens the blocked gate, focuses it, names exactly the two early blockers, and exposes no bypass", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    expect(screen.queryByRole("button", { name: "Create reviewed handoff" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Generate PDF/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Download/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Check readiness" }));

    const gateHeading = await screen.findByRole("heading", { name: "Readiness result" });
    await waitFor(() => expect(gateHeading).toHaveFocus());
    expect(screen.getByRole("heading", { name: "Complete the remaining review decisions" })).toBeInTheDocument();
    const blocker = screen.getByRole("heading", { name: "Complete the remaining review decisions" }).closest("section");
    expect(blocker).not.toBeNull();
    expect(within(blocker!).getByText("CAND-SENDER-0402, CAND-URG-INTERPRETER")).toBeInTheDocument();
    expect(within(blocker!).getByRole("link", { name: "Return to Review" })).toHaveAttribute(
      "href",
      "/case/demo/review?exportBlocker=REVIEW_INCOMPLETE#review-workspace",
    );
    expect(screen.getByText(/There is no bypass/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create reviewed handoff" })).not.toBeInTheDocument();
  });

  it("presents every canonical blocker with severity, affected IDs, remediation, and a stable link", () => {
    const state = createReadyState({ createManifest: false });
    if (!state.exportGate || state.exportGate.status !== "ready") throw new Error("Missing ready gate fixture.");
    const codes = [
      "PURPOSE_INCOMPLETE",
      "AUTHORITY_INVALID",
      "DATA_ORIGIN_PROHIBITED",
      "REVIEW_INCOMPLETE",
      "CITATION_UNRESOLVED",
      "COVERAGE_CONSEQUENTIAL",
      "JURISDICTION_UNVERIFIED",
      "DEPENDENCY_UNRESOLVED",
      "MASK_REVIEW_INCOMPLETE",
      "PII_CHECK_FAILED",
      "PROCESSING_FAILED",
      "SAFETY_VALIDATION_FAILED",
      "ANALYSIS_RUN_STALE",
      "GATE_EVALUATION_STALE",
      "MINIMUM_NECESSITY_UNCONFIRMED",
      "OUTSIDE_STATED_PURPOSE",
    ] as const;
    const gate: ExportGate = {
      ...state.exportGate,
      status: "blocked",
      freshness: "current",
      blockers: codes.map((code) => ({
        id: `EXPORT-BLOCKER-${code}`,
        code,
        severity: "blocking",
        entityIds: [`ENTITY-${code}`],
        message: `Message for ${code}`,
        remediation: `Remediation for ${code}`,
      })),
    };

    render(<ExportGatePanel gate={gate} headingRef={createRef<HTMLHeadingElement>()} />);
    for (const code of codes) {
      const codeValue = screen.getByText(code, { selector: "dd" });
      const section = codeValue.closest("section");
      expect(section).not.toBeNull();
      expect(within(section!).getByText(`ENTITY-${code}`, { selector: "dd" })).toBeInTheDocument();
      expect(within(section!).getByText(`Remediation for ${code}`)).toBeInTheDocument();
      expect(within(section!).getByRole("link")).toHaveAttribute(
        "href",
        EXPECTED_REMEDIATION_DESTINATIONS[code],
      );
    }
    expect(document.body.innerHTML).not.toContain("/case/demo/documents");
  });

  it("creates one ready manifest, previews semantic and canonical JSON before PDF, and downloads locally", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderWorkspace(createReviewedState());

    await user.click(screen.getByRole("button", { name: "Check readiness" }));
    expect(await screen.findByText("Ready to create the handoff")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create reviewed handoff" }));

    expect(await screen.findByRole("heading", { name: "Semantic handoff preview" })).toBeInTheDocument();
    for (const label of REQUIRED_LABELS) expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText("Single-run provenance")).toBeInTheDocument();
    expect(renderPdfMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("tab", { name: "Structured JSON" }));
    const jsonPanel = screen.getByRole("tabpanel");
    const json = jsonPanel.textContent ?? "";
    expect(json).toContain('"schemaVersion":"1.0.0"');
    expect(json).toContain('"redactionCheck":"passed"');
    for (const label of REQUIRED_LABELS) expect(json).toContain(label);

    await user.click(screen.getByRole("button", { name: "Download JSON locally" }));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local-export");
    expect(fetchSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Generate PDF locally" }));
    expect(await screen.findByText("PDF is ready for local download from the same canonical manifest.")).toBeInTheDocument();
    expect(renderPdfMock).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Download PDF locally" }));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps safe share blocked until the visible minimum-necessary selection is confirmed", async () => {
    const user = userEvent.setup();
    renderWorkspace(createSafeShareState());

    expect(screen.getByText("Minimum-necessary safe share")).toBeInTheDocument();
    expect(screen.getByText("None selected")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Check readiness" }));
    expect(await screen.findByRole("heading", { name: "Confirm the minimum-necessary selection" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create reviewed handoff" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /CAND-TL-ARRIVAL/ }));
    await user.click(screen.getByRole("checkbox", { name: /I confirm this is the minimum necessary/ }));
    expect(screen.getByText("CAND-TL-ARRIVAL", { selector: "dd" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Check readiness" }));

    expect(await screen.findByText("Ready to create the handoff")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create reviewed handoff" }));
    expect(await screen.findByText("Included candidate IDs: CAND-TL-ARRIVAL.")).toBeInTheDocument();
    expect(screen.getByText(/Excluded candidate IDs:/)).toBeInTheDocument();
  });

  it("offers handoff-kind changes only through Purpose and never as an export-side switch", () => {
    renderWorkspace(createReadyState({ createManifest: false }));
    expect(screen.getByRole("heading", { name: "Readiness result" })).toBeInTheDocument();
    expect(screen.getByText("Ready to create the handoff")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change handoff kind in Purpose" })).toHaveAttribute(
      "href",
      "/case/demo/purpose#requested-export",
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("supports arrow-key movement between semantic and JSON preview tabs", async () => {
    renderWorkspace(createReadyState());
    const semanticTab = screen.getByRole("tab", { name: "Readable preview" });
    semanticTab.focus();
    fireEvent.keyDown(semanticTab, { key: "ArrowRight" });
    await waitFor(() => expect(screen.getByRole("tab", { name: "Structured JSON" })).toHaveFocus());
    expect(screen.getByRole("tab", { name: "Structured JSON" })).toHaveAttribute("aria-selected", "true");
  });
});
