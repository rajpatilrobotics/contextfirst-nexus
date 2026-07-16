# TASK-021: Review workspace and hero interaction

## 1. Task metadata

- Task ID: TASK-021
- Stage: interface
- Status: Blocked. The coordinator may mark this task Ready only after every dependency is integrated and the missing canonical D03 and D04 timeline records are reconciled in the fixture outputs.
- Wave: 11
- Risk: high
- Suggested branch: `task/021-review-hero`
- Depends on: TASK-004, TASK-008, TASK-010, TASK-017, TASK-019, TASK-020

## 2. Goal

Compose the complete Review route with the qualified timeline, six-row Charge-Coercion Nexus, three separate review lanes, individually actionable candidates, context gaps, review queue, source access, dependency feedback, audit access, and the exact `CAND-TASK-0402` withdrawal demonstration.

## 3. Why this task exists

The Review workspace is the core product demonstration. It must let a practitioner inspect sources and limitations, make one consequential decision at a time, preserve unknown and conflicting evidence, and see downstream findings reopen when supporting evidence is withdrawn. That visible recalculation is the strongest proof of meaningful human control in the prototype.

## 4. Dependencies and base requirement

- TASK-004 must be integrated and provide the frozen accessible UI primitives, status dimensions, responsive table and card patterns, and interaction foundations.
- TASK-008 must be integrated and provide canonical candidate assembly, timeline and Nexus records, review policy, context gaps, cycle rejection, dependency recalculation, and the exact hero transition.
- TASK-010 must be integrated and provide central review, gap, withdrawal, audit, checkpoint, case-revision, and export-readiness state commands.
- TASK-017 must be integrated and provide the case shell, Review navigation state, header status, synthetic boundary, and responsive layout.
- TASK-019 must be integrated and provide the complete explicit Start analysis flow, terminal run activation, document coverage, and masking-prerequisite UI state consumed by Review.
- TASK-020 must be integrated and provide the qualified timeline, citation controls, source drawer, exact highlighting, and focus restoration.
- Upstream fixture reconciliation must add the missing canonical D03 and D04 timeline records before TASK-021 can start. TASK-021 must consume those integrated records and must not fabricate or patch them inside the review feature.
- TASK-010 provides canonical review state and commands. TASK-004 provides the generic accessible disclosure surfaces used by this workspace. Audit History and unsafe-output reporting remain independent in TASK-023.
- Create the worktree from the latest coordinator branch containing all six integrated dependencies and their passing verification. Do not duplicate any dependency behavior inside the route or feature components.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-021.md` in full.
3. `PLANS.md` in full.
4. The TASK-021 entry in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `decision-log.md` in full.
7. `PROJECT_BRIEF.md`: The problem, The proposed solution, Core user job, Hero artifact, End-to-end prototype flow, Information labels, Product principles, Strongest demo moment, and Success criteria.
8. `docs/PRODUCT_SPEC.md`: Sections 4 through 6, 7.6 through 7.12, 9, 10, and 11.
9. `docs/CONTRACTS.md`: Sections 2 through 4, 9 through 15, 18, 22, 24, 25, and 26.
10. `docs/ARCHITECTURE.md`: Sections 6, 7, 8.5, 8.6, 11 through 13, and 16.
11. `docs/DESIGN_SYSTEM.md`: Sections 5 through 8, 9.6 through 9.13, 10, 11, 12, and 13.
12. `docs/SAFETY_AND_DATA.md` in full.
13. `docs/DEMO_AND_FIXTURES.md`: Sections 3 through 11, 13, 16, and 17.
14. `docs/TESTING_AND_EVALUATION.md`: Sections 7.3, 8.4, 8.5, 9, 10, 13, 14.2, 21, and 22.
15. `docs/SOURCE_REGISTER.md`: Sections 4 through 7 and 9.
16. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4, 6, 7, 9, 12, 13, and 16.
17. The current contents of every path in the Exclusive write scope.

## 6. Exclusive write scope

- `app/case/demo/review/page.tsx`
- `features/review/candidate/`
- `features/review/nexus/`
- `features/review/lanes/`
- `features/review/queue/`
- `features/review/dependency/`
- `features/review/context-gaps/`
- `tests/components/review/candidate/`
- `tests/components/review/nexus/`
- `tests/components/review/lanes/`
- `tests/components/review/queue/`
- `tests/components/review/dependency/`
- `tests/components/review/context-gaps/`

No other path may be created, edited, renamed, moved, or deleted.

## 7. Read-only context allowed

- `components/ui/`
- `components/status/`
- `components/shell/`
- `lib/contracts/`
- `lib/review/`
- `lib/state/`
- `lib/citations/`
- `lib/documents/`
- `lib/fixtures/`
- `lib/analysis/replay.ts`
- `fixtures/cases/`
- `fixtures/replay/`
- `features/review/timeline/`
- `features/review/source/`
- `features/trust/`
- `app/case/demo/export/`
- `package.json` and shared test configuration, only to understand installed interfaces and commands

All domain engines, state, fixtures, timeline and source components, trust components, export route, and shared files are read-only.

## 8. Out of scope

- Editing review policy, dependency traversal, reducer transitions, citation logic, source processing, replay fixture, checkpoint data, audit storage, export gate, shared contracts, or fixture IDs.
- Implementing the Export route, PDF or JSON rendering, minimum-necessary selection, provider selection or recovery, Trust page, or system-card evaluation logic.
- Adding bulk approval, automatic acceptance, an overall score, a confidence meter, a victim or trafficking determination, credibility or guilt assessment, legal eligibility, non-punishment outcome, priority, dangerousness, or legal advice.
- Collapsing the three review lanes, upgrading reported evidence to documented fact, treating an exact quote as truth, filling a missing page, authenticating D02 or D05, or making cooperation affect analysis.
- Adding automatic referral, reporting, filing, email, external contact, upload, real data, or child-case handling.
- Changing global styles, shell layout, UI primitives, dependencies, test configuration, environment variables, deployment files, or cloud settings.

## 9. Frozen contracts and invariants

- Evidence nature belongs to each source dependency. Item origin, support status, and review status remain separate and visible on every consequential candidate. Human review never changes provenance or evidence nature.
- All review surfaces consume read-only selectors over the one canonical `CaseState.candidates: CaseCandidate[]` collection. Timeline, Nexus, context-gap, lane, queue, and blocker components never keep mutable or persisted candidate mirrors.
- Every active consequential candidate with `reviewRequirement: individual` begins Pending and requires its own action. There is no bulk approve control, reducer command, API, or keyboard shortcut.
- Candidate components submit only `ReviewIntent` with `candidateId`, one allowed non-withdraw action, and the applicable `editedText` or `reason`. They never construct `ReviewDecision` or supply actor, statuses, revision, supersession, dependency snapshot, ruleset, prompt version, or timestamp.
- Withdrawal uses only the separate `withdraw_candidate` command with candidate ID and reason. The UI never sends `withdraw` through `ReviewIntent` or `review_candidate`.
- Exact action labels are `Accept suggestion`, `Edit wording`, `Reject suggestion`, `Mark uncertain`, `Confirm as unknown`, and `Record as limitation`. Only actions valid for the candidate's assertion mode and support are enabled.
- Edit, reject, mark uncertain, record as limitation, and withdraw require a concise reason. Edit preserves original wording. Later decisions supersede prior review records while the same active successful run remains current, and audit records are preserved. TASK-010 run replacement clears the current decision ledger but preserves safe audit and historical export records.
- A positive item with Insufficient evidence cannot be accepted. An explicit limitation or gap may be accepted only through Record as limitation. An unknown-state item may be accepted only through Confirm as unknown.
- Context gaps offer Answer, Defer, Preserve as unknown, and Outside current scope. An answer is reviewer-supplied context unless a new source is added. Unanswered, deferred, outside-scope, and preserved-unknown states remain visible and never become adverse evidence.
- The Nexus has exactly six stable rows: `NEXUS-RECRUITMENT`, `NEXUS-MOVEMENT`, `NEXUS-CONTROL`, `NEXUS-COMPELLED-TASKS`, `NEXUS-OFFENCE-TIMING`, and `NEXUS-URGENCY`.
- `NEXUS-CONTROL` and `NEXUS-URGENCY` are derived summaries and do not add duplicate approval. `NEXUS-COMPELLED-TASKS` and `NEXUS-OFFENCE-TIMING` require individual review. Recruitment and movement follow the fixture manifest and cannot duplicate a reviewed child action.
- Desktop Nexus uses a semantic table with caption, column headers, and row headers. Small screens use equivalent labelled row cards. Graphics, if any, are supplementary; no graph library or score is used.
- The three lanes are separate labelled regions: Trafficking indicators for review; Non-punishment relevance for review; Protection, remedy, and procedural urgency. Shared evidence never merges candidates or approval actions.
- Lane A says indicators prompt further qualified assessment and do not determine status. Lane B requires domestic legal verification and is not an eligibility decision. Lane C presents questions for qualified action and never contacts a recipient automatically.
- The review queue can filter pending, accepted, edited, rejected, uncertain, conflict, citation problem, and export blocker states while preserving one canonical candidate record.
- The golden stable candidate behavior is normative: `CAND-TL-ARRIVAL` accepts as documented; `CAND-CTRL-PASSPORT` is edited to preserve reported and documented sources; `CAND-CTRL-CONFINEMENT` is rejected; `CAND-PROV-TASKLOG` is uncertain; `CAND-SENDER-0402` is rejected; `CAND-URG-INTERPRETER` and `CAND-META-COOPERATION` are confirmed as unknown; `CAND-TASK-0402` is accepted and later withdrawn.
- The exact edited passport wording is: `Maya reported passport removal; recruiter messages separately refer to passport custody.`
- The early unresolved items exposed for export remediation are exactly `CAND-SENDER-0402` and `CAND-URG-INTERPRETER`.
- The hero interaction uses only `CAND-TASK-0402`. Before withdrawal it is Human accepted, and both `NEXUS-COMPELLED-TASKS` and `NEXUS-OFFENCE-TIMING` are individually Human accepted.
- Withdrawal marks `CAND-TASK-0402` Invalidated and excluded, marks both reachable Nexus rows Invalidated, changes offence timing to Insufficient evidence, immediately revokes export readiness, and preserves every unrelated decision.
- Renewed review accepts `NEXUS-COMPELLED-TASKS` only with changed support visible and records `NEXUS-OFFENCE-TIMING` only through explicit insufficient-evidence limitation text, resulting in human-edited status, never a positive link.
- The dependency panel lists affected IDs before confirmation, requires a reason, persists a before-and-after explanation after the action, moves focus to the summary, and announces invalidated items. A toast cannot be the only record.
- `DEMO-CHECKPOINT-REVIEW` version `1.0.0` remains visibly labelled `Prepared synthetic review checkpoint` and `Bundled deterministic replay, not live AI`. Seeded decisions are attributed to Fixture reviewer, not the current practitioner.
- Source access uses TASK-020 and preserves exact citation, focus, filters, and masked defaults. Review UI cannot resolve citations or reveal content by mutating state directly.
- Audit History and unsafe-output reporting are not rendered or tested by this task. TASK-023 owns those independent Trust surfaces. The review workspace may expose only the shared navigation destination from TASK-017.
- Guidance may frame a review question but cannot become case evidence, domestic law, or an individual legal conclusion. Cooperation status does not alter evidence, Nexus, or protection output.

## 10. Implementation steps

1. Inspect Git status, owned files, TASK-008 review interfaces, TASK-010 commands and selectors, TASK-020 timeline and source APIs, TASK-017 navigation destination, and all golden fixture records. Confirm the reconciled canonical D03 and D04 timeline records are present; stop if either is missing or if any stable ID or transition differs.
2. Compose `/case/demo/review` from dependency components and focused feature regions using only canonical read-only candidate selectors. Keep domain policy in `lib/review` and central mutations in TASK-010, not in the page, component callbacks, or local mirrored arrays.
3. Implement `CandidateReviewCard`, `ContextGapPanel`, the six-row Nexus, three separate lane regions, and Review Queue with exact labels, valid actions, reasons, source access, statuses, limitations, unknowns, coverage warnings, and stable remediation targets. Candidate controls emit only narrow `ReviewIntent`; withdrawal dispatches only `withdraw_candidate`.
4. Implement the withdrawal confirmation and persistent `DependencyChangePanel` from canonical preview and result records, including affected IDs, focus movement, announcements, and before-and-after explanation.
5. Integrate prepared-checkpoint provenance, shared Trust navigation, and source drawer invocation without copying their logic into owned paths.
6. Add focused tests for every candidate action and restriction, narrow `ReviewIntent` payloads, absence of client-authored `ReviewDecision` fields, rejection of review-intent withdrawal, the sole `withdraw_candidate` path, `CaseCandidate` branch rendering, selector consistency without mirrored arrays, context-gap states, lane separation, semantic Nexus representations, queue filters, exact early blockers, checkpoint attribution, source invocation, dependency preview, full hero transition, preserved unrelated decisions, renewed review, focus, and announcements.
7. Run every verification command, complete the manual checks, and inspect the final diff for unowned paths, duplicated policy, bulk actions, score or conclusion language, source leakage, run merging, unsupported claims, secrets, and debug output.

## 11. Acceptance criteria

- `/case/demo/review` presents the timeline, source access, Charge-Coercion Nexus, three review lanes, candidate review, context gaps, review queue, dependency feedback, and shared Trust navigation as distinct accessible regions.
- Every candidate-facing region derives from one canonical `CaseCandidate[]`; one review or dependency transition appears consistently in timeline, Nexus, context-gap, lane, queue, and blocker views without local or persisted candidate copies.
- Every candidate shows proposed wording, origin, support and review status, supporting, limiting and contrary dependencies, unknowns, coverage warnings, source links, and exactly one valid individual review group where required.
- Invalid actions are unavailable: there is no bulk approve, insufficient positive claims cannot be accepted, unknown is not treated as false, and derived Nexus summaries create no duplicate review action.
- Review controls submit only candidate ID, an allowed non-withdraw action, and applicable edited text or reason. No component constructs an immutable decision field, and withdrawal is possible only through `withdraw_candidate`.
- The six exact Nexus IDs appear once, contain the fixture dependency and limitation information, and have a complete semantic desktop table and equivalent mobile cards without any overall score or legal conclusion.
- The three exact review lanes remain separate, show their required non-decision boundaries, and do not merge shared evidence or approval state.
- Queue filters expose each frozen review and blocker category and move focus to stable candidate, citation, gap, or dependency targets without losing queue context.
- `DEMO-CHECKPOINT-REVIEW` shows replay and fixture-reviewer provenance. Its seeded decisions are not attributed to the current practitioner.
- Editing `CAND-CTRL-PASSPORT`, rejecting `CAND-CTRL-CONFINEMENT` and `CAND-SENDER-0402`, confirming `CAND-URG-INTERPRETER` and `CAND-META-COOPERATION` as unknown, and marking `CAND-PROV-TASKLOG` uncertain produce the canonical statuses and audit events.
- With all initial required reviews complete, withdrawing `CAND-TASK-0402` previews and then invalidates exactly the candidate, `NEXUS-COMPELLED-TASKS`, and `NEXUS-OFFENCE-TIMING`; unrelated reviewed decisions remain unchanged and export readiness becomes blocked.
- The post-withdrawal panel remains in the workspace, explains the change, receives focus, announces invalidated items, and provides renewed individual review for both affected Nexus rows.
- Renewed review records compelled tasks with changed support and offence timing only as an Insufficient evidence limitation. No current positive finding links the 2025-04-02 alleged communication to the assigned task.
- All source text is inert and masked by default, exact citations open through TASK-020, and the workspace links to the separate Trust destination without duplicating its audit or unsafe-output behavior.
- Component and route behavior covers loading, empty, warning, blocked, invalidated, error, unknown, insufficient-evidence, and success states without blank success.
- Keyboard, focus, live announcements, 200 percent zoom, 320 CSS pixel reflow, and reduced-motion behavior remain operable.

## 12. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/components/review/candidate tests/components/review/nexus tests/components/review/lanes tests/components/review/queue tests/components/review/dependency tests/components/review/context-gaps
npm run build
```

