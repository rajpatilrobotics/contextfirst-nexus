# TASK-032: Review remediation focus bridge

## 1. Task metadata

- Task ID: TASK-032
- Stage: integration bridge
- Status: Ready
- Wave: bridge after TASK-021 and before TASK-022 resumes
- Risk: medium
- Suggested branch: `task/032-review-remediation-focus`
- Depends on: TASK-017, TASK-021
- Graph outcome: Provide a stable accessible Review workspace remediation target that receives focus only when navigation enters with the exact `review-workspace` hash, including the real export-blocker URL.

## 2. Goal

Make the canonical Review workspace a stable, accessible remediation destination for blocked Export links. The target must have a durable anchor, meaningful heading relationship, and deterministic hash-entry focus after hydration without changing ordinary Review navigation or any existing Review state and focus flows.

## 3. Why this task exists

TASK-022 must link `REVIEW_INCOMPLETE` blockers back to the meaningful Review workspace and move keyboard or assistive-technology focus to that destination. TASK-021 provides the complete workspace but does not expose the stable `review-workspace` anchor or hash-entry focus behavior required by the Export remediation contract. This bridge fixes the upstream destination before TASK-022 resumes, so Export does not own or patch Review behavior.

## 4. Dependencies and base requirement

- TASK-017 must be integrated and provide the global case shell, route structure, navigation behavior, accessibility foundations, and client hydration context.
- TASK-021 must be integrated and provide `/case/demo/review`, the meaningful Review workspace region, canonical checkpoint and queue state, source-drawer inertness, mobile presentation, and existing focus-management flows.
- Start from the pushed coordinator baseline on which TASK-032 is Ready and TASK-022 is blocked by it.
- Use only existing React, Next.js, browser, and test interfaces. Do not add packages or change routes, global navigation, contracts, state, fixtures, or Export links.

## 5. Required context

Read these sources before editing, in this order:

1. `AGENTS.md` in full.
2. `tasks/TASK-032.md` in full.
3. `PLANS.md` in full.
4. The TASK-017, TASK-021, TASK-022, and TASK-032 entries in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/PRODUCT_SPEC.md`: Review, Export blockers, remediation, keyboard, and accessibility sections.
7. `docs/ARCHITECTURE.md`: route composition, client hydration, shared state, and Review workspace sections.
8. `docs/DESIGN_SYSTEM.md`: focus management, landmarks, headings, keyboard navigation, and responsive behavior sections.
9. `docs/CONTRACTS.md`: export blocker, remediation-link, Review state, and stable-ID sections.
10. `docs/SAFETY_AND_DATA.md`: safe rendering, untrusted content, state ownership, and no-query-data requirements.
11. `docs/TESTING_AND_EVALUATION.md`: component focus, hydration, routing, cleanup, and accessibility regression requirements.
12. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4 through 9, 12, 13, and 16.
13. `tasks/TASK-017.md`, `tasks/TASK-021.md`, and `tasks/TASK-022.md`, with attention to original ownership and preserved behavior.
14. The current contents and Git status of both paths in Section 6.

## 6. Exclusive write scope

- `features/review/candidate/review-workspace.tsx`
- `tests/components/review/candidate/review-workspace-focus.test.tsx`

No other path may be created, edited, renamed, generated, moved, or deleted by this task.

## 7. Dependency-ordered ownership transfer

The coordinator transfers corrective ownership from TASK-021 to TASK-032 for:

- `features/review/candidate/review-workspace.tsx`, only for the stable workspace target, accessible heading relationship, and exact-hash focus effect.
- `tests/components/review/candidate/review-workspace-focus.test.tsx`, as a new focused regression file under TASK-021's original Review candidate test scope.

TASK-021 is integrated and must not be active while TASK-032 runs. TASK-017 remains read-only routing and shell context. TASK-022 remains blocked and must not be edited or used as a parallel owner. This transfer does not permit broader Review workspace refactoring.

## 8. Read-only context allowed

- `app/case/demo/review/page.tsx`
- `features/review/`
- `tests/components/review/`
- `components/shell/`
- `components/ui/`
- `lib/contracts/`
- `lib/state/`
- `lib/review/`
- `fixtures/cases/`
- `tasks/TASK-017.md`
- `tasks/TASK-021.md`
- `tasks/TASK-022.md`
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- Relevant authoritative documents listed in Section 5

Read-only inspection does not grant permission to repair, reformat, or modify these paths.

## 9. Required behavior

### 9.1 Stable accessible target

- Add `id="review-workspace"` to the meaningful Review workspace region, not to a decorative wrapper, empty node, hidden element, or unrelated page shell.
- Make that target programmatically focusable with `tabIndex={-1}`. It must not enter the ordinary sequential Tab order.
- Give the target an accessible heading relationship, such as `aria-labelledby` referencing the visible Review workspace heading's stable ID.
- Preserve the existing visible heading text, region semantics, layout, responsive composition, and accessible name.

### 9.2 Exact hash-entry focus

- After client hydration, focus the Review workspace target only when `window.location.hash` is exactly `#review-workspace`.
- Support this real URL without reading content from its query string:

```text
/case/demo/review?exportBlocker=REVIEW_INCOMPLETE#review-workspace
```

- The `exportBlocker` query value is routing context only. Do not render it, interpolate it, use it as copy, select state from it, or trust any query-string content.
- Ordinary navigation to `/case/demo/review` without the exact hash must not autofocus the workspace, steal focus, alter the active element, or change scroll or state behavior.
- Unrelated, empty, malformed, or differently cased hashes must not focus the workspace.
- If deferred focus uses an animation frame, timer, microtask, event listener, or other queued browser work, clean it up on unmount so a removed workspace cannot receive late focus.

