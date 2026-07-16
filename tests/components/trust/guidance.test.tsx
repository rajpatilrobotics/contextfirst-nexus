import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import guidancePackJson from "../../../fixtures/guidance/guidance-pack.json";
import { GuidancePackSchema } from "../../../lib/contracts";
import { GuidanceCards } from "../../../features/trust";

describe("TASK-023 guidance separation", () => {
  it("renders the corrected six-card pack with complete metadata and official links", () => {
    const pack = GuidancePackSchema.parse(guidancePackJson);
    const { container } = render(<GuidanceCards pack={pack} />);
    expect(container.querySelectorAll("article, section.cfn-surface").length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText(/Guidance — not case evidence/i)).toBeInTheDocument();
    expect(screen.getByText(`Pack digest: ${pack.identity.digest}`)).toBeInTheDocument();

    expect(screen.getByText("Implementation of the non-punishment principle, A/HRC/47/34")).toBeInTheDocument();
    expect(screen.getByText("A/HRC/47/34, para. 18, p. 3")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open official source", hidden: false })).toHaveLength(6);
    expect(screen.getAllByRole("link", { name: "Open official source", hidden: false })[0]).toHaveAttribute("target", "_blank");
    expect(screen.getAllByText("Local legal verification required")).toHaveLength(6);
    expect(screen.getAllByText(/No endorsement, certification, partnership, or individual legal conclusion is claimed/i)).toHaveLength(6);
  });

  it("keeps international guidance, an indicator, and security guidance visibly typed", () => {
    render(<GuidanceCards pack={GuidancePackSchema.parse(guidancePackJson)} />);
    expect(screen.getAllByText("International guidance", { selector: "span" })).toHaveLength(3);
    expect(screen.getByText("Operational indicator", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Security guidance", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText(/Indicators support further assessment; they are not a model label/i)).toBeInTheDocument();
    expect(screen.getByText(/Guidance does not guarantee prevention/i)).toBeInTheDocument();
  });
});
