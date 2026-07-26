import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CaseDashboard } from "../../../features/dashboard/case-dashboard";
import {
  BROWSER_CASE_REGISTRY_STORAGE_KEY,
  createBrowserCase,
  createEmptyBrowserCaseRegistry,
  persistBrowserCaseRegistry,
  restoreBrowserCaseRegistry,
} from "../../../lib/cases";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

beforeEach(() => {
  window.localStorage.clear();
  routerPush.mockClear();
});

describe("browser-local Case Dashboard", () => {
  it("shows a polished empty state without any static fixture cases", async () => {
    render(<CaseDashboard />);

    expect(
      await screen.findByRole("heading", { level: 3, name: "No cases yet" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Open cases").nextElementSibling).toHaveTextContent("0");
    expect(screen.getByText("Documents").nextElementSibling).toHaveTextContent("0");
    expect(
      screen.getByText("Analysis complete").nextElementSibling,
    ).toHaveTextContent("0");
    expect(
      screen.getByText(
        /Purpose Brief, browser-local Documents, and Structured Analysis are connected/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/M\. Chen|A\. Okafor|R\. Salazar/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Open workspace/i }),
    ).not.toBeInTheDocument();
  });

  it("validates the compact form, persists a new independent case, and opens Purpose", async () => {
    const user = userEvent.setup();
    render(<CaseDashboard />);
    await screen.findByRole("heading", { level: 3, name: "No cases yet" });

    await user.click(screen.getByRole("button", { name: "New case" }));
    await user.click(screen.getByRole("button", { name: "Create case" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Enter a REF- case reference/i,
    );

    await user.type(screen.getByLabelText("Case reference"), "REF-2026-0001-SYN");
    await user.type(screen.getByLabelText("Person alias"), "J. Example");
    await user.type(
      screen.getByLabelText("Assigned practitioner"),
      "Demo practitioner",
    );
    await user.click(screen.getByRole("button", { name: "Create case" }));

    await waitFor(() =>
      expect(routerPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/case\/CFN-CASE-[A-Z0-9-]+\/purpose$/),
      ),
    );
    const stored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(stored.ok).toBe(true);
    expect(stored.registry.cases).toHaveLength(1);
    expect(stored.registry.cases[0]).toMatchObject({
      displayReference: "REF-2026-0001-SYN",
      personAlias: "J. Example",
      assignedPractitioner: "Demo practitioner",
      purposeBrief: null,
    });
    expect(stored.registry.cases[0]).not.toHaveProperty("documents");
    expect(stored.registry.cases[0]).not.toHaveProperty("analysisRuns");
  });

  it("renders browser-persisted cases as clickable independent workspaces", async () => {
    const created = createBrowserCase(
      createEmptyBrowserCaseRegistry(),
      {
        assignedPractitioner: "Practitioner A",
        displayReference: "REF-2026-0002-SYN",
        personAlias: "K. Example",
      },
      {
        idNonce: "CASE002",
        now: "2026-07-25T00:00:00.000Z",
      },
    );
    if (!created.ok) throw new Error(created.reason);
    persistBrowserCaseRegistry(window.localStorage, created.registry);

    render(<CaseDashboard />);

    const card = await screen.findByRole("link", {
      name: "Open workspace for K. Example (REF-2026-0002-SYN)",
    });
    expect(card).toHaveAttribute("href", "/case/CFN-CASE-CASE002/purpose");
    expect(screen.queryByText(/M\. Chen|A\. Okafor|R\. Salazar/)).not.toBeInTheDocument();
  });
});
