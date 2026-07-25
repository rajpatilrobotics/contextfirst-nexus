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
});
