import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DocumentPacketTools } from "../../../features/documents/document-packet-tools";

describe("DocumentPacketTools", () => {
  it("keeps packet-level tools compact until the practitioner expands them", async () => {
    const user = userEvent.setup();
    render(
      <DocumentPacketTools
        corpusResult={{
          ok: false,
          reason: "privacy_review_incomplete",
        }}
        manifest={null}
        onDownloadReport={vi.fn()}
        runtimeAvailable
      />,
    );

    const integritySummary = screen
      .getByText("Packet integrity")
      .closest("summary");
    const analysisSummary = screen
      .getByText("Inspect the approved redacted corpus and exact citations")
      .closest("summary");

    expect(integritySummary?.parentElement).not.toHaveAttribute("open");
    expect(analysisSummary?.parentElement).not.toHaveAttribute("open");

    await user.click(integritySummary!);
    expect(integritySummary?.parentElement).toHaveAttribute("open");
    expect(
      screen.getByText(/building browser-local packet fingerprints/i),
    ).toBeInTheDocument();

    await user.click(analysisSummary!);
    expect(analysisSummary?.parentElement).toHaveAttribute("open");
    expect(
      screen.getByText(/pass the final local privacy check/i),
    ).toBeInTheDocument();
  });
});
