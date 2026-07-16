import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RunHistory, SystemCardPanel } from "../../../features/trust";
import {
  checkpointReference,
  failedOpenAiRun,
  nonRunAttempts,
  systemCard,
} from "./fixtures";

describe("TASK-023 System Card and provenance", () => {
  it("renders the fixed provider order with truthful non-selectable admission", () => {
    const card = systemCard();
    const { container } = render(<SystemCardPanel card={card} />);
    const providerCards = Array.from(container.querySelectorAll("[data-provider-id]"));
    expect(providerCards.map((item) => item.getAttribute("data-provider-id"))).toEqual([
      "openai",
      "google_gemini",
      "mistral",
      "local_replay",
    ]);

    for (const providerId of ["openai", "google_gemini", "mistral"]) {
      const provider = container.querySelector(`[data-provider-id="${providerId}"]`);
      if (!provider) throw new Error(`Missing ${providerId} provider card`);
      expect(within(provider as HTMLElement).getAllByText("Not evaluated").length).toBeGreaterThan(0);
      expect(within(provider as HTMLElement).getByText("Not selectable", { selector: "span" })).toBeInTheDocument();
      expect(within(provider as HTMLElement).getByText("No report accepted by the static admission record")).toBeInTheDocument();
    }

    const replay = providerCards[3] as HTMLElement;
    expect(within(replay).getAllByText("Not applicable").length).toBeGreaterThan(0);
    expect(within(replay).getByText("Selectable", { selector: "span" })).toBeInTheDocument();
  });

  it("binds exact report identities and digests without promoting admission", () => {
    render(<SystemCardPanel card={systemCard()} />);
    expect(screen.getByText("REPORT-OPENAI-QUALITY-V1-V1")).toBeInTheDocument();
    expect(screen.getByText("4151cc9ff1ee73b5e2fd28157eacd0dc30fb9d3fac56ad2323cbb3da0494a0a2")).toBeInTheDocument();
    expect(screen.getByText("REPORT-GEMINI-QUALITY-V1-V1")).toBeInTheDocument();
    expect(screen.getByText("a334c3abb2d04349345294ee4631cbc907933cc4ac4e97a9ed9fea12efa04213")).toBeInTheDocument();
    expect(screen.getByText("REPORT-MISTRAL-SMALL-FREE-V1-V1")).toBeInTheDocument();
    expect(screen.getByText("fdfe95ffba0d3c85a24bddfd48dae6289288bd2595fd6ff874ef2864155c9be8")).toBeInTheDocument();
    expect(screen.getAllByText(/incomplete report is evidence, not runtime admission/i)).toHaveLength(3);
  });

  it("keeps missing or test-only passed report evidence from dynamically promoting admission", () => {
    const card = systemCard();
    const missingReportCard = {
      ...card,
      evaluationAdmissionReports: card.evaluationAdmissionReports.filter(
        (report) => report.providerId !== "openai",
      ),
    };
    const { container, rerender } = render(<SystemCardPanel card={missingReportCard} />);
    const openAi = container.querySelector('[data-provider-id="openai"]');
    if (!openAi) throw new Error("Missing OpenAI provider card");
    expect(within(openAi as HTMLElement).getByText("Linked evaluation report unavailable")).toBeInTheDocument();
    expect(within(openAi as HTMLElement).getByText("Not selectable", { selector: "span" })).toBeInTheDocument();

    const testOnlyPassedReportCard = {
      ...card,
      evaluationAdmissionReports: card.evaluationAdmissionReports.map((report) =>
        report.providerId === "mistral"
          ? {
              ...report,
              status: "passed" as const,
              gates: report.gates.map((gate) => ({ ...gate, status: "passed" as const })),
            }
          : report,
      ),
    };
    rerender(<SystemCardPanel card={testOnlyPassedReportCard} />);
    const mistral = container.querySelector('[data-provider-id="mistral"]');
    if (!mistral) throw new Error("Missing Mistral provider card");
    const scope = within(mistral as HTMLElement);
    expect(scope.getByText("REPORT-MISTRAL-SMALL-FREE-V1-V1")).toBeInTheDocument();
    expect(scope.getByText("fdfe95ffba0d3c85a24bddfd48dae6289288bd2595fd6ff874ef2864155c9be8")).toBeInTheDocument();
    expect(scope.getByText("Passed", { selector: "span" })).toBeInTheDocument();
    expect(scope.getAllByText("Not evaluated").length).toBeGreaterThan(0);
    expect(scope.getByText("Not selectable", { selector: "span" })).toBeInTheDocument();
    expect(scope.getByText(/Runtime selectability still comes from static admission/i)).toBeInTheDocument();
  });

  it("does not hide Mistral's exact availability and free-tier limits", () => {
    const { container } = render(<SystemCardPanel card={systemCard()} />);
    const mistral = container.querySelector('[data-provider-id="mistral"]');
    if (!mistral) throw new Error("Missing Mistral provider card");
    const scope = within(mistral as HTMLElement);
    expect(scope.getAllByText("mistral-small-2603").length).toBeGreaterThan(0);
    expect(scope.getByText(/deployed-account availability is not verified/i)).toBeInTheDocument();
    expect(scope.getAllByText(/up to 30 days/i).length).toBeGreaterThan(0);
    expect(scope.getByText(/free zero data retention is not available or claimed/i)).toBeInTheDocument();
    expect(scope.getByText(/training opt-out is not claimed/i)).toBeInTheDocument();
  });

  it("separates failed runs, typed non-run attempts, recovery, and checkpoint provenance", () => {
    const card = systemCard();
    const run = failedOpenAiRun();
    const selected = card.providers.find((provider) => provider.providerId === "openai") ?? null;
    const { rerender } = render(
      <RunHistory
        attemptedRuns={[run]}
        checkpoint={null}
        currentRun={run}
        nonRunAttempts={nonRunAttempts}
        selectedRelease={selected}
      />,
    );
    expect(screen.getByText("RUN-OPENAI-FAILED-001")).toBeInTheDocument();
    expect(screen.getByText(/Category: Provider timeout\./)).toBeInTheDocument();
    expect(screen.getByText("RUN-GEMINI-FAILED-000")).toBeInTheDocument();
    expect(screen.getByText("Not transmitted and not started. No run ID was created.")).toBeInTheDocument();
    expect(screen.getByText(/Remote outcome unknown.*no run ID or recovery link was invented/i)).toBeInTheDocument();

    const checkpointRun = {
      ...run,
      id: "RUN-CHECKPOINT-001",
      mode: "deterministic_replay" as const,
      provider: {
        providerId: "local_replay" as const,
        releaseConfigurationId: "prepared-replay-v1" as const,
        requestedModel: "frozen_replay_output" as const,
        serviceTier: "local" as const,
        adapterVersion: "local-replay-registry-v1",
        returnedModel: "frozen_replay_output",
        inferenceSetting: { kind: "not_applicable" as const, value: "not_applicable" as const },
        disclosureVersion: "1.0.0" as const,
        providerTransmission: false as const,
      },
      checkpointProvenance: {
        checkpointId: "DEMO-CHECKPOINT-REVIEW" as const,
        checkpointVersion: "1.0.0" as const,
        replayVersion: "1.0.0" as const,
      },
      status: "succeeded" as const,
      failure: null,
      candidateCount: 14,
      citationCount: 1,
      recovery: {
        recoveryOfRunId: null,
        selectionReason: "explicit_deterministic_replay" as const,
        selectedBy: "practitioner" as const,
        automaticFailover: false as const,
        outputsMerged: false as const,
      },
    };
    const replay = card.providers.find((provider) => provider.providerId === "local_replay") ?? null;
    rerender(
      <RunHistory
        attemptedRuns={[checkpointRun]}
        checkpoint={checkpointReference}
        currentRun={checkpointRun}
        nonRunAttempts={[]}
        selectedRelease={replay}
      />,
    );
    expect(screen.getAllByText("Prepared synthetic review checkpoint").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bundled deterministic replay, not live AI").length).toBeGreaterThan(0);
    expect(screen.getByText("Fixture reviewer")).toBeInTheDocument();
    expect(screen.getAllByText("No provider transmission").length).toBeGreaterThan(0);
  });

  it("renders explicit no-selection, empty-run, and no-checkpoint states", () => {
    render(
      <RunHistory
        attemptedRuns={[]}
        checkpoint={null}
        currentRun={null}
        nonRunAttempts={[]}
        selectedRelease={null}
      />,
    );
    expect(screen.getByText(/No analysis mode is selected/i)).toBeInTheDocument();
    expect(screen.getByText("No attempted run")).toBeInTheDocument();
    expect(screen.getByText("No active prepared checkpoint")).toBeInTheDocument();
  });
});
