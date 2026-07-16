import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ProviderEvaluationAdmissionReportSchema,
  ProviderReleaseAdmissionRecordSchema,
  type LiveProviderReleaseConfiguration,
  type ProviderReleaseAdmissionRecord,
} from "../../../../lib/contracts";
import { canonicalDigest } from "../../../../lib/evaluation/canonical";
import {
  REVIEWED_INCOMPLETE_REPORTS,
  expectedEvaluatedConfigurationDigest,
  getAdmissionRecord,
} from "../../../../lib/ai/server/admission";
import {
  buildAnalyzeAvailabilityResponse,
  getRegistryEntry,
  projectProviderOption,
} from "../../../../lib/ai/server/registry";

const REPORT_FILES = {
  "openai-quality-v1": "openai-quality-v1.report.json",
  "gemini-quality-v1": "gemini-quality-v1.report.json",
  "mistral-small-free-v1": "mistral-small-free-v1.report.json",
} as const satisfies Record<
  LiveProviderReleaseConfiguration["releaseConfigurationId"],
  string
>;

type EvidenceStatus = "passed" | "failed" | "not_run";
type EvidenceRecord = {
  executionRequirement?: "live_model_run" | "deterministic_control";
  status: EvidenceStatus;
  executionSource: string;
  actualProviderTransmission: boolean;
  analysisRunId: string | null;
  provider: unknown;
};

function loadReport(releaseConfigurationId: keyof typeof REPORT_FILES) {
  const path = resolve(
    process.cwd(),
    "fixtures/evals/results/admission",
    REPORT_FILES[releaseConfigurationId],
  );
  return ProviderEvaluationAdmissionReportSchema.parse(
    JSON.parse(readFileSync(path, "utf8")),
  );
}

function getLiveEntry(
  releaseConfigurationId: LiveProviderReleaseConfiguration["releaseConfigurationId"],
) {
  const entry = getRegistryEntry(releaseConfigurationId);
  if (!entry || entry.kind !== "live") {
    throw new Error(`Missing live registry entry for ${releaseConfigurationId}.`);
  }
  return entry;
}

function recordWith(
  releaseConfigurationId: LiveProviderReleaseConfiguration["releaseConfigurationId"],
  overrides: Partial<ProviderReleaseAdmissionRecord>,
): ProviderReleaseAdmissionRecord {
  const record = getAdmissionRecord(releaseConfigurationId);
  if (!record) throw new Error(`Missing admission record for ${releaseConfigurationId}.`);
  return ProviderReleaseAdmissionRecordSchema.parse({ ...record, ...overrides });
}

function projectWithAdmission(
  releaseConfigurationId: LiveProviderReleaseConfiguration["releaseConfigurationId"],
  admission: ProviderReleaseAdmissionRecord,
) {
  const entry = getLiveEntry(releaseConfigurationId);
  return projectProviderOption({ ...entry, admission }, { liveAnalysisEnabled: true });
}

