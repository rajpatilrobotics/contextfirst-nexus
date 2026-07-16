import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvaluationResultSchema, type EvaluationResult } from "../../../lib/contracts";
import { SafetyLab, SafetyLabResult, type SafetyLabResultRecord } from "../../../features/trust";
import {
  definitionDisplays,
  harnessResults,
  replayContinuity,
  reports,
} from "./fixtures";

describe("TASK-023 Safety Lab evidence", () => {
  it("shows every integrated provider record with only genuine Passed and Not run states", () => {
    const measured = [...reports.flatMap((report) => report.evidence), replayContinuity];
    const { container } = render(
      <SafetyLab
        definitions={definitionDisplays}
        deterministicHarnessResults={harnessResults}
        measuredResults={measured}
        reports={reports}
      />,
    );

    const evidenceIds = (reports.flatMap((report) => report.evidence) as SafetyLabResultRecord[])
      .map((result) => result.evidenceId);
    for (const evidenceId of evidenceIds) {
      expect(container.querySelector(`#result-${evidenceId}`)).toBeInTheDocument();
    }
    expect(container.querySelectorAll('[data-evaluation-status="not_run"]')).toHaveLength(81);
    expect(container.querySelectorAll('[data-evaluation-status="passed"]')).toHaveLength(30);
    expect(container.querySelector('[data-evaluation-status="failed"]')).not.toBeInTheDocument();
    expect(screen.getByText(/Production evidence currently contains genuine Passed and Not run records only/i)).toBeInTheDocument();
    expect(screen.getByText("Replay continuity", { selector: "span" })).toBeInTheDocument();
  });

  it("renders exact planned checks for a not-run record without inventing observations", () => {
    const result = (reports[0].evidence as SafetyLabResultRecord[])
      .find((item) => item.status === "not_run" && item.variantId === "EVAL-001");
    if (!result) throw new Error("Missing genuine not-run EVAL-001 evidence");
    const definition = definitionDisplays.find((item) => item.variantId === "EVAL-001");
    render(<SafetyLabResult definition={definition} result={result} />);
    expect(screen.getByText("Golden packet")).toBeInTheDocument();
    expect(screen.getByText(/Preserve uncertainty, source binding, and prohibited-conclusion boundaries/i)).toBeInTheDocument();
    expect(screen.getByText("Not run; no observation was recorded.")).toBeInTheDocument();
    expect(screen.getByText("No run started")).toBeInTheDocument();
    expect(screen.getByText("No", { selector: "dd" })).toBeInTheDocument();
  });

  it("keeps deterministic harness results visibly outside live evidence and admission", () => {
    render(
      <SafetyLab
        definitions={definitionDisplays}
        deterministicHarnessResults={[harnessResults[0]]}
        measuredResults={[replayContinuity]}
        reports={[]}
      />,
    );
    const harness = screen.getByRole("heading", { name: "Deterministic CI harness" }).closest("section");
    if (!harness) throw new Error("Missing harness section");
    expect(within(harness).getByText("Not live model evidence", { selector: "h3" })).toBeInTheDocument();
    expect(within(harness).getAllByText(/cannot support admission/i).length).toBeGreaterThan(0);
    expect(within(harness).getAllByText(/mock harness/i).length).toBeGreaterThan(0);
  });

  it("exercises Failed rendering only with an explicitly test-only simulated fixture", () => {
    const base = harnessResults[0] as SafetyLabResultRecord;
    const simulated = EvaluationResultSchema.parse({
      ...base,
      evidenceId: "EVIDENCE-TEST-ONLY-SIMULATED-FAILED",
      status: "failed",
      checks: [
        {
          name: "Test-only renderer check",
          expected: "The renderer keeps failure visible.",
          observed: "A simulated failure remained visible.",
          passed: false,
        },
      ],
      terminalStatus: "failed",
    }) as EvaluationResult;
    render(
      <SafetyLabResult
        provenanceLabel="Test-only simulated fixture — never production evidence"
        result={simulated}
      />,
    );
    expect(screen.getByText("Test-only simulated fixture — never production evidence")).toBeInTheDocument();
    expect(screen.getByText("Failed", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Check failed", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText(/A simulated failure remained visible/i)).toBeInTheDocument();
  });

  it("contains no aggregate rating or provider recommendation UI", () => {
    const { container } = render(
      <SafetyLab
        definitions={definitionDisplays}
        deterministicHarnessResults={[]}
        measuredResults={[replayContinuity]}
        reports={[]}
      />,
    );
    expect(container.querySelector("meter")).not.toBeInTheDocument();
    expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument();
    expect(screen.queryByText(/accuracy percentage/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/recommended provider/i)).not.toBeInTheDocument();
  });
});
