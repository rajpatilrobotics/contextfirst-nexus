import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CaseStateProvider } from "../../../components/shell/case-state-context";
import { LovableTrustWorkspace } from "../../../features/trust/lovable-trust-workspace";
import { bundledGuidancePack } from "../../../lib/guidance";
import { harnessResults, systemCard } from "./fixtures";

describe("Lovable Trust & Safety workspace", () => {
  it("presents all seven tabs while retaining provider truth and the canonical local report", async () => {
    const user = userEvent.setup();
    render(
      <CaseStateProvider>
        <LovableTrustWorkspace
          deterministicHarnessResults={harnessResults}
          guidanceCards={bundledGuidancePack.cards}
          systemCard={systemCard()}
        />
      </CaseStateProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "How this workspace is bounded" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(7);
    expect(screen.getByText("Prepared replay")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Evaluation" }));
    expect(screen.getByText("Provider transmissions").nextElementSibling).toHaveTextContent(
      "0",
    );

    await user.click(screen.getByRole("tab", { name: "Report" }));
    expect(screen.getByRole("button", { name: "Record local report" })).toBeEnabled();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Record local report" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      /Local report recorded.*Nothing was transmitted/i,
    );
  });
});
