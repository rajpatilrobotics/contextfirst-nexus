# TASK-023: Trust, audit, Safety Lab, and guidance UI

## 1. Task metadata

- Task ID: TASK-023
- Stage: interface
- Status: Pending. Only the coordinator may mark this task Ready after every dependency is integrated.
- Wave: 10
- Risk: medium
- Suggested branch: `task/023-trust-safety-lab`
- Depends on: TASK-003, TASK-004, TASK-010, TASK-016, TASK-017, TASK-026

## 2. Goal

Implement the Trust page and reusable trust surfaces for the System Card, truthful static provider admission state and linked report evidence, measured synthetic Safety Lab results, provider and replay attempt history, prepared-checkpoint provenance, versioned guidance cards, explanatory Audit History, and safe unsafe-output reporting.

## 3. Why this task exists

Responsible use depends on more than a disclaimer. Practitioners and judges need to see what the prototype is for, what it cannot do, what data flow and provider terms actually applied, which synthetic checks passed or failed, how the current reviewed state was produced, and how to report a problem without disclosing more case content.

## 4. Dependencies and base requirement

- TASK-003 must be integrated and provide the versioned synthetic fixture, evaluation definitions, stable IDs, and reviewed local guidance pack.
- TASK-004 must be integrated and provide accessible panels, result states, disclosure, status, table or card, link, form, and responsive UI foundations.
- TASK-010 must be integrated and provide canonical run history, active run, audit events, checkpoint state, local unsafe-report command, and reset-aware case context.
- TASK-016 must be integrated and provide deterministic and model evaluation result projections with actual passed, failed, and not-run states and exact release provenance.
- TASK-017 must be integrated and provide the global Trust and Safety destination, shell metadata, synthetic boundary, and shared navigation language.
- TASK-026 must be integrated and provide the reviewed version-controlled static provider admission record, exact accepted report references, fail-closed status, and safe deployed-account availability projection.
- Create the worktree from the latest coordinator branch containing all six integrated dependencies and their passing verification. Do not invent measured results, infer admission from result files, or copy fixture truth into presentation logic.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-023.md` in full.
3. `PLANS.md` in full.
4. The TASK-023 entry in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `decision-log.md` in full, with special attention to DEC-036 and DEC-042.
7. `PROJECT_BRIEF.md`: One-sentence description, Challenge fit, The proposed solution, Primary user, Affected stakeholder, Prototype scope, Product principles, Success criteria, and Pilot direction.
8. `docs/PRODUCT_SPEC.md`: Sections 3 through 6, 7.11, 7.15, 8 through 11.
9. `docs/CONTRACTS.md`: Sections 2, 3, 4.7, 16.4 through 16.6, 18, 21, 22, 23, 24, 25, and 26.
10. `docs/ARCHITECTURE.md`: Sections 3 through 7, 8.4 through 10, 11 through 16, and 18.
11. `docs/MODEL_ROUTING.md`: Sections 2, 5 through 11, and 13.
12. `docs/DESIGN_SYSTEM.md`: Sections 2, 3, 5 through 8, 9.15, 9.16, 10, 11, 12, 13, and 14.
13. `docs/SAFETY_AND_DATA.md`: Sections 1 through 5, 8 through 13, 16 through 20.
14. `docs/DEMO_AND_FIXTURES.md`: Sections 1 through 4, 7, 9, 11, 13 through 17.
15. `docs/TESTING_AND_EVALUATION.md`: Sections 2, 4, 5, 9, 10.3, 11, 12, 13, 14.4, 18 through 22.
16. `docs/SOURCE_REGISTER.md`: Sections 1 through 9, including TECH-014 through TECH-036.
17. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4, 6, 7, 9, 12, 13, and 16.
18. The current contents of every path in the Exclusive write scope.

## 6. Exclusive write scope

- `app/trust/page.tsx`
- `features/trust/`
- `tests/components/trust/`

No other path may be created, edited, renamed, moved, or deleted.

## 7. Read-only context allowed

- `components/ui/`
- `components/status/`
- `components/shell/`
- `lib/contracts/`
- `lib/state/`
- `lib/fixtures/`
- `lib/guidance/`
- `lib/evaluation/`
- `fixtures/cases/`
- `fixtures/evals/`
- `fixtures/guidance/`
- `fixtures/replay/`
- `app/api/analyze/route.ts`
- `lib/ai/server/registry.ts`
- `lib/ai/server/admission.ts`
- `.env.example`
- `package.json` and shared test configuration, only to understand integrated interfaces and commands

The provider registry, evaluation outputs, fixtures, guidance, state, audit logic, contracts, environment template, and shared files are read-only.

## 8. Out of scope

- Editing evaluation results, fixture expectations, guidance passages, source-register facts, provider registry, run provenance, audit events, state logic, contracts, replay data, or checkpoint data.
- Running live evaluation, calling a provider, checking provider health or account settings, changing static admission, loading reports to promote admission at runtime, enabling Mistral, or recommending a provider.
- Adding an overall accuracy score, hiding failed or not-run fixtures, changing a denominator, or turning small synthetic results into a real-world effectiveness claim.
- Describing the audit as immutable, forensic, tamper-evident, independently witnessed, production-grade, or chain of custody.
- Allowing an unsafe-output report to contain pasted source text, exact quotes, identifiers, prompts, model bodies, free-text sensitive details, or automatic transmission.
- Treating guidance as case evidence, domestic law, certification, endorsement, partnership, validation, or an individual conclusion.
- Implementing provider selection or recovery, review actions, export rendering, production authentication, analytics, upload, real data, external messaging, or a support backend.
- Changing packages, global styles, shell layout, shared primitives, test configuration, environment variables, deployment files, or cloud settings.

## 9. Frozen contracts and invariants

- The Trust page describes a working synthetic hackathon prototype, not a production case system, legal service, survivor chatbot, reporting channel, emergency service, or validated real-world intervention.
- Public copy may report exact measured synthetic-fixture results and observed prototype measurements only when the integrated result records support them. It does not claim trafficking detection, victims identified, legal outcomes, universal accuracy, production readiness, certification, endorsement, partnership, guaranteed anonymity, zero retention, or perfect prompt-injection protection.
- `SystemCard` is the canonical presentation contract. It includes intended and prohibited uses, enabled `bundled_synthetic` origin, exact fixture binding, fixed provider order, all safe provider option projections, selected release before a run, explicit-choice policy, no automatic failover, no cross-run merging, replay status, attempted runs, typed non-run attempts, current run, active checkpoint, supported and unsupported conditions, human review requirements, known failures and limitations, fixture count, unsafe-report mechanism, and measured results.
- Provider order is OpenAI, Gemini, Mistral, then local replay. Provider option cards preserve exact release, requested model, evaluation and availability state, tier, disclosure version, storage mode, retention setting and limitation, training-use disclosure, transmission state, and last verification without exposing secrets.
- Provider evaluation and selectability are displayed from the integrated version-controlled static admission projection. The UI never derives admission from environment values, credentials, provider responses, or dynamically loaded evaluation result files.
- Admission evidence displays the static status, exact referenced evaluation report ID and canonical digest when present, exact release binding, and the underlying report status and gate evidence without changing or recomputing admission. Missing, incomplete, failed, or mismatched evidence remains visibly non-selectable and is never presented as passed.
- Mistral deployed-account availability is shown only through its safe canonical status. A passed evaluation report without coordinator-recorded safe `available` evidence remains non-selectable, and account evidence contents are never displayed or inferred.
- Free Gemini remains exact-bundled-fixture only. Free Mistral remains unavailable until exact `mistral-small-2603` admission and, if enabled, shows actual training-use or opt-out state, up-to-30-day abuse-monitoring retention, no free zero data retention, and exact-fixture-only scope.
- OpenAI `store: false`, Gemini stateless use, and Mistral stateless use are not described as zero retention. System-card copy matches actual integrated registry and account-verified projection, not hard-coded assumptions.
- Every attempted run remains separately visible with run ID, live or replay mode, provider, release, requested and returned model when known, tier, disclosure, inference setting, status or safe failure, recovery link, and whether transmission occurred. Separate run outputs are never merged.
- `attemptedRuns` contains only real run records. `nonRunAttempts` separately projects preflight rejection as not transmitted and not started, and browser transport failure as unknown transmission and unknown remote outcome. Both accept no output and carry safe start-command, provider, release, reason, and event linkage without inventing a run. Failed runs remain distinct from successful runs and replay. Safe failure copy contains no source content, key, account, billing, project, or raw provider detail.
- An active `DEMO-CHECKPOINT-REVIEW` shows `Prepared synthetic review checkpoint`, `Bundled deterministic replay, not live AI`, checkpoint and replay versions, fixture version, Fixture reviewer attribution, and no provider transmission.
- Provider-admission records remain passed, failed, or not run. Genuine provider evidence exposes fixture ID and version, split, run mode, exact provenance, check names, expected and observed summaries, and real status. The separate replay-continuity result exposes its replay bundle, fixture, local provenance, checks, and status, but never a provider-comparison split or admission role. `DeterministicHarnessResult` records render in a separate Deterministic CI harness section with planned release, mock-harness provenance, and the explicit label Not live model evidence. They never appear as provider quality, are never grouped with provider comparisons, and cannot support admission. Failed and not-run provider results remain visible.
- The Safety Lab does not create an overall accuracy percentage, average away a critical failure, compare providers beyond the recorded task-specific results, or imply real-case effectiveness.
- Guidance cards use canonical `GuidanceCard` records with source-register ID, issuer, title, material type, date and version, jurisdiction or scope, exact reviewed passage, locator, direct URL, last verification, verification status, allowed use, limitation, and local legal verification required.
- Guidance and case evidence are visually and semantically separate. International guidance can frame practitioner questions but cannot corroborate Maya K., establish domestic law, determine eligibility, or support a case candidate.
- `AuditHistory` is an explanatory browser-session record. It shows sequence, actor, safe action summary, time, run or recovery linkage, provider registry IDs where applicable, and affected entity IDs without raw quote, identifier, prompt, provider body, or sensitive reason text.
- Prepared decisions are attributed to `fixture_reviewer`; current actions are attributed to the current practitioner. Prior events remain visible when a later action supersedes them.
- `UnsafeOutputReport` accepts only one safe category from prohibited claim, privacy concern, citation problem, or other safe category plus affected entity IDs. It uses the central local command and does not automatically transmit.
- All trust content is rendered as inert escaped React text. Required information is visible without relying only on color, icons, tooltips, or a collapsed disclosure.

## 10. Implementation steps

1. Inspect Git status, owned files, canonical System Card and Evaluation Result projections, run and checkpoint state, guidance records, audit events, unsafe-report command, and measured result fixtures. Stop if any displayed fact would require invention.
2. Compose `/trust` as a mostly server-rendered trust destination where practical, with focused client components only for case-linked audit and unsafe reporting interactions.
3. Implement `SystemCardPanel` with current registry, static admission status, exact admitted report references, safe deployed-account availability, selection, attempted-run, non-run-attempt, replay, checkpoint, data-flow, retention, human-review, unsupported-condition, and limitation sections using canonical projections.
4. Implement `SafetyLabResult` for every integrated measured, failed, and not-run provider or replay fixture result plus versioned admission-report evidence with exact check-level evidence and no aggregate score or runtime admission inference. Implement a visibly separate deterministic CI harness presentation that cannot be interpreted as live model evidence.
5. Implement versioned guidance presentation, reusable `AuditHistory`, and `UnsafeOutputReport`, preserving separation from case evidence, safe field limits, actor provenance, and local-only reporting.
6. Add focused tests for public boundary copy, provider order, static admission and unavailable states, exact report ID and digest display, missing or mismatched evidence, Mistral safe availability, no dynamic promotion, Mistral and Gemini disclosures, run attempts, typed preflight and unknown-transport non-run attempts, checkpoint provenance, failed and not-run results, no overall score, guidance metadata and separation, audit safety, report field restrictions, inert rendering, loading or empty states, keyboard behavior, and reflow.
7. Run every verification command, complete the manual checks, and inspect the diff for unowned paths, invented metrics, hidden failures, hard-coded provider assumptions, raw data, secrets, unsupported endorsements or conformance claims, automatic report transmission, and debug output.

## 11. Acceptance criteria

- `/trust` clearly states intended use, prohibited use, synthetic-only scope, affected stakeholder boundary, human-review requirement, public limitations, and supervised future-pilot direction without unsupported claims.
- The System Card renders the fixed provider order and every canonical enabled, unavailable, selected, attempted, failed, replay, recovery, retention, transmission, and checkpoint field that applies to current state.
- The System Card and Safety Lab render the static provider admission state and exact report evidence truthfully, including report ID and canonical digest when present, without recomputing admission or treating a result file, environment value, or credential as promotion evidence.
- Missing, incomplete, failed, or mismatched admission evidence remains explicit and non-selectable. Mistral remains non-selectable unless both its exact report passed and its static safe deployed-account availability is `available`.
- Unavailable or failed providers expose safe status only. Mistral and Gemini data restrictions are accurate, and no UI text exposes or infers credentials, account IDs, billing, project details, private endpoints, or raw diagnostics.
- Live runs, failed runs, preflight non-run attempts, unknown-transport non-run attempts, replay, and prepared checkpoint are visually distinct. Non-run attempts never appear in `attemptedRuns`, both accept no output, and unknown transport does not claim whether transmission or remote execution occurred. Checkpoint decisions remain Fixture reviewer actions and no-provider-transmission state is visible.
- Every integrated evaluation result is visible as Passed, Failed, or Not run with fixture ID, version, split, run mode, exact release provenance, and check-level expected and observed result. No overall accuracy or real-world effectiveness score exists.
- Guidance cards contain every canonical metadata field, direct source link, limitation, and local-verification notice and are never presented as case evidence, domestic law, certification, endorsement, or an individual conclusion.
- Audit History explains purpose, provider selection, acknowledgements, attempts, review actions, dependency changes, blockers, exports, reports, and reset events using safe summaries and stable IDs without raw source or secret material.
- Unsafe-output reporting accepts only a safe category and entity IDs, records a canonical local audit event, asks for no pasted evidence or identifier, and performs no automatic transmission.
- Loading, empty, failed, not-run, replay, checkpoint, no-active-case, and populated states are explicit; no blank panel implies success.
- Trust components use semantic headings and landmarks, visible focus, accessible names, text plus icon statuses, keyboard operation, 200 percent zoom, 320 CSS pixel reflow, and reduced-motion-safe behavior.
- Tests fail if a prohibited public claim, hidden failed fixture, overall score, raw content field, automatic report transmission, or provider-order drift is introduced.

## 12. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/components/trust
npm run build
```

