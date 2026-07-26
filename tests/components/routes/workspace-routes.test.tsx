import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AnalysisPage from "../../../app/case/demo/analysis/page";
import AuditPage from "../../../app/case/demo/audit/page";
import DocumentsPage from "../../../app/case/demo/documents/page";
import ExportPage from "../../../app/case/demo/export/page";
import GapsPage from "../../../app/case/demo/gaps/page";
import InterviewPage from "../../../app/case/demo/interview/page";
import NexusPage from "../../../app/case/demo/nexus/page";
import NotesPage from "../../../app/case/demo/notes/page";
import PurposePage from "../../../app/case/demo/purpose/page";
import ReviewPage from "../../../app/case/demo/review/page";
import ServicesPage from "../../../app/case/demo/services/page";
import TasksPage from "../../../app/case/demo/tasks/page";
import TimelinePage from "../../../app/case/demo/timeline/page";
import UrgentNeedsPage from "../../../app/case/demo/urgent-needs/page";
import {
  CaseStateProvider,
  WORKSPACE_NAVIGATION,
} from "../../../components/shell";
import { checkpointState } from "../review/candidate/review-test-state";

const routeCases = [
  ["/case/demo/purpose", PurposePage, /^Purpose Brief$/i],
  ["/case/demo/documents", DocumentsPage, /Documents & Source Health/i],
  ["/case/demo/analysis", AnalysisPage, /^Structured Analysis$/i],
  ["/case/demo/urgent-needs", UrgentNeedsPage, /^Urgent Needs$/i],
  ["/case/demo/gaps", GapsPage, /^Evidence Gaps$/i],
  ["/case/demo/interview", InterviewPage, /^Interview Planner$/i],
  ["/case/demo/services", ServicesPage, /^Services & Referrals$/i],
  ["/case/demo/tasks", TasksPage, /^Case Tasks$/i],
  ["/case/demo/notes", NotesPage, /^Notes & Journal$/i],
  ["/case/demo/nexus", NexusPage, /^Evidence Integrity Map$/i],
  ["/case/demo/timeline", TimelinePage, /^Timeline$/i],
  ["/case/demo/export", ExportPage, /^Export Gate$/i],
  ["/case/demo/audit", AuditPage, /^Audit Trail$/i],
] as const;

const expectedDestinations = [
  ...routeCases.map(([path]) => path),
  "/trust",
];

describe("workspace destination route smoke", () => {
  it("has one concrete sidebar destination for every requested screen", () => {
    expect(WORKSPACE_NAVIGATION.map((item) => item.href)).toEqual(
      expectedDestinations,
    );
    expect(new Set(WORKSPACE_NAVIGATION.map((item) => item.href)).size).toBe(
      WORKSPACE_NAVIGATION.length,
    );
    expect(WORKSPACE_NAVIGATION.some((item) => item.href.includes("#"))).toBe(false);
  });

  for (const [path, Page, heading] of routeCases) {
    it(`renders ${path}`, () => {
      const view = render(
        <CaseStateProvider initialState={checkpointState()}>
          <Page />
        </CaseStateProvider>,
      );
      expect(screen.getAllByRole("heading", { name: heading }).length).toBeGreaterThan(0);
      view.unmount();
    });
  }

  it("keeps Trust & Safety connected to its separately tested public route", () => {
    expect(
      WORKSPACE_NAVIGATION.find((item) => item.id === "trust"),
    ).toMatchObject({
      href: "/trust",
      label: "Trust & Safety",
    });
  });

  it("keeps the compatibility review route available", () => {
    render(
      <CaseStateProvider initialState={checkpointState()}>
        <ReviewPage />
      </CaseStateProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "Review workspace" }),
    ).toBeInTheDocument();
  });
});
