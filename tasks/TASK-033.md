# TASK-033: Hydration-aware Review remediation focus

## 1. Task metadata

- Task ID: TASK-033
- Stage: integration bridge
- Status: Ready
- Wave: corrective bridge after TASK-032 and before TASK-022 resumes
- Risk: medium
- Suggested branch: `task/033-hydration-review-remediation-focus`
- Depends on: TASK-017, TASK-021, TASK-032
- Graph outcome: Make exact-hash Review remediation focus wait for the canonical workspace to render after session hydration, run exactly once, and never steal focus during ordinary navigation or later Review updates.
- Exact implementation commit message: `fix: focus hydrated review remediation target`

## 2. Goal

Correct the TASK-032 focus timing so the exact Export remediation URL focuses the meaningful `review-workspace` region after the canonical session-stored checkpoint hydrates and makes that region renderable. Focus must occur exactly once for the exact hash, without affecting ordinary Review navigation or later Review state updates.

## 3. Root cause

`ReviewWorkspace` mounts before canonical session-storage hydration completes. Its TASK-032 focus effect currently has an empty dependency array, sees the exact `#review-workspace` hash, schedules one focus attempt while the target is absent, and never retries when hydration later renders the successful checkpoint and workspace region. The existing TASK-032 tests hide this timing defect by injecting checkpoint state immediately, so the target exists during the initial effect.

TASK-022 must remain blocked until this upstream destination works with the real canonical hydration sequence.

## 4. Dependencies and base requirement

- TASK-017 must be integrated and provide the case shell, session-backed canonical state boundary, hydration behavior, route structure, and accessibility foundations.
- TASK-021 must be integrated and provide the Review route, prepared checkpoint presentation, queue, source drawer, mobile behavior, hero flow, and meaningful Review workspace.
- TASK-032 must be integrated and provide the stable `review-workspace` ID, programmatic focusability, accessible heading relationship, exact-hash boundary, and initial focus regression suite.
- Start from the pushed coordinator baseline on which TASK-033 is Ready and TASK-022 is blocked by it.
- Use only existing React, browser, state, and test interfaces. Do not add packages, parallel state, a route loader, or a second hydration mechanism.

## 5. Required context

Read these sources before editing, in this order:

1. `AGENTS.md` in full.
2. `tasks/TASK-033.md` in full.
3. `PLANS.md` in full.
4. The TASK-017, TASK-021, TASK-022, TASK-032, and TASK-033 entries in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `tasks/TASK-017.md`, `tasks/TASK-021.md`, and `tasks/TASK-032.md`, with attention to canonical state hydration and original ownership.
7. `docs/ARCHITECTURE.md`: canonical state, session hydration, route composition, and Review workspace sections.
8. `docs/CONTRACTS.md`: `CaseState`, checkpoint, persistence, command, and stable remediation-target sections.
9. `docs/DESIGN_SYSTEM.md`: focus management, landmarks, headings, hydration, keyboard navigation, and responsive behavior sections.
10. `docs/PRODUCT_SPEC.md`: Review, Export blocker remediation, prepared checkpoint, and accessibility sections.
11. `docs/SAFETY_AND_DATA.md`: untrusted URL content, canonical state ownership, and safe rendering requirements.
12. `docs/TESTING_AND_EVALUATION.md`: hydration, session persistence, focus timing, cleanup, and Review regression requirements.
13. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4 through 9, 12, 13, and 16.
14. `components/shell/case-state-context.tsx` or the current canonical state-provider implementation, read-only, to understand the real hydration transition.
15. The current contents and Git status of both paths in Section 6.

## 6. Exclusive write scope

- `features/review/candidate/review-workspace.tsx`
- `tests/components/review/candidate/review-workspace-focus.test.tsx`

No other path may be created, edited, renamed, generated, moved, or deleted by this task.

## 7. Dependency-ordered ownership transfer

The coordinator transfers corrective ownership from TASK-032 to TASK-033 for exactly:

- `features/review/candidate/review-workspace.tsx`, only to make the existing exact-hash focus behavior aware of canonical hydration and target renderability.
- `tests/components/review/candidate/review-workspace-focus.test.tsx`, only to replace the immediate-checkpoint blind spot with a real empty-state-to-checkpoint hydration regression and add exactly-once coverage.

