# TASK-038: Enforce replay-only public analysis gate

## 1. Task metadata

- Task ID: TASK-038
- Stage: release
- Status: Ready
- Wave: corrective release bridge before TASK-025 reconciliation
- Risk: high
- Suggested branch: `task/038-replay-only-analysis-gate`
- Depends on: TASK-015, TASK-026, TASK-037
- Graph outcome: Derive one fail-closed server live-analysis policy from the exact server environment flag, expose truthful disabled availability, and reject disabled POST requests before orchestration or provider work while preserving local replay.
- Suggested implementation commit message: `fix: enforce replay-only public analysis gate`

## 2. Goal

Restore the approved replay-only production boundary. Use one server-only policy for both `/api/analyze` and Trust data, report live analysis disabled unless the server flag is exactly enabled, and reject live POST requests before orchestration or provider work when that policy is disabled.

TASK-038 is an implementation-and-test bridge only. It must not deploy, access the stable URL, change an environment value, enable a provider, call a provider, or edit TASK-025 release evidence.

## 3. Confirmed production blocker

Production verification of the exact TASK-025 deployment found that:

- `GET /api/analyze` reports `liveAnalysisEnabled: true` because `app/api/analyze/route.ts` hardcodes the enabled availability branch.
- `POST /api/analyze` proceeds to `analyze(...)` without enforcing the server-side `ENABLE_LIVE_ANALYSIS` release gate.
- This contradicts the approved replay-only public release even though the static provider admission records currently leave each live option non-selectable.

The existing contracts already define the globally disabled availability branch and the contract-valid `LIVE_ANALYSIS_DISABLED` `rejected_before_run` response. TASK-038 must use those existing contracts rather than creating another response shape or policy owner.

## 4. Dependencies and base requirement

