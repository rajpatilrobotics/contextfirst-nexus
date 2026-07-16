# TASK-025: Performance, release readiness, and deployment rehearsal

## 1. Task metadata

- Task ID: TASK-025
- Stage: release
- Status: Ready for local release preparation only. Deployment, stable-URL access, Vercel changes, production-setting changes, and public live analysis remain separately unapproved.
- Wave: 13
- Risk: high
- Suggested branch: `task/025-release-readiness`
- Depends on: TASK-024

## 2. Goal

Measure the frozen deterministic performance budgets, publish truthful beginner-friendly setup guidance, prepare an evidence-backed release checklist, rehearse the prepared checkpoint five consecutive times, verify the stable production URL only after separate explicit approval, and keep public live analysis disabled until separately approved.

## 3. Why this task exists

A hackathon demo needs a repeatable setup, honest limitations, measured performance, and a stable rehearsal path. Release readiness must be based on actual checks rather than planned behavior, and a public deployment must not expose an unauthenticated paid model route or change production settings without the user's separate approval.

## 4. Dependencies and base requirement

- TASK-024 must be integrated and its complete deterministic, end-to-end, accessibility, security, privacy, header, and production-build verification must pass.
- Preserve every TASK-024 manual `NOT RUN` result as `NOT RUN` in `RELEASE_CHECKLIST.md` unless that exact check is later performed with its required approval and evidence. Local automated results must not promote a manual result.
- Every earlier task is a transitive dependency through TASK-024 and must be integrated on the base branch. A completed but unintegrated worktree does not satisfy this requirement.
- Create the worktree from the latest coordinator branch containing TASK-024 and its passing handoff. Confirm the release scripts named in the graph already exist in `package.json`; this task cannot add or change scripts there.
- Actual deployment, a push that triggers deployment, any change to Vercel project settings, environment values, production secrets, firewall, rate controls, billing, quota, provider accounts, or any repository configuration change that alters deployed behavior requires separate explicit user approval. Task assignment or commit permission alone does not grant it.
- The stable URL rehearsal at `https://contextfirst-nexus.vercel.app` may run only after the user separately approves deployment or production verification and the coordinator confirms the approved build is present there. Without that approval, do not access the stable URL, do not claim TASK-025 Complete, and report the release task as Partial or Blocked as applicable.
- Public live analysis remains disabled unless the user separately approves its budget, abuse controls, provider settings, and production enablement. Approval to deploy replay-only does not approve public live analysis.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-025.md` in full.
3. `PLANS.md` in full.
4. The TASK-025 entry in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `decision-log.md` in full.
7. `plan.md` in full.
8. `PROJECT_BRIEF.md` in full.
9. `docs/PRODUCT_SPEC.md`: Sections 7.15, 9, 10, 11, and 12.
10. `docs/CONTRACTS.md`: Sections 2, 4.7, 16, 20, 22, 23, 25, 26, and 27.
11. `docs/ARCHITECTURE.md`: Sections 3, 4, 8.4, 8.7, 11 through 16, and 18.
12. `docs/MODEL_ROUTING.md`: Sections 2, 6, 8 through 11, and 13.
13. `docs/DESIGN_SYSTEM.md`: Sections 5, 9.15, 10 through 14.
14. `docs/SAFETY_AND_DATA.md` in full.
15. `docs/DEMO_AND_FIXTURES.md`: Sections 1 through 4, 11, 13 through 17.
16. `docs/TESTING_AND_EVALUATION.md`: Sections 1 through 6 and 15 through 22.
17. `docs/SOURCE_REGISTER.md`: HACK-001 through HACK-004, SEC-001, TECH-001 through TECH-036, STD-001, and Sections 9 through 11.
18. `docs/ORCHESTRATION_AND_INTEGRATION.md` in full.
19. The complete TASK-024 handoff and every unresolved integration note included in the release base.
20. The current contents of every path in the Exclusive write scope.

## 6. Exclusive write scope

- `README.md`
- `RELEASE_CHECKLIST.md`
- `scripts/measure-performance.mjs`
- `tests/performance/`
- `vercel.json`

No other path may be created, edited, renamed, moved, or deleted.

## 7. Read-only context allowed

- `app/`
- `components/`
- `features/`
- `lib/`
- `fixtures/`
- `public/`
- `prompts/`
- `tests/e2e/`
- `tests/a11y/`
- `tests/security/`
- `scripts/verify-boundaries.mjs`
- `.env.example`
- `.gitignore`
- `.vercel/README.txt`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- shared lint, Vitest, Playwright, Next.js, and test setup files

These paths are read-only. Never read or report secret values from `.env.local`, Vercel, or provider accounts.

## 8. Out of scope

- Fixing application, feature, domain, contract, fixture, state, provider, renderer, accessibility, security, or test defects outside the Exclusive write scope.
- Adding or changing dependencies, package scripts, lockfiles, framework configuration outside `vercel.json`, environment templates, provider registry entries, models, prompts, fixtures, stable IDs, or evaluation results.
- Running live-provider evaluation or unmocked model calls without a separate current call-count, cost estimate, credential authorization, and explicit user spend approval.
- Enabling public live analysis, changing credentials, rotating keys, pooling keys, changing provider accounts, quotas, billing, training settings, retention settings, or model access.
- Deploying, pushing, linking a new Vercel project, changing the deployment target, modifying production environment settings, or changing firewall or rate controls without separate explicit user approval.
- Visiting or testing the stable production URL before that separate approval and confirmation that the approved build is deployed.
- Claiming production readiness, real-case readiness, legal validation, trafficking effectiveness, universal accuracy, WCAG conformance, penetration testing, guaranteed privacy, anonymity, zero retention, or service-level guarantees.
- Hiding a failed rehearsal, performance miss, accessibility issue, provider limitation, dependency advisory, or incomplete manual check.

## 9. Frozen contracts and invariants

- The release remains one Next.js 16 application on the existing Vercel project. It does not add a service, database, background worker, analytics SDK, external action, or alternate deployment target.
- Supported Node is `>=22.13.0 <27`; the documented Vercel target is Node 24. Any repository deployment configuration must match the frozen architecture and requires separate explicit approval if it changes deployed behavior.
- The analysis route remains Node.js, `maxDuration = 60`, no-store, with 45-second selected-provider timeout and 55-second browser abort. This task does not change route code.
- Public live analysis defaults to disabled. `ENABLE_LIVE_ANALYSIS` and `NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS` remain false in the public deployment until separately approved; labelled replay remains available through the already approved configuration.
- A client-visible flag can never enable a server-disabled route. No README or release step tells users to place a provider key in browser code, a `NEXT_PUBLIC_` variable, source code, Git, URLs, logs, or exports.
- P0 uses at most one active project-owned server credential per provider. Keys are not pooled, rotated, shared, or multiplied to evade quotas. Credentials are never printed or recorded in the checklist.
- The only public demo data is `CFN-DEMO-001`, fixture version `1.0.0`. The prepared rehearsal uses `DEMO-CHECKPOINT-REVIEW`, visibly labelled `Prepared synthetic review checkpoint` and `Bundled deterministic replay, not live AI`, with no provider transmission.
- Local performance measurements run on the MacBook Air M2 baseline. Production measurements identify the stable deployment and exact build. Reported values state environment, mode, fixture, warm-up count, measured count, median, p95 where applicable, and pass or miss.
- A p95 measurement uses one warm-up plus at least 20 measured runs with the same fixture and environment. Timing budgets are rehearsal gates and reported measurements, not flaky per-commit assertions that can be bypassed.
- Frozen targets are: loaded local review feedback under 100 ms; source drawer open and focus under 300 ms p95; dependency recalculation and blocker update under 300 ms p95; seven-document extraction under 5 seconds on the M2 after assets load; prepared checkpoint load under 1.5 seconds; export preview under 2 seconds; deterministic replay under 8 seconds and visibly labelled; live analysis target under 30 seconds with hard application timeout at 45 seconds.
- The prepared-checkpoint measurement mode never makes a provider request and fails if replay or checkpoint provenance is missing or mislabelled.
- Five consecutive approved production rehearsals must each complete the prepared judged flow within 2 minutes 45 seconds. The flow retains the blocked export and evidence-withdrawal recalculation; timing pressure never removes a safety step.
- The exact stable URL is `https://contextfirst-nexus.vercel.app`. Stable-URL checks happen only after separate explicit user approval and only against the approved deployed build.
- Release results are truthful. A failure remains recorded with check ID, expected and observed result, environment, version, whether unsafe content reached review or export, and fix or blocker status.
- README setup uses the existing package manager and scripts, explains synthetic-only scope, local replay, optional server-only provider configuration, public-live-disabled default, Reset Case, testing, limitations, and no production or real-data claim.
- README and checklist contain environment variable names only, never values, credentials, account identifiers, private endpoints, billing details, or private URLs.
- `RELEASE_CHECKLIST.md` separates completed evidence, failed evidence, not-run checks, manual checks, approvals, and deployment state. A checkbox is marked complete only after its named evidence actually passed.
- Before public claims or provider enablement, current official challenge, provider model, pricing, quota, data-use, retention, SDK advisory, Next.js, Vercel, PDF, export, testing, and WCAG sources are rechecked. If a fact changed, stop for coordinated authority updates instead of editing frozen truth locally.
- Actual deployment, production-setting changes, stable-URL access, public live analysis, credentials, spend, push, and commit are separate approval gates. Approval for one does not authorize another.

