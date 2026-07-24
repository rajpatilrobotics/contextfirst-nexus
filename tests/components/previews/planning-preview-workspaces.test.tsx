import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  ServicesPreview,
  UrgentNeedsPreview,
} from "../../../features/previews";

describe("planning preview workspaces", () => {
  it("describes Urgent Needs entries as bundled fictional examples", () => {
    render(<UrgentNeedsPreview />);

    expect(
      screen.getByText(/bundled fictional example needs/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/practitioner-confirmed operational needs/i),
    ).not.toBeInTheDocument();
  });

  it("renders Services as preview-only master-detail with disabled referral creation", async () => {
    const user = userEvent.setup();
    render(<ServicesPreview />);

    expect(
      screen.getByRole("region", { name: "Service preview filters" }),
    ).toBeInTheDocument();
    const providerList = screen.getByRole("navigation", {
      name: "Fictional providers",
    });
    expect(within(providerList).getAllByRole("button")).toHaveLength(4);

    await user.click(
      within(providerList).getByRole("button", {
        name: /Fictional Meridian Trauma Support/i,
      }),
    );

    const detail = screen.getByRole("article", {
      name: "Selected provider: Fictional Meridian Trauma Support",
    });
    expect(within(detail).getByText("Availability unverified")).toBeInTheDocument();
    expect(
      within(detail).getByRole("button", {
        name: "Create referral · unavailable",
      }),
    ).toBeDisabled();
    expect(detail).toHaveTextContent(/No information is transmitted/i);
    expect(detail).toHaveTextContent(/Referral creation is explicitly unavailable/i);
  });
});
