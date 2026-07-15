# TASK-004: Design foundations and UI primitives

## 1. Task metadata

- Status: Pending
- Readiness rule: Only the coordinator may mark this task Ready after TASK-001 and TASK-002 are integrated into the assigned base.
- Stage: foundation
- Wave: 3
- Risk: medium
- Suggested branch: `task/004-design-foundations`
- Depends on: TASK-001, TASK-002
- Graph outcome: Implement the frozen visual tokens, responsive styles, accessible UI primitives, and separate status representations without legal scores or color-only meaning.

## 2. Goal

Create the reusable visual, interaction, accessibility, and status foundations for a calm legal workbench while preserving every separate information dimension and safety boundary.

## 3. Why this task exists

Later screen tasks need one consistent set of local primitives and status mappings. Building those foundations once prevents divergent colors, inaccessible controls, confidence-like badges, and feature-specific versions of frozen labels.

## 4. Dependencies and base requirement

- TASK-001 and TASK-002 must both be integrated into the coordinator branch and present in this worktree base.
- The integrated base must contain the approved shadcn-related packages, `lucide-react@1.24.0`, React component test setup, and exact shared status contracts.
- The existing Tailwind CSS 4 and root `app/globals.css` setup remains the styling foundation.
- No route, feature page, case state, provider call, fixture generation, or application-shell composition is required.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-004.md` in full.
3. `PLANS.md` in full.
4. The `TASK-004` entry in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/DESIGN_SYSTEM.md` Sections 2 through 8, 10 through 14.
7. `docs/PRODUCT_SPEC.md` Sections 2 through 6, 8 through 10.
8. `docs/CONTRACTS.md` Sections 4, 12, 17, 19, and 26.
9. `docs/SAFETY_AND_DATA.md` Sections 2, 6, 7, 10 through 13, and 18.
10. `docs/ARCHITECTURE.md` Sections 4, 6, and 7.
11. `docs/TESTING_AND_EVALUATION.md` Sections 4, 9, and 13.
12. `decision-log.md` decisions DEC-003, DEC-006, DEC-007, DEC-009, DEC-011, DEC-018, and DEC-019.
13. The integrated shared contracts, current package and component-test setup, every current owned file, and the current Git status.

## 6. Exclusive write scope

- `app/globals.css`
- `components/ui/`
- `components/status/`
- `lib/presentation/`
- `tests/components/ui/`
- `tests/unit/presentation/`

## 7. Read-only context allowed

- `lib/contracts/`
- `components/` outside `components/ui/` and `components/status/`
- `features/`
- `app/` outside `app/globals.css`
- `package.json`
- `components.json`
- `postcss.config.mjs`
- `vitest.config.ts`
- `tests/setup/`
- All coordinator-owned documentation and task packets

Read-only application code may be inspected for current import and class-name conventions. It must not be restyled or refactored in this task.

## 8. Out of scope

- App shell, case navigation composition, pages, forms tied to case state, provider selection behavior, source drawer behavior, review workflow, export flow, or trust pages.
- Feature-specific components outside `components/status/`, including the named product components that later tasks own.
- Dark mode, custom web fonts, gradients, glass effects, crime-dashboard imagery, decorative motion, chart or graph libraries, or a design-system rewrite.
- Confidence meters, traffic-light ratings, legal scores, victim-status signals, celebratory success animation, bulk approval, or any visual implication of a legal conclusion.
- Adding dependencies, editing package or tool configuration, changing shared contracts, changing frozen copy, or modifying authoritative documentation.

## 9. Frozen contracts and invariants

- Use the local sans and mono system font stacks exactly as specified. Do not download fonts.
- Implement the exact type sizes and line heights for Display, Heading 1, Heading 2, Heading 3, Body, Body small, Label, and Code or ID. Essential legal, boundary, error, and status text is never below 14 pixels.
- Implement every frozen color token and exact value from `docs/DESIGN_SYSTEM.md` Section 4.2, including distinct `border` and `control-border` roles.
- Use the spacing sequence `4, 8, 12, 16, 24, 32, 48, 64`, 44-pixel minimum controls, 48-pixel compact rows, and the exact radii and border thickness rules.
- Motion is 150 to 200 milliseconds where needed, never looping or decorative, and non-essential motion is removed for `prefers-reduced-motion`.
- Provide responsive foundations for the frozen desktop, tablet, and below-768 layouts, including reflow at 320 CSS pixels and 200 percent zoom without essential horizontal scrolling.
- Preserve five separate status systems: evidence nature, item origin, support status, review status, and case status. Never collapse them into one badge or score.
- Use exact user-facing status wording from the design system and shared contracts. Evidence nature is dependency-level; item origin, support, and review are item-level; case status is case-level.
- Every meaningful status includes visible text and an icon. Color is supplemental only. Unknown, conflicting, insufficient-evidence, not-processed, invalidated, blocked, and failed states remain first-class.
- A documented source is not styled as more truthful than a reported source. AI suggestion styling indicates provenance, not reliability.
- Blocked and Processing failed may share a color family but must retain different words, icons, explanations, and action semantics.
- Use local, inspectable primitives only for button, input, textarea, checkbox, radio group, select, label, field error, alert, alert dialog, badge, card, dialog, sheet, progress, separator, skeleton, table, tabs, and supplemental tooltip.
- Required information never exists only in a tooltip, color, icon, position, animation, or hover state.
- Native semantics, visible two-layer focus, accessible names, error associations, logical focus order, reduced motion, and 44 by 44 internal targets are required foundations.
- Case or document content must render as escaped React text. Do not add `dangerouslySetInnerHTML`.
- WCAG 2.2 Level AA is a target, not a conformance claim. Automated tests do not replace later keyboard, VoiceOver, zoom, reflow, focus, and reduced-motion checks.