## 13. Manual checks

1. Open `/trust` with no active case. Confirm intended use, prohibited use, synthetic-only scope, provider registry, known limitations, guidance, Safety Lab, and report mechanism remain understandable without implying that a run occurred.
2. Open `/trust` with a live selected release and a preserved failed attempt. Confirm selected and attempted releases, models, tier, disclosure, retention limitation, safe failure, recovery link, and transmission state are separate and no raw diagnostic or account detail appears.
3. Open the page with static Mistral admission still `not_evaluated`. Confirm exact `mistral-small-2603`, Evaluation required, missing report evidence, synthetic-only scope, and non-selectable state. Then use a passed report state without safe deployed-account availability and confirm the exact report ID and digest are visible while Mistral remains non-selectable. If the static record represents admitted free Mistral, confirm coordinator-recorded safe availability, actual training setting, up-to-30-day retention, and no-free-ZDR limitation.
4. Open the page with `DEMO-CHECKPOINT-REVIEW`. Confirm both exact visible labels, versions, Fixture reviewer attribution, local replay release, and no-provider-transmission state appear and no live-provider result is implied.
5. Inspect Safety Lab with at least one Passed, one Failed, and one Not run provider or replay fixture record, plus one deterministic harness record. Confirm all remain visible with their exact checks, the harness is labelled Not live model evidence and excluded from provider comparison and admission, no record disappears from the denominator, and no overall accuracy or real-world effectiveness score appears.
6. Inspect one international-guidance card, one indicator card, and one risk or security framework card. Confirm issuer, type, scope, version, passage, locator, direct link, last verification, allowed use, limitation, and local-verification notice are present and visually separate from case evidence.
7. Inspect Audit History after a provider switch and evidence withdrawal. Confirm actor, sequence, safe summary, run linkage, and entity IDs explain the state without exposing a quote, identifier, prompt, model body, key, or sensitive free-text reason.
8. Submit Unsafe Output Report for each allowed category. Confirm only category and entity IDs are accepted, a local audit event is created, no pasted evidence field exists, and no network or external-message action occurs.
9. Complete the page by keyboard and inspect it at 320 CSS pixels, 200 percent zoom, and reduced motion. Confirm dense provider, evaluation, guidance, and audit content remains readable and no required information depends on color, icon, hover, or tooltip alone.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add trust audit and safety lab UI`

## 15. Handoff requirements

Return a self-contained handoff containing:

- `Task: TASK-023, Trust, audit, Safety Lab, and guidance UI` and outcome `Complete`, `Partial`, or `Blocked`.
- Every changed path, listed exactly.
- The System Card, static admission, exact report evidence, result, guidance, audit, checkpoint, and reporting behavior now observable.
- Confirmation that truthful measured claims, static admission truth, exact report references, no runtime promotion, visible failed and not-run results, provider and replay provenance, fixed provider order, Mistral availability gating, no zero-retention claim, guidance separation, safe audit, local-only reporting, and no raw-content invariants were preserved.
- Each acceptance criterion with its result.
- Each required command and manual check with `PASS`, `FAIL`, or `NOT RUN` and a reason for any unrun check.
- The exact safe result statuses and run modes used for manual verification, without source text, credentials, or private provider details.
- Any fixture, evaluation, provider projection, guidance, state, audit, public-copy, or accessibility blocker requiring coordinator action.
- The commit hash only if commit permission was present and used; otherwise `Not committed`.

## 16. Stop conditions

Stop and notify the coordinator if:

- Any dependency is not integrated, the static admission projection, exact report references, measured result, or guidance projections are absent, or the base fails existing verification.
- The task graph and this packet disagree about title, dependencies, owned paths, or verification commands.
- Completing the page requires editing evaluation data, static admission, fixtures, guidance, source register, provider registry, state reducer, audit engine, replay, contract, shell, UI primitive, package file, test configuration, or another unowned path.
- A displayed provider, model, tier, retention, training, static admission, evaluation report ID or digest, deployed-account availability status, fixture-count, result, checkpoint, or source fact is missing or conflicts with the authoritative documents.
- A new dependency, data source, provider call, live evaluation, account check, environment variable, report backend, analytics service, or deployment setting appears necessary.
- The implementation would hide a failure, invent a metric, create an overall score, imply real-world validation, merge runs, misattribute checkpoint decisions, transmit a report, or weaken guidance and case-evidence separation.
- Any real or private data, credential, account detail, private URL, raw provider diagnostic, unsupported endorsement, certification, partnership, conformance, privacy, or production claim appears.
- Verification reveals an upstream evaluation, fixture, guidance, state, audit, provider-projection, or shared-UI defect. Report the smallest safe reproduction and do not patch the dependency from this task.