## 10. Implementation steps

1. Inspect Git status, TASK-024 handoff, all owned files, package scripts, current build and test behavior, stable fixture paths, and existing Vercel linkage metadata without reading secrets. Stop on an unresolved critical integration failure.
2. Implement a deterministic `scripts/measure-performance.mjs` prepared-checkpoint mode that measures the real integrated paths, records environment and run metadata, performs the required warm-up and measured iterations, calculates valid summary statistics, checks frozen budgets, and never calls a live provider.
3. Add performance tests that validate measurement selection, warm-up exclusion, sample count, p95 calculation, threshold reporting, failed-budget behavior, checkpoint and replay provenance, and machine-readable results without using artificial sleeps as proof of application performance.
4. Update README with exact local setup, supported Node range, synthetic demo flow, replay and live-provider boundaries, server-only environment names, verification commands, Reset Case, known limitations, and truthful public claims. Do not include a credential value.
5. Create `RELEASE_CHECKLIST.md` with evidence-linked deterministic, accessibility, security, privacy, performance, rehearsal, public-copy, dependency, provider, manual, approval, deployment, rollback, and handoff checks. Record failures and not-run items explicitly.
6. Only if separate explicit user approval covers deployment configuration, update `vercel.json` to the minimum frozen configuration needed by the existing project while keeping public live analysis disabled. Otherwise leave `vercel.json` unchanged and report the approval blocker.
7. Run the local verification commands and prepared-checkpoint measurements. Record actual results rather than expected results.
8. Only after separate explicit user approval for deployment or production verification and coordinator confirmation of the approved deployed build, run the exact stable-URL five-rehearsal command. Do not deploy or change production settings implicitly as part of this step.
9. Perform all manual checks, update the release checklist from actual evidence, and inspect the final diff for unowned paths, secrets, private data, unstable claims, hidden failures, public-live enablement, provider calls, unsupported readiness claims, and accidental deployment changes.