TASK-032 and its predecessors TASK-017 and TASK-021 are integrated and must not be active while TASK-033 runs. TASK-022 remains blocked and is not an owner. Preserve every unrelated behavior and the stable accessible target introduced by TASK-032.

## 8. Read-only context allowed

- `components/shell/`
- `app/case/demo/review/page.tsx`
- `features/review/`
- `tests/components/review/`
- `lib/contracts/`
- `lib/state/`
- `lib/review/`
- `fixtures/cases/`
- `fixtures/replay/`
- `tasks/TASK-017.md`
- `tasks/TASK-021.md`
- `tasks/TASK-022.md`
- `tasks/TASK-032.md`
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- Relevant authoritative documents listed in Section 5

Read-only inspection does not grant permission to repair, reformat, or modify these paths.

## 9. Required behavior

### 9.1 Wait for canonical hydration and renderability

- Preserve the stable `id="review-workspace"`, `tabIndex={-1}`, and accessible heading relationship introduced by TASK-032.
- Do not consume the one remediation focus opportunity while the canonical Review workspace target is absent.
- Wait until canonical state hydration makes the successful prepared checkpoint and meaningful Review workspace renderable.
- Tie the focus opportunity to the real target becoming available or to the canonical renderability transition. Do not poll indefinitely, duplicate state, load session storage directly into the feature, or create a second hydration owner.

### 9.2 Exact hash and exactly-once focus

- Focus only when `window.location.hash` is exactly `#review-workspace`.
- Support the real URL:

```text
/case/demo/review?exportBlocker=REVIEW_INCOMPLETE#review-workspace
```

- Focus the target exactly once after it becomes renderable for that mounted navigation.
- Later candidate review, queue, checkpoint, source-drawer, dependency, responsive, or other Review updates must not focus the workspace again or steal focus from the practitioner.
- Ordinary navigation without the exact hash and every non-matching hash must never autofocus the workspace.

### 9.3 URL and cleanup safety

- Inspect only the exact hash needed for focus gating.
- Never read, parse, validate, trust, render, interpolate, log, or derive UI state from `window.location.search`, `searchParams`, `exportBlocker`, or any other query-string content.
- If focus uses a timer, animation frame, listener, callback ref, or other scheduled work, cancel or deactivate it during cleanup.
- Unmounting before hydration or before the scheduled focus completes must not produce late focus, errors, leaked callbacks, or global listeners.

### 9.4 Preserve Review behavior

- Preserve checkpoint state, canonical state ownership, session persistence, queue state, source-drawer inertness, candidate actions, withdrawal and limitation behavior, dependency feedback, mobile behavior, hero flow, and all existing focus-management flows.
- Do not change TASK-022 links, Review route composition, shell navigation, state, contracts, fixtures, packages, configuration, or deployment files.
- Do not add ordinary-entry autofocus, smooth scrolling, a focus trap, a persistent mutation observer, or a feature-local hydration flag that becomes a second state owner.

## 10. Required regression tests

The focused hydration regression must:

1. Start with the real canonical case provider in its empty initial case state.
2. Use the exact remediation URL with `#review-workspace`.
3. Allow the initial focus opportunity, timer, or animation frame to pass while the target is absent.
4. Confirm no element falsely represents or receives `review-workspace` focus during that empty state.
5. Load the prepared canonical checkpoint through the real supported hydration or persistence transition afterward, without injecting checkpoint state into the initial render.
6. Confirm the newly rendered `#review-workspace` region receives focus.

Also add or preserve focused tests proving:

- Focus happens exactly once after hydration, even when later Review updates rerender the workspace.
- A practitioner-focused control remains focused after a later Review update.
- Ordinary Review entry without the hash never autofocuses before or after hydration.
- Non-matching hashes never autofocus before or after hydration.
- Query-string content is not rendered or used for behavior.
- Unmount cleanup cancels scheduled work before and after hydration.
- The stable region ID, `tabIndex={-1}`, visible heading relationship, and programmatic focusability remain intact.
- Existing Review candidate smoke, checkpoint, queue, source-drawer, mobile, and hero behaviors remain passing.