- TASK-015 must be integrated and provide the `/api/analyze` contract, same-origin and body-size boundaries, safe preflight response, orchestration entry point, and no-store JSON behavior.
- TASK-026 must be integrated and provide the static fail-closed provider admission projection.
- TASK-037 must be integrated and preserve the approved exact external Playwright target boundary.
- Start from the exact pushed coordinator baseline on which TASK-038 is Ready and TASK-025 is Blocked only by TASK-038.
- The earlier replay-only deployment and stable rehearsal approval does not authorize deployment during TASK-038 implementation.
- Public live AI, provider calls, credential or environment-value changes, admission promotion, billing, quota, firewall, and Vercel-setting changes remain forbidden.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-038.md` in full.
3. `PLANS.md` in full.
4. The TASK-015, TASK-025, TASK-026, TASK-037, and TASK-038 entries in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `tasks/TASK-015.md`, `tasks/TASK-026.md`, and `tasks/TASK-037.md` for API, admission, and release-boundary context.
7. `docs/CONTRACTS.md`: `AnalyzeAvailabilityResponse`, `AnalyzeResponse`, and safe-error sections.
8. `docs/ARCHITECTURE.md`: server-side live-analysis gate and provider-boundary sections.
9. `docs/SAFETY_AND_DATA.md`: public release, credential, provider-transmission, and safe-error boundaries.
10. `docs/TESTING_AND_EVALUATION.md`: API contract and no-provider-call requirements.
11. `docs/ORCHESTRATION_AND_INTEGRATION.md`: corrective ownership and worktree integration rules.
12. Git status and the complete current contents of every Section 6 path.

## 6. Exclusive write scope

- `app/api/analyze/route.ts`
- `lib/ai/server/live-analysis-policy.ts`
- `features/trust/trust-data.server.ts`
- `tests/contracts/api/analyze-route.test.ts`
- `tests/unit/ai/shared/live-analysis-policy.test.ts`

No other path may be created, edited, renamed, moved, generated, or deleted.

## 7. Corrective ownership transfer

- TASK-015 transfers corrective ownership of `app/api/analyze/route.ts` and `tests/contracts/api/analyze-route.test.ts` to TASK-038 only for the server live-analysis gate and its focused contract regressions.
- The integrated Trust implementation transfers corrective ownership of `features/trust/trust-data.server.ts` only to replace its private environment check with the shared server-only policy. Trust content, evidence, presentation, and evaluation artifacts remain frozen.
- TASK-038 owns the new shared policy `lib/ai/server/live-analysis-policy.ts` and its focused unit test `tests/unit/ai/shared/live-analysis-policy.test.ts`.
- TASK-026 admission records and provider registry behavior remain read-only. TASK-025 release evidence and every TASK-025-owned path remain frozen until TASK-038 is integrated and reverified by the coordinator.

## 8. Required behavior

### 8.1 One exact server-only policy

- Implement one shared server-only policy in `lib/ai/server/live-analysis-policy.ts`.
- The policy derives live availability only from `process.env.ENABLE_LIVE_ANALYSIS === "true"`.
- Missing, empty, `"false"`, case variants, whitespace variants, numeric-like values, and every other value resolve to disabled.
- `NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS` must never enable or override a server-disabled route, including when it is exactly `"true"`.
- Do not read credentials, provider enablement flags, admission records, client state, request data, or deployment metadata to decide the global server gate.
- The policy must be safe to import from server code and must not create a client-visible environment dependency.

### 8.2 Truthful GET availability

- `GET /api/analyze` must call the shared policy and pass its result to the existing availability projection.
- When the policy is disabled, return the existing contract branch with `liveAnalysisEnabled: false` and `replayEnabled: true`.
- OpenAI, Gemini, and Mistral options must all be structurally disabled and non-selectable, regardless of static admission or any public environment variable.
- Prepared local replay must remain available, selectable, deterministic, and `providerTransmission: false` through its existing trusted registry projection.
- Preserve provider display order, safe metadata, schema parsing, no-store response headers, content type, runtime, dynamic rendering, and route duration settings.

### 8.3 Disabled POST preflight

- Preserve existing same-origin, body-limit, and JSON-parse boundaries and their current response precedence.
- After those safe request checks and before calling `analyze(...)`, orchestration, an adapter, or any provider-facing work, evaluate the shared server-only policy.
- When disabled, return the existing contract-valid `AnalyzeResponse` preflight branch with:
  - `outcome: "rejected_before_run"`
  - `run: null`
  - empty `candidates`, `citations`, and `quarantined`
  - safe error code `LIVE_ANALYSIS_DISABLED`
  - the existing safe user message and an explicit non-sensitive policy-stage label
- Use the route's existing response builder, schema validation, status handling, no-store headers, and safe-error machinery.
- The disabled branch must not validate provider availability by calling an adapter, create a run, increment provider work, or make any network request.

### 8.4 Shared Trust projection

- Replace the private environment comparison in `features/trust/trust-data.server.ts` with the same shared server-only policy used by the API.
- Trust `SystemCard.liveAnalysisEnabled` and provider projections must therefore match the API for the same server environment.
- Preserve all Trust evidence, report identities and digests, guidance, checkpoint data, provider admission records, wording, ordering, and rendering behavior.
- Do not create a second policy function, duplicate environment parser, client-side fallback, or feature-local gate.

## 9. Required regression tests

### 9.1 Shared policy tests

Add focused isolated tests proving:

- Exact server value `"true"` enables the policy.
- Missing, empty, `"false"`, uppercase/mixed-case, whitespace-padded, numeric-like, and arbitrary values disable it.
- `NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS="true"` cannot enable the policy when `ENABLE_LIVE_ANALYSIS` is absent or disabled.
- Environment state is restored after every test and no test reads credentials, calls a provider, performs HTTP, or changes a real environment value outside the test process.

### 9.2 API contract tests

Extend the existing route contract suite to prove:

- Disabled-by-default GET reports `liveAnalysisEnabled: false`.
- All three live options are disabled and non-selectable while local replay remains available and selectable.
- A public client flag cannot override the disabled server policy.
- Disabled POST returns the exact `LIVE_ANALYSIS_DISABLED` `rejected_before_run` shape and appropriate existing preflight status.
- The orchestrator mock is not invoked, and no provider adapter or provider-facing work can be reached, while disabled.
- Existing same-origin, oversized-body, invalid-JSON, no-store, safe-error, and enabled-policy contract behavior remain intact.
- Tests use mocks only and make no real provider or external network request.

## 10. Frozen invariants and forbidden changes

- No provider call, credential read or change, environment-value change, admission promotion, public live AI enablement, deployment, stable-URL access, production rehearsal, billing change, quota change, firewall change, Vercel-setting change, or other cloud action occurs.
- Do not edit `.env.example`, environment files, Vercel metadata, provider adapters, registry, admission records, contracts, package files, fixtures, evaluation artifacts, deployment configuration, Playwright configuration, UI outside Trust data, or TASK-025 files.
- Do not modify TASK-025 release evidence before TASK-038 integration and coordinator verification.
- Do not weaken same-origin, request-size, JSON parsing, schema validation, no-store, safe-error, provider-admission, or replay trust boundaries.
- Do not add a dependency, client-side server-policy override, feature-local audit or policy owner, second environment parser, fallback-to-enabled behavior, provider health probe, or network-based configuration check.
- Do not make a real provider request or claim that implementation tests prove production deployment state.

## 11. Implementation steps

1. Confirm the TASK-038 worktree is clean, based on the exact pushed documentation baseline, and limited to Section 6 ownership.
2. Capture current GET, POST, same-origin, body-limit, JSON-parse, no-store, Trust, and registry behavior before editing.
3. Add the smallest server-only exact-value policy and focused environment-isolation tests.
4. Route GET, POST, and Trust through that one policy without changing contracts, registry logic, or provider admission.
5. Add API regressions for disabled availability, replay availability, public-flag non-override, disabled POST, and zero orchestrator/provider invocation.
6. Run every Section 13 command in order and inspect the complete diff for exactly the five owned paths.
7. Stop before deployment, stable access, TASK-025 evidence edits, provider work, or graph changes.

## 12. Acceptance criteria

- One server-only policy returns true only for exact `ENABLE_LIVE_ANALYSIS="true"` and false for every other state.
- `NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS` cannot enable a server-disabled route.
- Disabled GET is contract-valid, reports `liveAnalysisEnabled: false`, disables all live options, and preserves selectable prepared replay.
- Disabled POST returns the existing `LIVE_ANALYSIS_DISABLED` preflight rejection before orchestration, adapters, runs, or provider work.
- Same-origin, body-limit, invalid-JSON, no-store, schema-validation, status, and safe-error behavior remain intact.
- API and Trust consume the same policy and produce correlated global live-analysis state.
- Focused tests prove the orchestrator is never invoked while disabled and make no real provider request.
- All verification passes, exactly the five owned paths change, and no TASK-025 release evidence or deployment state changes.

## 13. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/contracts/api tests/unit/ai/shared
npm run typecheck
npm run lint
npm run build
npm run verify
git diff --check
```