## 11. Acceptance criteria

- The prepared-checkpoint measurement command completes without a live provider call and reports the fixture, checkpoint and replay versions, environment, warm-up, at least 20 measured samples, median, p95 where applicable, each frozen target, and explicit pass or miss.
- Performance tests detect incorrect warm-up inclusion, insufficient samples, wrong percentile calculation, missing checkpoint provenance, a hidden threshold miss, or an attempted live call.
- README gives a beginner-safe setup for the existing npm project and supported Node range, identifies the synthetic-only demo and replay labels, documents only server-side provider configuration names, and states that public live analysis and real data are not enabled.
- README contains no secret, private URL, account, billing, production-readiness, real-case, legal-validation, accessibility-conformance, zero-retention, anonymity, or provider-superiority claim.
- `RELEASE_CHECKLIST.md` maps each release gate to actual evidence and clearly distinguishes Passed, Failed, and Not run results plus required separate approvals.
- The checklist records the complete deterministic suite, golden and withdrawal flows, two export kinds, PDF or JSON parity, PII and log scans, accessibility automation and manual checks, performance budgets, system-card accuracy, dependency review, and public claims review.
- Public live analysis remains disabled in every owned release artifact. Replay remains visibly labelled and no release step automatically switches provider or replay.
- Any approved `vercel.json` change preserves the existing project architecture, Node target, safe route behavior, restrictive headers, replay path, and disabled public live analysis without introducing secrets or a new target.
- Actual deployment or any production-setting change occurs only under separate explicit user approval. This task never treats packet assignment, local verification, commit permission, or deployment rehearsal permission as interchangeable.
- The stable URL is not accessed before separate approval. After approval and confirmed deployment, the exact stable-URL command completes five consecutive prepared-checkpoint rehearsals and every run finishes within 2 minutes 45 seconds with blocked export and dependency recalculation intact.
- The stable production page and System Card match the actual build, provider enablement, release configurations, service tiers, retention limitations, replay state, checkpoint provenance, synthetic labels, and known limitations.
- Every required verification passes, or the task remains Partial or Blocked with the exact failed evidence. No failure is removed, weakened, or relabelled to claim release readiness.