describe("TASK-026 static provider admission handoff", () => {
  it("records the exact incomplete report identities and bindings", () => {
    for (const releaseConfigurationId of Object.keys(REPORT_FILES) as Array<
      keyof typeof REPORT_FILES
    >) {
      const report = loadReport(releaseConfigurationId);
      const reviewed = REVIEWED_INCOMPLETE_REPORTS[releaseConfigurationId];
      const reportProjection = Object.fromEntries(
        Object.entries(report).filter(([key]) => key !== "reportDigest"),
      );

      expect(reviewed.report).toEqual({
        schemaVersion: report.schemaVersion,
        id: report.id,
        digest: report.reportDigest,
        generatedAt: report.generatedAt,
        status: report.status,
      });
      expect(report.reportDigest).toBe(canonicalDigest(reportProjection));
      expect(reviewed.binding.release).toEqual({
        providerId: report.providerId,
        releaseConfigurationId: report.releaseConfigurationId,
        requestedModel: report.requestedModel,
        serviceTier: report.serviceTier,
      });
      expect(reviewed.binding.adapterVersion).toBe(report.adapterVersion);
      expect(reviewed.binding.inferenceSetting).toEqual(report.inferenceSetting);
      expect(reviewed.binding.disclosureVersion).toBe(report.disclosureVersion);
      expect(reviewed.binding.fixtureBinding).toEqual({
        dataOrigin: "bundled_synthetic",
        caseId: report.fixtureId,
        fixtureVersion: report.fixtureVersion,
        canonicalFixtureDigest: report.canonicalFixtureDigest,
      });
      expect(reviewed.binding.evaluationDefinitionSetDigest).toBe(
        report.evaluationDefinitionSetDigest,
      );
      expect(reviewed.binding.observedEvaluatedConfigurationDigest).toBe(
        report.evaluatedConfigurationDigest,
      );
      expect(reviewed.binding.promptVersion).toBe(report.promptVersion);
      expect(reviewed.binding.responseSchemaVersion).toBe(report.responseSchemaVersion);
      expect(reviewed.binding.rulesetVersion).toBe(report.rulesetVersion);
      expect(reviewed.binding.requiredLiveRunsPerModelVariant).toBe(
        report.requiredLiveRunsPerModelVariant,
      );
      expect(reviewed.binding.requiredRunsPerControlScenario).toBe(
        report.requiredRunsPerControlScenario,
      );
    }
  });

  it("preserves incomplete live evidence and not-run blocking gates", () => {
    for (const releaseConfigurationId of Object.keys(REPORT_FILES) as Array<
      keyof typeof REPORT_FILES
    >) {
      const report = loadReport(releaseConfigurationId);
      const reviewed = REVIEWED_INCOMPLETE_REPORTS[releaseConfigurationId];
      const evidence = report.evidence as EvidenceRecord[];
      const liveEvidence = evidence.filter(
        (evidence) =>
          "executionRequirement" in evidence &&
          evidence.executionRequirement === "live_model_run",
      );
      const controlEvidence = evidence.filter(
        (evidence) =>
          "executionRequirement" in evidence &&
          evidence.executionRequirement === "deterministic_control",
      );

      expect(report.status).toBe("incomplete");
      expect(liveEvidence).toHaveLength(reviewed.evidence.liveModel.total);
      expect(liveEvidence.every((evidence) => evidence.status === "not_run")).toBe(true);
      expect(
        liveEvidence.every(
          (evidence) =>
            evidence.executionSource === "not_run" &&
            evidence.actualProviderTransmission === false &&
            evidence.analysisRunId === null &&
            evidence.provider === null,
        ),
      ).toBe(true);
      expect(controlEvidence).toHaveLength(reviewed.evidence.deterministicControl.total);
      expect(controlEvidence.every((evidence) => evidence.status === "passed")).toBe(true);
      expect(
        evidence.every((evidence) => evidence.actualProviderTransmission === false),
      ).toBe(true);
      expect(report.gates).toHaveLength(reviewed.evidence.blockingGates.total);
      expect(report.gates.every((gate) => gate.status === "not_run")).toBe(true);
      expect(report.gates.map((gate) => gate.name)).toEqual(
        reviewed.evidence.blockingGates.names,
      );
      expect(reviewed.evidence.liveModel.status).toBe("not_run");
      expect(reviewed.evidence.deterministicControl.status).toBe("passed");
      expect(reviewed.evidence.blockingGates.status).toBe("not_run");
    }
  });

  it("uses the corrected canonical evaluated-configuration digest and stays fail closed", () => {
    for (const releaseConfigurationId of Object.keys(REPORT_FILES) as Array<
      keyof typeof REPORT_FILES
    >) {
      const report = loadReport(releaseConfigurationId);
      const reviewed = REVIEWED_INCOMPLETE_REPORTS[releaseConfigurationId];
      const record = getAdmissionRecord(releaseConfigurationId);

      expect(record).not.toBeNull();
      expect(record?.evaluationStatus).toBe(reviewed.admissionDisposition);
      expect(record?.evaluationReportId).toBeNull();
      expect(record?.evaluationReportDigest).toBeNull();
      expect(record?.recordedAt).toBeNull();
      expect(record?.evaluatedConfiguration.evaluatedConfigurationDigest).toBe(
        reviewed.binding.expectedEvaluatedConfigurationDigest,
      );
      expect(
        expectedEvaluatedConfigurationDigest(
          reviewed.binding.release,
          reviewed.binding.inferenceSetting,
        ),
      ).toBe(reviewed.binding.expectedEvaluatedConfigurationDigest);
      expect(report.evaluatedConfigurationDigest).toBe(
        reviewed.binding.observedEvaluatedConfigurationDigest,
      );
      expect(report.evaluatedConfigurationDigest).not.toBe(
        reviewed.binding.expectedEvaluatedConfigurationDigest,
      );
    }
  });

  it("keeps every live option non-selectable while replay remains available", () => {
    const response = buildAnalyzeAvailabilityResponse({ liveAnalysisEnabled: true });
    const liveOptions = response.options.slice(0, 3);

    expect(liveOptions.map((option) => option.evaluationStatus)).toEqual([
      "not_evaluated",
      "not_evaluated",
      "not_evaluated",
    ]);
    expect(liveOptions.every((option) => option.selectable === false)).toBe(true);
    expect(response.options[3]?.selectable).toBe(true);
    expect(response.options[2]?.deployedAccountReleaseAvailabilityStatus).toBe("not_verified");
  });

  it("rejects report identity on a not-evaluated admission record", () => {
    const record = getAdmissionRecord("openai-quality-v1");
    const report = REVIEWED_INCOMPLETE_REPORTS["openai-quality-v1"];
    if (!record) throw new Error("Missing OpenAI admission record.");
    expect(() =>
      ProviderReleaseAdmissionRecordSchema.parse({
        ...record,
        evaluationReportId: report.report.id,
      }),
    ).toThrow();
  });

  it("covers exact pass, failed-gate, mismatched, and Mistral availability projections", () => {
    const openai = getLiveEntry("openai-quality-v1");
    const exactPassed = recordWith("openai-quality-v1", {
      evaluationStatus: "passed",
      evaluationReportId: "REPORT-OPENAI-QUALITY-V1-ACCEPTED",
      evaluationReportDigest: "a".repeat(64),
      recordedAt: "2026-07-16T00:00:00.000Z",
    });
    const passedOption = projectWithAdmission("openai-quality-v1", exactPassed);
    expect(passedOption.evaluationStatus).toBe("passed");
    expect(passedOption.availabilityStatus).toBe("available");
    expect(passedOption.selectable).toBe(true);

    const failedGate = recordWith("openai-quality-v1", {
      evaluationStatus: "failed",
      evaluationReportId: "REPORT-OPENAI-QUALITY-V1-FAILED",
      evaluationReportDigest: "b".repeat(64),
      recordedAt: "2026-07-16T00:00:00.000Z",
    });
    expect(failedGate.evaluationStatus).toBe("failed");
    const failedOption = projectWithAdmission("openai-quality-v1", failedGate);
    expect(failedOption.availabilityStatus).toBe("evaluation_failed");
    expect(failedOption.selectable).toBe(false);

    const mismatched = recordWith("openai-quality-v1", {
      evaluationStatus: "passed",
      evaluationReportId: "REPORT-OPENAI-QUALITY-V1-MISMATCHED",
      evaluationReportDigest: "c".repeat(64),
      recordedAt: "2026-07-16T00:00:00.000Z",
      evaluatedConfiguration: {
        ...openai.admission.evaluatedConfiguration,
        evaluatedConfigurationDigest: "d".repeat(64),
      },
    });
    const mismatchedOption = projectWithAdmission("openai-quality-v1", mismatched);
    expect(mismatchedOption.evaluationStatus).toBe("not_evaluated");
    expect(mismatchedOption.selectable).toBe(false);

    const mistral = getLiveEntry("mistral-small-free-v1");
    const mistralPassed = recordWith("mistral-small-free-v1", {
      evaluationStatus: "passed",
      evaluationReportId: "REPORT-MISTRAL-SMALL-FREE-V1-ACCEPTED",
      evaluationReportDigest: "e".repeat(64),
      recordedAt: "2026-07-16T00:00:00.000Z",
    });
    expect(projectWithAdmission("mistral-small-free-v1", mistralPassed).selectable).toBe(false);

    const mistralAvailable = recordWith("mistral-small-free-v1", {
      evaluationStatus: "passed",
      evaluationReportId: "REPORT-MISTRAL-SMALL-FREE-V1-AVAILABLE",
      evaluationReportDigest: "f".repeat(64),
      recordedAt: "2026-07-16T00:00:00.000Z",
      deployedAccountReleaseAvailability: {
        status: "available",
        evidenceId: "AVAILABILITY-MISTRAL-001",
        verifiedAt: "2026-07-16T00:00:00.000Z",
      },
    });
    expect(projectWithAdmission("mistral-small-free-v1", mistralAvailable).selectable).toBe(
      true,
    );
    expect(mistral.admission.deployedAccountReleaseAvailability.status).toBe("not_verified");
  });

  it("does not add a runtime report loader, environment promotion, or provider call", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/ai/server/admission.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/fixtures\/evals\/results|node:fs|process\.env|fetch\(|watch(File)?\(|@openai|@google|@mistral/);
  });
});
