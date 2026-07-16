import { describe, expect, it } from "vitest";
import { GuidancePackSchema } from "../../../lib/contracts";
import { bundledGuidancePack, computeGuidancePackDigest, getGuidanceCardBySourceRegisterId } from "../../../lib/guidance";

const expectedCards = [
  {
    sourceRegisterId: "INT-002",
    issuer: "United Nations Human Rights, Special Rapporteur on trafficking in persons",
    title: "Implementation of the non-punishment principle, A/HRC/47/34",
    publicationOrVersionDate: "17 May 2021",
    sourceVersion: "A/HRC/47/34",
    sourceUrl: "https://ap.ohchr.org/documents/alldocs.aspx?doc_id=47240",
    lastVerified: "2026-07-15",
    allowedUse: "Human-rights framing for non-punishment review, the relationship between exploitation and unlawful acts, and cooperation-invariance safeguards",
    limitation: "It is not universal domestic law and cannot establish individual eligibility",
  },
  {
    sourceRegisterId: "INT-004",
    issuer: "United Nations Office on Drugs and Crime",
    title: "Principle of non-criminalization of victims",
    publicationOrVersionDate: "Current Education for Justice module",
    sourceVersion: "Current Education for Justice module",
    sourceUrl: "https://www.unodc.org/e4j/en/tip-and-som/module-8/key-issues/principle-of-non-criminalization-of-victims.html",
    lastVerified: "2026-07-15",
    allowedUse: "Design prompts for practitioner review and reinforce that a person should not be reduced to alleged offending",
    limitation: "Does not determine non-punishment under a specific jurisdiction",
  },
  {
    sourceRegisterId: "HR-002",
    issuer: "United Nations Human Rights",
    title: "A Human Rights-Based Approach to Data",
    publicationOrVersionDate: "Published guidance note",
    sourceVersion: "Published guidance note",
    sourceUrl: "https://www.ohchr.org/sites/default/files/Documents/Issues/HRIndicators/GuidanceNoteonApproachtoData.pdf",
    lastVerified: "2026-07-15",
    allowedUse: "Data minimization, participation, privacy, transparency, accountability, and do-no-harm framing",
    limitation: "Principles do not by themselves prove legal compliance or technical security",
  },
  {
    sourceRegisterId: "IND-001",
    issuer: "International Labour Organization",
    title: "ILO Indicators of Forced Labour",
    publicationOrVersionDate: "Revised 2025",
    sourceVersion: "Revised 2025",
    sourceUrl: "https://www.ilo.org/publications/ilo-indicators-forced-labour-1",
    lastVerified: "2026-07-15",
    allowedUse: "Build transparent review categories for possible control, coercion, dependency, and forced labour",
    limitation: "Indicators support further assessment; they are not a model label, score, automatic determination, or substitute for legal review",
  },
  {
    sourceRegisterId: "FC-002",
    issuer: "Organization for Security and Co-operation in Europe",
    title: "Model Standard Operating Procedures for Identification and Protection of Victims of Trafficking for the Purpose of Forced Criminality",
    publicationOrVersionDate: "2026",
    sourceVersion: "2026",
    sourceUrl: "https://cthb.osce.org/cthb/663244",
    lastVerified: "2026-07-15",
    allowedUse: "Known, unknown, conflicting, and overlooked-information workflow; identification and protection safeguards; practitioner review concepts",
    limitation: "Model procedures require local adaptation and do not establish that a person is a victim",
  },
  {
    sourceRegisterId: "SEC-001",
    issuer: "OWASP Foundation",
    title: "LLM01 Prompt Injection",
    publicationOrVersionDate: "Current OWASP GenAI security guidance",
    sourceVersion: "Current OWASP GenAI security guidance",
    sourceUrl: "https://genai.owasp.org/llmrisk/llm01-prompt-injection/",
    lastVerified: "2026-07-15",
    allowedUse: "Untrusted-document boundary, indirect prompt-injection tests, input and output handling, and least-capability design",
    limitation: "Guidance does not guarantee prevention; version and recommendations must be rechecked before public release",
  },
];

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

  it("matches registered official metadata and contains no placeholder source text", () => {
    expect(bundledGuidancePack.cards).toHaveLength(6);
    for (const [index, expected] of expectedCards.entries()) {
      const card = bundledGuidancePack.cards[index];
      expect(card).toMatchObject(expected);
      expect(card.sourceUrl).not.toContain("example.org");
      expect(card.exactReviewedPassage).not.toMatch(/Reviewed public guidance passage|placeholder/i);
      expect(card.exactReviewedPassage.length).toBeGreaterThan(10);
      expect(card.locator.length).toBeGreaterThan(10);
      expect(card.localLegalVerificationRequired).toBe(true);
    }
  });

  it("keeps guidance separate from case evidence and domestic-law conclusions", () => {
    for (const card of bundledGuidancePack.cards) {
      expect(card.localLegalVerificationRequired).toBe(true);
      expect(`${card.allowedUse} ${card.limitation}`).toMatch(/review|safeguards|framing|indicators|security|boundary/i);
      expect(card.limitation).toMatch(/not|do not|does not/i);
      expect(card.limitation).not.toMatch(/Maya K\.|confirmed victim|establishes guilt/i);
    }
    expect(getGuidanceCardBySourceRegisterId("SEC-001")?.materialType).toBe("security_guidance");
  });

  it("recomputes a stable deterministic digest that changes when bound fields change", async () => {
    await expect(computeGuidancePackDigest(bundledGuidancePack.cards)).resolves.toBe(
      bundledGuidancePack.identity.digest,
    );
    await expect(computeGuidancePackDigest([...bundledGuidancePack.cards].reverse())).resolves.toBe(
      bundledGuidancePack.identity.digest,
    );
    const changed = bundledGuidancePack.cards.map((card) =>
      card.sourceRegisterId === "SEC-001"
        ? { ...card, locator: `${card.locator} changed` }
        : card,
    );
    await expect(computeGuidancePackDigest(changed)).resolves.not.toBe(
      bundledGuidancePack.identity.digest,
    );
  });
});
