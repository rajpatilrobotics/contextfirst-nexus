import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserCaseDocumentsWorkspace } from "../../../features/documents";
import { BrowserCasePurposeWorkspace } from "../../../features/purpose";
import { trustedPurposeBrief } from "../../../lib/analysis/replay";
import {
  BROWSER_CASE_REGISTRY_STORAGE_KEY,
  createBrowserCase,
  createEmptyBrowserCaseRegistry,
  persistBrowserCaseRegistry,
  restoreBrowserCaseRegistry,
  saveBrowserCasePurpose,
} from "../../../lib/cases";
import { replayOnlyProviderOptions } from "../provider/fixtures";

const CASE_ID = "CFN-CASE-ALPHA";
const DISPLAY_REFERENCE = "REF-2026-ALPHA-SYN";
const NOW = "2026-07-25T09:00:00.000Z";
const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

function availabilityResponse() {
  return new Response(
    JSON.stringify({
      schemaVersion: "1.0.0",
      liveAnalysisEnabled: false,
      replayEnabled: true,
      options: replayOnlyProviderOptions(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function storeCase({ withPurpose = false }: { withPurpose?: boolean } = {}) {
  const created = createBrowserCase(
    createEmptyBrowserCaseRegistry(),
    {
      assignedPractitioner: "Demo practitioner",
      displayReference: DISPLAY_REFERENCE,
      personAlias: "J. Example",
    },
    { idNonce: "ALPHA", now: NOW },
  );
  if (!created.ok) throw new Error(created.reason);

  let registry = created.registry;
  if (withPurpose) {
    const source = trustedPurposeBrief();
    const saved = saveBrowserCasePurpose(registry, CASE_ID, {
      ...source,
      id: `PURPOSE-${CASE_ID}`,
      caseId: CASE_ID,
      createdAt: NOW,
      updatedAt: NOW,
    });
    if (!saved.ok) throw new Error(saved.reason);
    registry = saved.registry;
  }
  const persisted = persistBrowserCaseRegistry(window.localStorage, registry);
  if (!persisted.ok) throw new Error(persisted.reason);
}

beforeEach(() => {
  window.localStorage.clear();
  routerPush.mockClear();
  vi.stubGlobal("fetch", vi.fn(async () => availabilityResponse()));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browser-created Purpose to Documents flow", () => {
  it("saves first, preserves the case ID, then navigates to dynamic Documents", async () => {
    storeCase({ withPurpose: true });
    const user = userEvent.setup();
    render(<BrowserCasePurposeWorkspace caseId={CASE_ID} />);

    await user.click(
      await screen.findByRole("button", {
        name: "Save Case Purpose Brief",
      }),
    );

    await waitFor(() =>
      expect(routerPush).toHaveBeenCalledWith(
        `/case/${CASE_ID}/documents`,
      ),
    );
    expect(routerPush).not.toHaveBeenCalledWith("/case/demo/documents");

    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(restored.ok).toBe(true);
    expect(restored.registry.cases[0]?.purposeBrief).toMatchObject({
      caseId: CASE_ID,
      id: `PURPOSE-${CASE_ID}`,
      revision: 2,
      statedPurpose: trustedPurposeBrief().statedPurpose,
    });
  });

  it("keeps an invalid form on Purpose and shows the existing validation feedback", async () => {
    storeCase();
    const user = userEvent.setup();
    render(<BrowserCasePurposeWorkspace caseId={CASE_ID} />);

    await user.click(
      await screen.findByRole("button", {
        name: "Save Case Purpose Brief",
      }),
    );

    expect(
      screen.getByRole("alert", { name: "Review the Purpose Brief" }),
    ).toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();
    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(restored.registry.cases[0]?.purposeBrief).toBeNull();
  });

  it("loads a truthful empty Documents page and retains Purpose across remounts", async () => {
    storeCase({ withPurpose: true });
    const firstRender = render(
      <BrowserCaseDocumentsWorkspace caseId={CASE_ID} />,
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Documents & Source Health",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Packet (0)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upload PDFs — unavailable/i })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /1Purpose, completed/i }),
    ).toHaveAttribute("href", `/case/${CASE_ID}/purpose`);
    expect(
      screen.getByRole("link", { name: /2Documents, active/i }),
    ).toHaveAttribute("href", `/case/${CASE_ID}/documents`);
    expect(
      screen.queryByText(/M\. Chen|REF-2024-0047-SYN|seven selected demo PDFs/i),
    ).not.toBeInTheDocument();

    firstRender.unmount();
    render(<BrowserCaseDocumentsWorkspace caseId={CASE_ID} />);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Documents & Source Health",
      }),
    ).toBeInTheDocument();
    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(restored.registry.cases[0]?.purposeBrief?.statedPurpose).toBe(
      trustedPurposeBrief().statedPurpose,
    );
    expect(screen.getByText(DISPLAY_REFERENCE)).toBeInTheDocument();
  });

  it("fails safely for an unknown or deleted case ID", async () => {
    render(
      <BrowserCaseDocumentsWorkspace caseId="CFN-CASE-DOES-NOT-EXIST" />,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Case not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No legacy documents or demonstration records/i)).toBeInTheDocument();
    expect(screen.queryByText(/M\. Chen|REF-2024-0047-SYN/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
