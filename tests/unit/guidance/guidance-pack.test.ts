import { describe, expect, it } from "vitest";
import { GuidancePackSchema } from "../../../lib/contracts";
import { bundledGuidancePack, getGuidanceCardBySourceRegisterId } from "../../../lib/guidance";

describe("bundled guidance pack", () => {
  it("contains the exact six reviewed source-register cards", () => {
    expect(() => GuidancePackSchema.parse(bundledGuidancePack)).not.toThrow();
    expect(bundledGuidancePack.identity.version).toBe("1.0.0");
    expect(bundledGuidancePack.identity.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(bundledGuidancePack.cards.map((card) => card.sourceRegisterId)).toEqual([
      "INT-002",
      "INT-004",
      "HR-002",
      "IND-001",
      "FC-002",
      "SEC-001",
    ]);
  });

  it("keeps guidance separate from case evidence and domestic-law conclusions", () => {
    for (const card of bundledGuidancePack.cards) {
      expect(card.localLegalVerificationRequired).toBe(true);
      expect(card.allowedUse).toMatch(/practitioner review questions/i);
      expect(card.allowedUse).toMatch(/never proves a case fact/i);
      expect(card.limitation).toMatch(/does not establish domestic law/i);
      expect(card.limitation).not.toMatch(/Maya K\.|confirmed victim|establishes guilt/i);
    }
    expect(getGuidanceCardBySourceRegisterId("SEC-001")?.materialType).toBe("security_guidance");
  });
});