## 12. Verification commands

Run from the repository root in this exact order:

```text
npm run verify
npm run test:e2e
npm run test:a11y
npm run measure:performance -- --mode prepared-checkpoint
npm run build
PLAYWRIGHT_BASE_URL=https://contextfirst-nexus.vercel.app npx playwright test tests/e2e/demo-rehearsal.spec.ts --repeat-each=5
```

The final stable-URL command is mandatory for a Complete handoff but must run only after separate explicit user approval for deployment or production verification and confirmation that the approved build is deployed. If approval is absent, do not run it, do not visit the URL, and report the task as Partial or Blocked.

## 13. Manual checks

1. Follow README from a clean local checkout using the documented Node range and npm workflow. Confirm a beginner can start the synthetic replay demo without a provider key and no instruction suggests browser-side credentials or real data.
2. Inspect every README environment name and release step. Confirm values are absent, live analysis is server-controlled and public-disabled, replay is local and labelled, Mistral remains admission-gated, and no provider is called best or guaranteed available.
3. Review the performance output on the MacBook Air M2. Confirm one warm-up is excluded, at least 20 same-environment runs are included, median and p95 are mathematically consistent, every target has a result, and a miss is visibly reported rather than averaged away.
4. Run the prepared checkpoint through the complete judged sequence with a stopwatch. Confirm Purpose and synthetic disclosure, coverage and masking, exact source, meaningful review, two early blockers, evidence withdrawal, reachable invalidation, renewed review, local export, audit, and one Safety Lab result remain visible and the flow finishes within 2 minutes 45 seconds.
5. Rehearse full-practitioner and minimum-necessary safe-share as separate off-camera purposes. Confirm both generate PDF and JSON from one manifest, contain the four labels, and preserve redaction and provenance without automatic transmission.
6. Inspect `RELEASE_CHECKLIST.md` line by line against command output and manual evidence. Confirm no check is marked complete from intention, no failed or not-run item is hidden, and each approval gate identifies what it does and does not authorize.
7. Inspect the production configuration only if its separate approval was granted. Confirm the existing Vercel target and Node runtime are preserved, public live analysis is disabled, no secret is in `vercel.json`, and replay remains available.
8. Only after separate approval and confirmed deployment, open `https://contextfirst-nexus.vercel.app` and run five consecutive prepared-checkpoint rehearsals. Confirm the stable URL serves the approved build, every rehearsal finishes within 2 minutes 45 seconds, no live provider transmission occurs, and no run loses the blocked-export or withdrawal moment.
9. On the approved stable build, compare the visible System Card, footer or release identity, synthetic labels, provider availability, retention limitations, replay and checkpoint provenance, and known limitations with the actual release checklist. Stop on any mismatch.
10. Inspect final Git status and diff. Confirm only the five owned paths changed, no credential or private data appears, no public-live setting was enabled, no stable-URL result was recorded without approval, and no deployment or push occurred implicitly.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `chore: prepare performance and release readiness`
- A commit does not authorize push, deployment, stable-URL access, public live analysis, credentials, spend, or any production-setting change.

