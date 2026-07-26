import { describe, expect, it } from "vitest";
import {
  createBrowserCase,
  createEmptyBrowserCaseRegistry,
  restoreBrowserCaseRegistry,
  saveBrowserCasePurpose,
} from "../../../lib/cases";
import { trustedPurposeBrief } from "../../../lib/analysis/replay";

const NOW = "2026-07-25T00:00:00.000Z";

function addCase(
  registry: ReturnType<typeof createEmptyBrowserCaseRegistry>,
  reference: string,
  nonce: string,
) {
  const result = createBrowserCase(
    registry,
    {
      assignedPractitioner: `Practitioner ${nonce}`,
      displayReference: reference,
      personAlias: `Alias ${nonce}`,
    },
    { idNonce: nonce, now: NOW },
  );
  if (!result.ok) throw new Error(result.reason);
  return result;
}

describe("browser-local case registry", () => {
  it("starts empty and fails closed for tampered or legacy fixture-shaped data", () => {
    expect(restoreBrowserCaseRegistry(null)).toEqual({
      ok: true,
      registry: createEmptyBrowserCaseRegistry(),
    });

    const tampered = restoreBrowserCaseRegistry(
      JSON.stringify({
        schemaVersion: "1.0.0",
        cases: [
          {
            id: "CFN-DEMO-001",
            displayReference: "REF-2024-0047-SYN",
            personAlias: "M. Chen",
          },
        ],
      }),
    );
    expect(tampered.ok).toBe(false);
    expect(tampered.registry.cases).toEqual([]);
  });

  it("creates unique cases and rejects duplicate display references", () => {
    const first = addCase(
      createEmptyBrowserCaseRegistry(),
      "REF-2026-0101-SYN",
      "ALPHA",
    );
    const duplicate = createBrowserCase(
      first.registry,
      {
        assignedPractitioner: "Practitioner B",
        displayReference: "ref-2026-0101-syn",
        personAlias: "Alias B",
      },
      { idNonce: "BETA", now: NOW },
    );
    expect(duplicate).toEqual({
      ok: false,
      reason: "That case reference already exists in this browser.",
    });
  });

  it("restores legacy browser-created cases with an empty document packet", () => {
    const created = addCase(
      createEmptyBrowserCaseRegistry(),
      "REF-2026-0102-SYN",
      "LEGACY",
    );
    const legacy = JSON.parse(JSON.stringify(created.registry)) as {
      cases: Array<Record<string, unknown>>;
    };
    delete legacy.cases[0].documentPacket;

    const restored = restoreBrowserCaseRegistry(JSON.stringify(legacy));

    expect(restored.ok).toBe(true);
    expect(restored.registry.cases[0]?.documentPacket).toBeNull();
  });

  it("saves Purpose only to its matching case and survives serialization", () => {
    const first = addCase(
      createEmptyBrowserCaseRegistry(),
      "REF-2026-0201-SYN",
      "ALPHA",
    );
    const second = addCase(
      first.registry,
      "REF-2026-0202-SYN",
      "BETA",
    );
    const source = trustedPurposeBrief();
    const purpose = {
      ...source,
      id: `PURPOSE-${first.record.id}`,
      caseId: first.record.id,
      revision: 1,
      sourceMaterialClassification: "user_attested_synthetic" as const,
      authority: {
        ...source.authority,
        basis: "user_attested_synthetic_material" as const,
        consentStatus: "not_applicable_synthetic_material" as const,
      },
      createdAt: NOW,
      updatedAt: NOW,
    };
    const saved = saveBrowserCasePurpose(second.registry, first.record.id, purpose);
    if (!saved.ok) throw new Error(saved.reason);

    expect(
      saved.registry.cases.find((record) => record.id === first.record.id)
        ?.purposeBrief?.statedPurpose,
    ).toBe(source.statedPurpose);
    expect(
      saved.registry.cases.find((record) => record.id === second.record.id)
        ?.purposeBrief,
    ).toBeNull();
    expect(saved.record).not.toHaveProperty("documents");
    expect(saved.record).not.toHaveProperty("analysisRuns");

    const restored = restoreBrowserCaseRegistry(JSON.stringify(saved.registry));
    expect(restored.ok).toBe(true);
    expect(
      restored.registry.cases.find((record) => record.id === first.record.id)
        ?.purposeBrief?.revision,
    ).toBe(1);
  });

  it("upgrades the former synthetic-only Purpose contract without losing a browser case", () => {
    const created = addCase(
      createEmptyBrowserCaseRegistry(),
      "REF-2026-0203-SYN",
      "MIGRATION",
    );
    const source = trustedPurposeBrief();
    const saved = saveBrowserCasePurpose(created.registry, created.record.id, {
      ...source,
      id: `PURPOSE-${created.record.id}`,
      caseId: created.record.id,
      sourceMaterialClassification: "user_attested_synthetic",
      authority: {
        ...source.authority,
        basis: "user_attested_synthetic_material",
        consentStatus: "not_applicable_synthetic_material",
      },
    });
    if (!saved.ok) throw new Error(saved.reason);
    const legacy = JSON.parse(JSON.stringify(saved.registry)) as {
      cases: Array<{
        purposeBrief: Record<string, unknown> & {
          authority: Record<string, unknown>;
        };
      }>;
    };
    const purpose = legacy.cases[0].purposeBrief;
    delete purpose.sourceMaterialClassification;
    purpose.syntheticDataAcknowledged =
      purpose.sourceMaterialBoundaryAcknowledged;
    delete purpose.sourceMaterialBoundaryAcknowledged;
    purpose.authority.syntheticOrHarmlessDataAttested =
      purpose.authority.sourceMaterialAttested;
    delete purpose.authority.sourceMaterialAttested;
    purpose.authority.basis = "not_applicable_synthetic_fixture";
    purpose.authority.consentStatus = "not_applicable_synthetic_fixture";

    const restored = restoreBrowserCaseRegistry(JSON.stringify(legacy));

    expect(restored.ok).toBe(true);
    expect(restored.registry.cases[0]?.purposeBrief).toMatchObject({
      sourceMaterialClassification: "user_attested_synthetic",
      sourceMaterialBoundaryAcknowledged: true,
      authority: {
        basis: "user_attested_synthetic_material",
        consentStatus: "not_applicable_synthetic_material",
        sourceMaterialAttested: true,
      },
    });
  });
});