### 9.3 Preserve existing Review behavior

- Preserve the prepared checkpoint and all canonical case state.
- Preserve queue selection, candidate actions, withdrawal preview, dependency feedback, timeline and Nexus state, source drawer inertness, exact-source access, mobile presentation, and existing focus-management flows.
- Do not add a second state owner, route-local case state, focus trap, persistent global listener, or alternate navigation mechanism.
- Do not move or rename candidate, queue, source, dependency, or context-gap targets.

### 9.4 Boundary constraints

- Do not edit TASK-022 links. This task prepares only the Review destination.
- Do not edit global or case navigation, the Review route file, shell components, state, contracts, fixtures, packages, configuration, or deployment files.
- Render no query-string or hash content as React text or HTML.
- Use no `dangerouslySetInnerHTML`, DOM-string injection, query-derived selector, dynamic element ID, or query-derived accessible label.

## 10. Required regression tests

Add focused tests proving:

- The meaningful Review workspace region has `id="review-workspace"`, `tabIndex={-1}`, and an accessible name derived from its visible heading.
- Entry at `/case/demo/review?exportBlocker=REVIEW_INCOMPLETE#review-workspace` focuses that exact target after hydration.
- The query string is not displayed, used as the accessible name, or otherwise rendered.
- Ordinary entry at `/case/demo/review` leaves the workspace unfocused and does not steal focus from an existing element.
- Empty, unrelated, malformed, and differently cased hashes do not focus the target.
- Unmount cleanup prevents any queued focus or listener callback from focusing a removed element.
- The target remains outside the sequential Tab order while retaining programmatic focusability.
- Existing Review candidate tests and focus-management flows remain passing.

Tests must restore URL, hash, active-element, timer, animation-frame, and DOM state after each case so they do not leak into other Review tests.

## 11. Out of scope

- Editing TASK-022 links, Export components, blocker copy, global navigation, shell, route files, state, contracts, fixtures, packages, test configuration, environment files, or deployment files.
- Reading, validating, displaying, or trusting `exportBlocker` or any other query-string value.
- Changing checkpoint, queue, candidate, withdrawal, dependency, citation, source drawer, mobile, or existing focus behavior.
- Adding smooth scrolling, analytics, telemetry, a router dependency, a new focus manager, a new anchor system, or a persistent global listener.
- Broad refactoring, optional cleanup, production hardening, provider work, credentials, or real/private data.

## 12. Implementation steps

1. Confirm the worktree is clean, based on the pushed TASK-032 documentation baseline, and limited to Section 6 ownership.
2. Identify the existing meaningful Review workspace region and its visible heading without changing composition or state.
3. Add the stable target ID, `tabIndex={-1}`, heading ID, accessible relationship, and a focused client effect gated by the exact hash.
4. Ensure any deferred browser work is cancelled or removed during cleanup and ordinary navigation remains untouched.
5. Add the focused regression file for hash entry, ordinary entry, target identity, query safety, and cleanup.
6. Run every Section 14 command in order and inspect the complete diff for exclusive ownership and preserved Review behavior.

## 13. Acceptance criteria

- The meaningful workspace region is the unique `review-workspace` target and is programmatically focusable but not tabbable.
- Its accessible name is deterministically related to the visible Review workspace heading.
- The exact real export-remediation URL focuses the target after hydration.
- Ordinary Review navigation and non-matching hashes never autofocus the target.
- Query-string content is neither trusted nor rendered.
- Cleanup prevents stale deferred focus or listeners after unmount.
- Checkpoint, queue, source drawer, mobile, candidate, withdrawal, dependency, and existing focus behavior remain unchanged.
- Only the two Section 6 paths change and every Section 14 command passes.

## 14. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/components/review/candidate
npm run typecheck
npm run build
git diff --check
```

All four commands must pass.

## 15. Manual checks

1. Open `/case/demo/review?exportBlocker=REVIEW_INCOMPLETE#review-workspace`. Confirm focus moves to the visibly headed Review workspace region after hydration and the query value is not shown.
2. Open `/case/demo/review` without a hash. Confirm no workspace autofocus occurs and normal initial focus remains unchanged.
3. Open the Review route with unrelated and differently cased hashes. Confirm the workspace is not focused.
4. Navigate away immediately during hydration or queued focus. Confirm no late focus or error occurs after unmount.
5. Exercise checkpoint, queue, source drawer, withdrawal, mobile, and existing focus flows. Confirm their behavior is unchanged.

## 16. Commit and handoff

- Do not commit unless the worker prompt explicitly authorizes it and supplies or confirms the implementation commit message.
- Return both changed paths, every verification result, the exact hash condition, accessible target relationship, cleanup behavior, and any stop condition.
- Report whether TASK-022 can resume; only coordinator integration of TASK-032 satisfies its dependency.

## 17. Stop conditions

Stop and notify the coordinator if:

- TASK-017 or TASK-021 is not integrated, the graph and packet disagree, the worktree is dirty before implementation, or either owned path overlaps active work.
- The meaningful Review workspace region or visible heading cannot be identified without changing route composition.
- Correct focus requires editing TASK-022, the Review route, shell, state, contracts, packages, configuration, or another unowned path.
- Existing focus management, source drawer inertness, checkpoint state, queue state, or mobile behavior regresses.
- The implementation would render query content, trust a query value, add a persistent listener without cleanup, or autofocus ordinary Review navigation.