Tests must restore session storage, history URL, hash, active element, timers, animation frames, mocks, and DOM state after every case. A test that injects checkpoint state immediately does not satisfy the required hydration regression.

## 11. Out of scope

- Editing TASK-022, Export links, state providers, session persistence, route files, shell, contracts, fixtures, packages, test configuration, environment files, or deployment files.
- Reading or rendering query-string content.
- Adding a second state owner, alternate checkpoint loader, direct feature-owned session-storage hydration, router dependency, persistent polling loop, or unbounded observer.
- Changing Review content, queue policy, candidate actions, withdrawal logic, source access, mobile layout, hero flow, or ordinary navigation.
- Broad refactoring, optional cleanup, production hardening, provider work, credentials, or real/private data.

## 12. Implementation steps

1. Confirm the worktree is clean, based on the pushed TASK-033 documentation baseline, and limited to Section 6 ownership.
2. Reproduce the empty initial state followed by canonical checkpoint hydration at the exact remediation URL.
3. Replace the one-shot mount timing with the smallest hydration-aware, exact-hash, exactly-once focus mechanism tied to target renderability.
4. Add cleanup for every scheduled callback or listener and guard against refocus after later Review updates.
5. Update the focused regression file so the target is absent during the first focus opportunity and appears only after the supported hydration transition.
6. Run every Section 14 command and complete the real-browser check in Section 15.
7. Inspect the complete diff for exclusive ownership, no query-string access, no package change, and no unrelated Review behavior change.

## 13. Acceptance criteria

- Exact-hash remediation focus survives the real empty-state-to-prepared-checkpoint hydration sequence.
- The focus opportunity is not consumed while the target is absent.
- The workspace receives focus exactly once after it becomes renderable.
- Later Review updates never refocus the workspace or steal practitioner focus.
- Ordinary Review navigation and non-matching hashes never autofocus.
- Query-string content is never read, trusted, or rendered.
- Scheduled work and listeners are cleaned up on unmount.
- Stable target identity and accessibility semantics from TASK-032 remain unchanged.
- Checkpoint, queue, source drawer, candidate, withdrawal, limitation, dependency, mobile, hero, persistence, and existing focus behavior remain intact.
- Only the two Section 6 paths change and every required verification passes.

## 14. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/components/review/candidate
npm run typecheck
npm run build
git diff --check
```

All four commands must pass.

## 15. Required real-browser verification

Manually open this exact URL in a real browser with the normal session-storage hydration path:

```text
/case/demo/review?exportBlocker=REVIEW_INCOMPLETE#review-workspace
```

Confirm the page initially passes through the empty or preparing state, the prepared checkpoint then renders, the meaningful Review workspace receives focus exactly once, the query value is not displayed, and later Review interaction does not refocus the workspace. Also open ordinary `/case/demo/review` and confirm no autofocus occurs.

## 16. Commit and handoff

- Commit only when the worker prompt explicitly authorizes it.
- Exact implementation commit message: `fix: focus hydrated review remediation target`
- Return both changed paths, every command result, the real-browser result, the exact hydration sequence exercised, the exactly-once evidence, cleanup behavior, and any stop condition.
- Report whether TASK-022 can resume; only coordinator integration of TASK-033 satisfies its dependency.

## 17. Stop conditions

Stop and notify the coordinator if:

- TASK-017, TASK-021, or TASK-032 is not integrated; the graph and packet disagree; the worktree is dirty; or either owned path overlaps active work.
- The regression cannot exercise the real canonical empty-state-to-checkpoint hydration transition without editing the provider or state implementation.
- Correct focus requires editing TASK-022, the Review route, shell, state provider, persistence, contracts, packages, configuration, or another unowned path.
- The implementation would read query-string content, create parallel hydration state, poll indefinitely, leak scheduled work, or refocus after later Review updates.
- Existing checkpoint, queue, source drawer, candidate, withdrawal, limitation, dependency, mobile, hero, or ordinary focus behavior regresses.
