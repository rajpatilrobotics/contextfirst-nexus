import type { SourceMaterialClassification } from "../contracts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function authorityFor(classification: SourceMaterialClassification) {
  if (classification === "bundled_synthetic_fixture") {
    return {
      basis: "not_applicable_synthetic_fixture",
      consentStatus: "not_applicable_synthetic_fixture",
    } as const;
  }
  if (classification === "user_attested_authorized_public") {
    return {
      basis: "user_attested_authorized_public_material",
      consentStatus: "not_applicable_authorized_public_material",
    } as const;
  }
  return {
    basis: "user_attested_synthetic_material",
    consentStatus: "not_applicable_synthetic_material",
  } as const;
}

export function migrateLegacyPurposeBrief(
  value: unknown,
  classification: SourceMaterialClassification,
): { migrated: boolean; value: unknown } {
  if (!isRecord(value) || "sourceMaterialClassification" in value) {
    return { migrated: false, value };
  }
  const authority = isRecord(value.authority) ? value.authority : {};
  const {
    syntheticOrHarmlessDataAttested: legacySourceAttestation,
    ...authorityWithoutLegacy
  } = authority;
  const {
    syntheticDataAcknowledged: legacyBoundaryAcknowledgement,
    ...purposeWithoutLegacy
  } = value;
  const expected = authorityFor(classification);
  return {
    migrated: true,
    value: {
      ...purposeWithoutLegacy,
      sourceMaterialClassification: classification,
      authority: {
        ...authorityWithoutLegacy,
        basis: expected.basis,
        consentStatus: expected.consentStatus,
        sourceMaterialAttested: legacySourceAttestation === true,
      },
      sourceMaterialBoundaryAcknowledged:
        legacyBoundaryAcknowledgement === true,
    },
  };
}

export function migrateLegacyCaseStateSourceMaterial(
  value: unknown,
  classification: SourceMaterialClassification,
): unknown {
  if (!isRecord(value)) return value;
  const purpose = migrateLegacyPurposeBrief(value.purposeBrief, classification);
  if (!purpose.migrated) return value;
  return {
    ...value,
    purposeBrief: purpose.value,
    exportGate: null,
    currentExportId: null,
    currentExportManifest: null,
    exportedRevision: null,
  };
}