## 10. Implementation steps

1. Inspect Git status, integrated contracts, package availability, current global CSS, and existing owned components and tests.
2. Implement the frozen CSS custom properties, typography, spacing, shape, focus, motion, reduced-motion, responsive, and semantic utility foundations in `app/globals.css` without changing route-level layout.
3. Build the approved local UI primitives with clear exports, native semantics where possible, consistent focus and disabled behavior, and no feature or domain state.
4. Build canonical presentation mappings for every evidence-nature, item-origin, support, review, stage, navigation-progress, and case-status value. Use exhaustive TypeScript checks so new values cannot fall through silently.
5. Build reusable status components that render each applicable dimension separately with exact text, icon, accessible name, and color-independent meaning.
6. Add component tests for keyboard behavior, accessible names, labels and descriptions, field errors, dialogs and sheets, progress semantics, tables, tabs, tooltips, focus visibility classes, disabled states, and status text plus icon output.
7. Add presentation unit tests for exhaustive enum coverage, exact labels, icon assignments, tone assignments, and separation of dimensions.
8. Run all graph verification commands and inspect the final diff for unowned files, dependency changes, copy drift, prohibited visual patterns, hidden information, and unsupported accessibility claims.

## 11. Acceptance criteria

- Every frozen font, type, color, spacing, radius, border, focus, and motion token is implemented once and matches the specified value.
- Global styles remain light-first and paper-like, support 320-pixel reflow and reduced motion, and introduce no remote font, gradient, glass, neon, or decorative looping animation.
- The approved primitive set is locally inspectable, typed, composable, and accessible by default without containing case, provider, review, or export business logic.
- Buttons and interactive controls meet the 44-pixel internal target foundation, have visible focus, expose disabled state, and use native button behavior without hover-only actions.
- Inputs and compound controls have programmatic labels, descriptions and errors; dialogs and sheets expose correct roles and focus hooks; tables and progress controls expose semantic structure.
- Tooltips contain only supplemental information and are not the sole source of a required label, status, warning, or instruction.
- Every frozen evidence nature, item origin, support status, review status, stage or progress status, and case status has an exhaustive presentation mapping.
- Status components display exact text plus an icon and do not rely on color. Separate dimensions render as separate labelled elements.
- Unknown, conflict, insufficient evidence, citation unresolved, not processed, invalidated, blocked, and processing failed are visually and semantically distinct.
- No component or mapping introduces a confidence score, overall risk, traffic-light rating, victim or trafficking status, legal eligibility, guilt, credibility, or outcome signal.
- Component, presentation, type, lint, and build verification pass with no changes outside Section 6.
- The implementation makes no WCAG conformance, production accessibility, trauma-informed validation, safety, or legal-validation claim.

## 12. Verification commands

```text
npx vitest run tests/components/ui tests/unit/presentation
npm run typecheck
npm run lint
npm run build
```

## 13. Manual checks

1. Render each base control in its default, focus, disabled, error, and warning state. Use only the keyboard and confirm focus is always visible and no control depends on hover.
2. Render evidence nature, item origin, support status, review status, and case status together for one item. Confirm they remain five separately labelled concepts and each has text plus an icon with color disabled or ignored.
3. Compare every rendered status label with `docs/DESIGN_SYSTEM.md` Section 7 and every underlying value with `docs/CONTRACTS.md` Section 4.
4. At 320 CSS pixels and 200 percent zoom, inspect primitives, status groups, a table fallback, and dialogs. Confirm content reflows, labels remain visible, and focus is not obscured.
5. Enable reduced motion and confirm non-essential transitions disappear. Confirm no spinner is the sole processing indicator.
6. Inspect tooltip examples and confirm all required information remains visible without opening a tooltip.
7. Review the component output and CSS for prohibited score, traffic-light, crime-dashboard, sensational, gradient, glass, neon, or decorative AI patterns.
8. Review the final Git diff and confirm every changed path is in Section 6 and no page, feature logic, package, contract, provider, fixture, or documentation file changed.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Message: `feat: add design foundations and UI primitives`

## 15. Handoff requirements

- Report Task ID `TASK-004` and outcome as Complete, Partial, or Blocked.
- List every changed global style, UI primitive, status component, presentation mapping, and test file.
- Summarize the user-visible design foundations and the exact separate status systems implemented.
- Confirm the no-color-only, no-score, no-legal-conclusion, native-semantics, focus, target-size, reflow, and reduced-motion invariants preserved.
- Report each Section 12 command with pass or fail status and any manual check not completed.
- Report any contrast, focus, responsive, dependency, contract, or accessibility uncertainty without making a conformance claim.
- Confirm no unowned file, dependency, provider, fixture, cloud setting, or secret changed.
- Include a commit hash only when the opening coordinator prompt authorized the commit; otherwise state `Not committed`.

## 16. Stop conditions

- Stop if TASK-001 or TASK-002 is not integrated, required UI or test dependencies are unavailable, shared status contracts differ from the docs, or another active task owns a path in Section 6.
- Stop if completing the task requires any file outside Section 6, a new dependency, package or test configuration change, shared contract change, provider change, fixture change, route change, or cloud change.
- Stop if a requested primitive requires a competing design system, unsupported package, unsafe HTML rendering, color-only meaning, hover-only action, hidden required tooltip content, or inaccessible custom control.
- Stop if frozen copy, tokens, component names, status values, or accessibility behavior conflict across authoritative documents. Report exact passages rather than choosing one.
- Stop if a test can pass only by weakening an accessibility assertion, removing an enum case, hiding an error, or making an unsupported WCAG or safety claim.
- Stop before any global install, destructive command, credential use, provider call, deployment, billing, quota, or production-setting action.