All six commands must pass without credentials, provider calls, deployment, stable-URL access, or environment-setting changes.

## 14. Commit and handoff

- Commit only when the worker prompt explicitly authorizes it.
- Suggested implementation commit message: `fix: enforce replay-only public analysis gate`
- Report all changed files, exact environment cases, GET and POST projections, orchestrator/provider non-invocation evidence, Trust correlation, verification results, and confirmation that no TASK-025, package, contract, provider, evaluation, deployment, credential, environment, billing, quota, firewall, Vercel, or generated-artifact change occurred.
- TASK-025 may resume only after the coordinator integrates TASK-038, reruns the required checks, confirms the replay-only production projection, and explicitly updates graph readiness.

## 15. Stop conditions

Stop and notify the coordinator if:

- TASK-015, TASK-026, or TASK-037 is not integrated; TASK-025 is not blocked only by TASK-038; the graph and packet disagree; or the worktree is not clean at launch.
- The existing contracts cannot represent the disabled GET or POST branch, or safe rejection requires a contract, registry, provider, package, deployment, environment, or unowned-file change.
- Same-origin, body-limit, invalid-JSON, no-store, safe-error, static admission, local replay, Trust evidence, or provider ordering regresses.
- The route can call `analyze`, an adapter, or provider-facing work while disabled; a public flag can enable the route; or any non-exact server flag value enables it.
- Any real provider request, credential action, environment change, deployment, stable access, production rehearsal, billing, quota, firewall, Vercel-setting action, TASK-025 evidence edit, unsupported release claim, or unrelated change appears.
