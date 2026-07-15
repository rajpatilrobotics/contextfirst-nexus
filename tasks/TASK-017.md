# TASK-017: Global shell and landing experience

## 1. Task metadata

- Task ID: TASK-017
- Stage: interface
- Status: Pending. Only the coordinator may mark this task Ready after every dependency is integrated.
- Wave: 8
- Risk: medium
- Suggested branch: `task/017-global-shell`
- Depends on: TASK-004, TASK-010

## 2. Goal

Implement the global metadata, landing boundary screen, persistent synthetic-case banner, responsive case workspace shell, step navigation, derived case status, selected run identity, and Reset Case entry point for the one permitted synthetic demo.

## 3. Why this task exists

A first-time user must understand the product boundary before entering the case, and every later case route needs one consistent shell that keeps synthetic-data, location, case status, provider or replay provenance, and reset controls visible. This task establishes that shared experience without implementing any feature route.

## 4. Dependencies and base requirement

- TASK-004 must be integrated and provide the frozen UI primitives, status presentation, tokens, and responsive foundations.
- TASK-010 must be integrated and provide the canonical case-state provider, derived `CaseStatus`, active-run provenance, session behavior, and central `reset_case` command.
- Create the worktree from the latest coordinator branch that contains both dependencies and their passing verification. A completed but unintegrated worktree does not satisfy a dependency.
- Confirm the packet is still Pending or has been marked Ready by the coordinator. Do not implement from an older base or recreate dependency behavior locally.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-017.md` in full.
3. `PLANS.md` in full.
4. The TASK-017 entry in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `decision-log.md` in full.
7. `PROJECT_BRIEF.md`: One-sentence description, Primary user, Affected stakeholder, End-to-end prototype flow, Prototype scope, Product principles, Strongest demo moment, and Success criteria.
8. `docs/PRODUCT_SPEC.md`: Sections 3.4, 5, 6, 7.1, 7.2, 8, 9, and 10.
9. `docs/CONTRACTS.md`: Sections 4.7, 4.8, 24, 25, and 26.
10. `docs/ARCHITECTURE.md`: Sections 3 through 7, 11, and 16.
11. `docs/DESIGN_SYSTEM.md`: Sections 2 through 8, 9.1, 10, 11, 12, and 13.
12. `docs/SAFETY_AND_DATA.md`: Sections 2 through 5, 8.1, 11 through 13, 18, and 19.
13. `docs/DEMO_AND_FIXTURES.md`: Sections 3, 4, 13, and 17.
14. `docs/TESTING_AND_EVALUATION.md`: Sections 9, 13, 21, and 22.
15. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4, 6, 9, 12, 13, and 16.
16. The current contents of every path in the Exclusive write scope.

## 6. Exclusive write scope

- `app/layout.tsx`
- `app/page.tsx`
- `app/case/demo/layout.tsx`
- `components/shell/`
- `tests/components/shell/`

No other path may be created, edited, renamed, moved, or deleted.

## 7. Read-only context allowed

- `app/globals.css`
- `components/ui/`
- `components/status/`
- `lib/presentation/`
- `lib/contracts/`
- `lib/state/`
- `fixtures/cases/`
- `lib/fixtures/`
- `app/case/demo/`
- `app/trust/`
- `package.json` and shared test configuration, only to understand existing commands and conventions

These paths are read-only even when a convenient fix appears obvious.

## 8. Out of scope

- Implementing Purpose, Documents, Review, Export, Trust, provider-selection, or provider-recovery feature logic.
- Creating a placeholder child route solely to preview the case layout.
- Changing shared contracts, reducer behavior, session cleanup, fixture data, design tokens, global styles, UI primitives, package dependencies, test configuration, or deployment configuration.
- Adding arbitrary upload, real-data input, authentication, a database, analytics, external transmission, provider calls, legal conclusions, scores, or a bulk review action.
- Claiming production readiness, legal validation, provider superiority, WCAG conformance, guaranteed anonymity, or zero retention.

## 9. Frozen contracts and invariants

- The only enabled P0 case is `CFN-DEMO-001`, fixture version `1.0.0`, visibly described as a fictional synthetic adult case. No upload control is present.
- The persistent banner text is exactly: `Synthetic training case. Do not upload or enter real case data.` It is visible on every `/case/demo/*` route and cannot be dismissed.
- The landing screen states the one-sentence product purpose, names the qualified practitioner audience, identifies the synthetic-only boundary, and clearly says the product does not determine trafficking, credibility, guilt, legal eligibility, or legal strategy.
- The landing screen also says it is not a survivor chatbot, emergency service, or reporting channel, links to Trust and Safety, and exposes one Start demo action targeting `/case/demo/purpose`.
- Prototype role selection, if referenced, is not authentication and must never be described as secure access control.
- Visible case navigation is exactly Purpose, Documents, Review, and Export. Trust and Safety remains a global destination outside the case flow.
- Case-step progress labels are `Not started`, `In progress`, `Needs review`, `Blocked`, and `Complete`. They are navigation labels, not evidence or legal states. The active step uses `aria-current="step"`.
- The header derives and presents one canonical case status from `CaseStatus`: Draft, Processing, Review required, Blocked, Ready to export, Exported, or Processing failed. UI code must not set or reinterpret the status.
- The case header keeps the synthetic label, case ID, current section, case status, selected provider and model for a live run, live or replay mode, and Reset Case action visible when applicable.
- Provider or replay identity comes only from the current canonical state. Replay remains labelled `Bundled deterministic replay, not live AI`; a prepared checkpoint also shows its separate prepared-checkpoint provenance.
- Reset Case dispatches the existing central `reset_case` command. The shell must not duplicate storage, PDF-worker, object-URL, or cache cleanup logic.
- Case and model content is rendered as inert escaped React text. Do not use `dangerouslySetInnerHTML`.
- The shell uses semantic landmarks, a skip link, one clear page heading, descriptive metadata, native controls, visible focus, text plus icons for status, and no color-only meaning.
- At 1440 by 900 pixels the case shell follows the judged desktop proportions. At 320 CSS pixels and 200 percent zoom it remains operable without essential horizontal scrolling or obscured focus.

## 10. Implementation steps

1. Inspect Git status, every owned file, the integrated UI primitives, and the TASK-010 state and reset interfaces. Stop if either dependency contract is missing.
2. Define the smallest shell composition using existing primitives and canonical state selectors. Keep route composition in `app` and presentation in `components/shell`.
3. Add root metadata and the landing boundary content, synthetic case entry, Trust and Safety link, and Start demo target without adding a feature-route implementation.
4. Implement the persistent case layout, banner, case header, exact step navigation, status presentation, active-run provenance, responsive behavior, skip link, and central Reset Case dispatch.
5. Add focused component tests for landing boundaries, exact banner copy, navigation order and `aria-current`, derived case statuses, live and replay labels, Reset Case dispatch, semantic landmarks, and narrow-layout behavior that can be asserted without another route.
6. Run every verification command, perform every manual check that is available within this task's owned routes and test render, and inspect the final diff for unowned files, unsupported claims, secrets, debug output, and accidental feature logic.

## 11. Acceptance criteria

- `/` has descriptive ContextFirst Nexus metadata and visibly presents the supported purpose, qualified user, synthetic-only boundary, prohibited decisions, non-service boundaries, Trust and Safety link, and one Start demo action.
- The Start demo action targets `/case/demo/purpose`; the landing experience neither exposes upload nor invents a real organization, court, person, or authentication flow.
- The case layout renders the exact persistent synthetic banner and an accessible header containing the required case, section, status, provenance, and reset information supplied by canonical state.
- Navigation contains exactly Purpose, Documents, Review, and Export in that order, marks the active item with `aria-current="step"`, and uses only the frozen progress labels.
- Live state shows the selected provider and model; replay state shows `Bundled deterministic replay, not live AI`; prepared-checkpoint state keeps both replay and checkpoint provenance visible.
- Invoking Reset Case dispatches the TASK-010 command once and follows the reducer's return-to-purpose state without locally mutating status or storage.
- Landing and shell tests cover supported loading or state variants without a blank-success state, and every meaningful status has visible text in addition to color or icon.
- The landing remains readable at 1440 by 900 and at 320 CSS pixels with 200 percent zoom; focus indicators and the skip link remain visible and operable.
- The production build succeeds without pulling provider SDKs, PDF.js, or the PDF renderer into the landing-page initial behavior.

## 12. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/components/shell
npm run build
```

## 13. Manual checks

1. Open `/` at 1440 by 900 pixels. Confirm the purpose and all non-use boundaries can be explained from this page alone, the synthetic case is the only entry, the Trust and Safety link is visible, and Start demo targets `/case/demo/purpose`.
2. Navigate the landing page by keyboard from the skip link through Start demo and Trust and Safety. Confirm a visible focus indicator, logical order, native activation, and one clear page heading.
3. Resize `/` to 320 CSS pixels and inspect it at 200 percent zoom. Confirm all copy and actions reflow without essential horizontal scrolling or overlap.
4. In the focused shell component render, use a Purpose child heading and each canonical case status. Confirm the banner is not dismissible, the header labels do not collapse into one score, the active Purpose step has `aria-current="step"`, and all four steps remain keyboard reachable.
5. In the same render, switch the supplied canonical run state between live, replay, and prepared checkpoint. Confirm provider and model are shown only for live state, replay is never called live AI, and checkpoint provenance remains separate.
6. Invoke Reset Case once in the shell render. Confirm the existing central command is dispatched once, no direct storage mutation occurs in shell code, and focus remains in a predictable location.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add global shell and landing experience`

## 15. Handoff requirements

Return a self-contained handoff containing:

- `Task: TASK-017, Global shell and landing experience` and outcome `Complete`, `Partial`, or `Blocked`.
- Every changed path, listed exactly.
- The landing and shell behavior now observable, including the exact synthetic banner, navigation, state-derived status, run provenance, and Reset Case behavior.
- Confirmation that the synthetic-only, no-legal-decision, no-authentication, no-score, inert-rendering, and central-state invariants were preserved.
- Each acceptance criterion with its result.
- Each required command and manual check with `PASS`, `FAIL`, or `NOT RUN` and the reason for any unrun check.
- Any dependency, route-composition, accessibility, or contract issue that the coordinator must resolve.
- The commit hash only if commit permission was present and used; otherwise `Not committed`.

## 16. Stop conditions

Stop and notify the coordinator if:

- TASK-004 or TASK-010 is not integrated, its required interface is absent, or the base contains unresolved verification failures.
- The task graph and this packet disagree about title, dependencies, owned paths, or verification commands.
- Completing the shell requires editing a feature route, shared reducer, contract, fixture, global style, primitive, package file, test configuration, or any other unowned path.
- A new dependency, environment variable, route, contract value, fixture ID, provider behavior, storage behavior, or deployment setting appears necessary.
- Reset Case cannot be wired through the existing central command, or the command does not implement the documented cleanup and return-to-purpose behavior.
- Required metadata or boundary copy conflicts with a higher-authority product or safety document.
- Any real person, real case data, credential, private URL, provider diagnostic, or unsupported public claim appears in the worktree.
- Verification reveals an upstream shared-interface defect. Report the smallest reproduction; do not patch the dependency from this task.