## 13. Manual checks

1. Open `/case/demo/review` with `DEMO-CHECKPOINT-REVIEW`. Confirm both prepared-checkpoint and replay labels are visible, seeded decisions say Fixture reviewer, and the six Nexus rows and three separate lanes appear without a score.
2. Open the exact source for `CAND-TASK-0402` at `D05-P1-S05`, close it, and confirm focus and queue or timeline context return unchanged. Verify source location is not described as truth or authenticity.
3. Edit `CAND-CTRL-PASSPORT` to the exact frozen wording, reject `CAND-CTRL-CONFINEMENT`, mark `CAND-PROV-TASKLOG` uncertain, reject `CAND-SENDER-0402`, and confirm `CAND-URG-INTERPRETER` and `CAND-META-COOPERATION` as unknown. Confirm each valid action and required reason behavior.
4. Inspect the queue filters and all derived regions after those actions. Confirm each candidate appears only under its canonical current state, no view retains an earlier mirrored status, the two early blocker IDs resolve to stable targets, and no cooperation value changes any evidence or lane result.
5. Select Withdraw on accepted `CAND-TASK-0402`. Before confirming, confirm the panel lists `NEXUS-COMPELLED-TASKS` and `NEXUS-OFFENCE-TIMING`, requires a reason, and lists no unrelated item.
6. Confirm withdrawal. Verify the three exact items become Invalidated as specified, offence timing becomes Insufficient evidence, unrelated decisions remain unchanged, export readiness is blocked, focus moves to a persistent change summary, and an announcement names affected items.
7. Renew review of `NEXUS-COMPELLED-TASKS`, then record `NEXUS-OFFENCE-TIMING` as a limitation. Confirm the latter cannot use normal positive acceptance and the workspace contains no positive 2025-04-02 assignment link.
8. Confirm shared Trust navigation is available without duplicating Trust content in this route.
9. Complete the review flow by keyboard at desktop and below 768 pixels, then inspect at 320 CSS pixels, 200 percent zoom, and reduced motion. Confirm the Nexus remains understandable, focus is never obscured, and no essential action requires horizontal scrolling or color alone.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add review workspace and hero interaction`

## 15. Handoff requirements

Return a self-contained handoff containing:

- `Task: TASK-021, Review workspace and hero interaction` and outcome `Complete`, `Partial`, or `Blocked`.
- Every changed path, listed exactly.
- The composed review behavior and exact hero interaction now observable.
- Confirmation that individual review, no bulk approval, separate evidence dimensions, exact citations, three separate lanes, no score or legal decision, reachable-only invalidation, preserved unrelated decisions, no run merging, and safe audit invariants were preserved.
- Each acceptance criterion with its result.
- Each required command and manual check with `PASS`, `FAIL`, or `NOT RUN` and a reason for any unrun check.
- The before and after statuses for `CAND-TASK-0402`, `NEXUS-COMPELLED-TASKS`, `NEXUS-OFFENCE-TIMING`, export readiness, and at least one preserved unrelated decision.
- Any review-engine, state, source, trust, fixture, focus, or accessibility blocker requiring coordinator action.
- The commit hash only if commit permission was present and used; otherwise `Not committed`.

## 16. Stop conditions

Stop and notify the coordinator if:

- Any dependency is not integrated, a required canonical component or command is absent, or the base fails existing verification.
- The canonical D03 or D04 timeline record is missing from the integrated fixture outputs; fixture reconciliation belongs upstream and must not be implemented in TASK-021.
- The task graph and this packet disagree about title, dependencies, owned paths, or verification commands.
- Completing the route requires editing the review engine, reducer, fixture, replay, citation or source service, trust feature, export route, contract, shell, UI primitive, package file, test configuration, or another unowned path.
- Any stable candidate ID, Nexus ID, fixture dependency, checkpoint attribution, early blocker, action rule, or hero transition differs from the authoritative documents or integrated domain engine.
- A new dependency, shared type, route, fixture, provider behavior, environment variable, export rule, or deployment setting appears necessary.
- The implementation would add bulk approval, automatic review, a score, a prohibited conclusion, a provider-switch bypass, cross-run output merging, hidden missingness, or adverse cooperation inference.
- Any real or private data, raw unmasked source text outside intentional view, credential, private URL, raw provider diagnostic, or unsupported claim appears.
- Verification reveals an upstream review, state, timeline, source, trust, fixture, or shared-UI defect. Report the smallest safe reproduction and do not patch the dependency from this task.