## 15. Handoff requirements

Return a self-contained handoff containing:

- `Task: TASK-025, Performance, release readiness, and deployment rehearsal` and outcome `Complete`, `Partial`, or `Blocked`.
- Every changed path, listed exactly.
- The measurement, README, release-checklist, approved configuration, and rehearsal behavior now observable.
- Confirmation that synthetic-only data, prepared replay labels, no provider transmission in checkpoint mode, public-live-disabled default, separate approval gates, no secrets, truthful claims, and no hidden failures were preserved.
- Each acceptance criterion with its result.
- Each required command and manual check with `PASS`, `FAIL`, or `NOT RUN` and a reason for any unrun check.
- Performance environment, warm-up and measured counts, median and p95 results, frozen-target results, and five rehearsal durations when approved, without credentials or account details.
- The exact separate approvals that were present, and explicit confirmation that no unapproved deployment, production setting, stable-URL access, live analysis, spend, push, or credential action occurred.
- Every failed or not-run release gate with owning task or path, expected and observed result, and coordinator follow-up.
- The commit hash only if commit permission was present and used; otherwise `Not committed`.

## 16. Stop conditions

Stop and notify the coordinator if:

- TASK-024 is not integrated, its release checks are incomplete, or the base has an unresolved critical safety, security, privacy, accessibility, or end-to-end failure.
- The task graph and this packet disagree about title, dependency, owned paths, or verification commands.
- Any required package script, performance hook, checkpoint fixture, stable rehearsal spec, or frozen runtime interface is absent and would require an unowned file change.
- Completing the task requires editing application code, tests outside `tests/performance/`, contracts, fixtures, providers, state, package files, lockfiles, shared configuration, environment templates, or another unowned path.
- A current official source contradicts a frozen provider, framework, deployment, accessibility, security, or public-claim fact. Report the exact conflict for coordinated document and decision updates.
- A new dependency, environment variable, provider call, credential, account check, live-evaluation spend, cloud service, deployment target, or production setting appears necessary.
- Separate explicit user approval is absent for any deployment, production-setting change, `vercel.json` change that alters deployed behavior, stable-URL access, public live analysis, credential action, spend, commit, or push that the next step would require.
- The approved build is not confirmed at `https://contextfirst-nexus.vercel.app`; do not run the stable-URL check against an unknown or stale deployment.
- Any performance budget, rehearsal, deterministic check, accessibility check, security check, provider disclosure, System Card fact, or release claim fails or mismatches. Preserve the evidence and do not mark release ready.
- Any real or private data, credential, private URL other than the frozen public stable URL, raw provider diagnostic, secret-like value, unsupported readiness claim, or hidden failure appears.
