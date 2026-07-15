# TASK-018: Purpose, provider selection, and recovery UI

## 1. Task metadata

- Task ID: TASK-018
- Stage: interface
- Status: Pending. Only the coordinator may mark this task Ready after every dependency is integrated.
- Wave: 9
- Risk: high
- Suggested branch: `task/018-purpose-provider-ui`
- Depends on: TASK-004, TASK-010, TASK-015, TASK-017

## 2. Goal

Implement the complete Case Purpose Brief, explicit live-provider or replay selection, provider-specific disclosures and acknowledgements, safe unavailable states, a single analysis run controller, and explicit operational recovery UI with no automatic fallback or safety-result shopping.

## 3. Why this task exists

Provider choice changes who receives approved redacted synthetic content, which service terms apply, and what run provenance is recorded. The practitioner must state an authorized purpose, understand the limits, make one explicit selection, acknowledge that exact release, and retain control over every retry, provider switch, or replay action. One controller must bridge browser-owned lifecycle commands to the stateless live route without leaking recovery linkage into the request.

## 4. Dependencies and base requirement

- TASK-004 must be integrated and provide accessible form, field-error, alert, radio, card, status, and dialog primitives.
- TASK-010 must be integrated and provide canonical Case Purpose Brief commands, pending live-analysis state, locally validated recovery linkage, case revision, audit events, run history, active-run selection, local replay, checkpoint loading, and export-readiness invalidation.
- TASK-015 must be integrated and provide the safe `GET /api/analyze` availability projection, stateless `POST /api/analyze` unions, exact recovery options, terminal live execution results without recovery metadata, and no-secret error contract.
- TASK-017 must be integrated and provide the case layout, persistent synthetic banner, navigation, status header, and global Trust and Safety destination.
- Create the worktree from the latest coordinator branch containing all four integrated dependencies and their passing verification. Do not use unmerged worktree output or recreate their interfaces.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-018.md` in full.
3. `PLANS.md` in full.
4. The TASK-018 entry in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `decision-log.md` in full.
7. `PROJECT_BRIEF.md`: The proposed solution, Primary user, End-to-end prototype flow, Prototype scope, Product principles, and Success criteria.
8. `docs/PRODUCT_SPEC.md`: Sections 3 through 6, 7.1 through 7.5, 9, 10, and 11.
9. `docs/CONTRACTS.md`: Sections 2, 4.7, 5, 16, 17, 18, 24, 25, and 26.
10. `docs/ARCHITECTURE.md`: Sections 6, 7, 8.1, 8.4, 9, 11 through 15, and 16.
11. `docs/MODEL_ROUTING.md`: Sections 5 through 11 and 13.
12. `docs/DESIGN_SYSTEM.md`: Sections 5 through 8, 9.1 through 9.3 including ProviderRecoveryPanel, 10, 11, 12, and 13.
13. `docs/SAFETY_AND_DATA.md` in full.
14. `docs/DEMO_AND_FIXTURES.md`: Sections 3, 4, 11, 13, 14, and 17.
15. `docs/TESTING_AND_EVALUATION.md`: Sections 7.2, 9, 10.3, 13, 14.1, 14.4, 21, and 22.
16. `docs/SOURCE_REGISTER.md`: TECH-014 through TECH-036 and Sections 9 through 11.
17. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4, 6, 7, 9, 12, 13, and 16.
18. The current contents of every path in the Exclusive write scope.

## 6. Exclusive write scope

- `app/case/demo/purpose/page.tsx`
- `features/purpose/`
- `features/analysis/provider-selection/`
- `features/analysis/provider-recovery/`
- `features/analysis/run-controller/`
- `tests/components/purpose/`
- `tests/components/provider/`

No other path may be created, edited, renamed, moved, or deleted.

## 7. Read-only context allowed

- `components/ui/`
- `components/status/`
- `components/shell/`
- `lib/contracts/`
- `lib/state/`
- `lib/ai/server/`
- `app/api/analyze/route.ts`
- `lib/analysis/replay.ts`
- `fixtures/replay/`
- `fixtures/cases/`
- `lib/fixtures/`
- `.env.example`
- `package.json` and shared test configuration, only to understand installed interfaces and commands

Provider server code, contracts, registry data, state logic, environment files, and fixtures are read-only.

## 8. Out of scope

- Editing the analysis route, provider registry, prompt, provider adapters, replay data, reducer, audit engine, export gate, shared contracts, global shell, design primitives, package files, or environment configuration.
- Testing provider health by sending case content from `GET /api/analyze` or making any automatic provider request.
- Accepting browser-supplied models, endpoints, keys, service tiers, disclosure text, raw provider errors, or arbitrary recovery choices.
- Letting a page or presentation component build an `AnalyzeRequest`, call `POST /api/analyze` directly, attach recovery metadata, mutate run history, or execute replay outside the run controller and canonical reducer commands.
- Adding a fourth live provider, changing the OpenAI, Gemini, Mistral, replay order, recommending a provider without measured evidence, or making replay look like live AI.
- Enabling a provider, changing credentials, checking account details, changing billing or quota, running paid live evaluation, or modifying cloud or production settings.
- Allowing real, private, client, survivor, child, harmless-public, uploaded, or user-entered narrative data in P0.
- Implementing intake extraction, masking mechanics, review workspace, export rendering, Trust page, or production authentication.

## 9. Frozen contracts and invariants

- `DataOrigin` is only `bundled_synthetic`; the only case is `CFN-DEMO-001` fixture version `1.0.0`.
- No live provider or replay is preselected. The required visible order is OpenAI, Google Gemini 3.5 Flash, Mistral Small 4, then a visually separate `Bundled deterministic replay, not live AI` option.
- Live release IDs and exact models are `openai-quality-v1` with `gpt-5.6-sol`, `gemini-quality-v1` with `gemini-3.5-flash`, and `mistral-small-free-v1` with `mistral-small-2603`. Replay is `prepared-replay-v1` and local.
- Options come from the safe registry projection. Only an evaluated, enabled, configured, data-policy-eligible release with a current disclosure is selectable. A configured key is not proof of provider health.
- Mistral remains visibly unavailable with an Admission required explanation until the exact release has matching passed reviewed static admission, coordinator-recorded deployed-account availability, and explicit enablement. Free Mistral is limited to the exact bundled fixture and must disclose actual training-use or opt-out state, up-to-30-day abuse-monitoring retention, and no free zero data retention.
- Unpaid Gemini is limited to the exact bundled fixture and discloses possible product-improvement use and human review under applicable terms. No option is described as best, safest, free forever, guaranteed available, zero retention, or suitable for real data.
- The Case Purpose Brief uses the canonical `CasePurposeBrief` schema. It includes role, organization type, supported workflow, short stated purpose, every excluded decision, fictional jurisdiction, source language and translation status, intended recipient, deterministic intended recipient category, one requested export kind, authority fields, cooperation neutrality, selected release, and exact matching acknowledgement.
- The system states that it cannot verify authority. For the synthetic fixture, authority basis and consent status remain `not_applicable_synthetic_fixture`; no false survivor-consent claim is required.
- `statedPurpose` and `intendedRecipient` remain length-limited plain text in browser-local state and are never sent in the model request. `intendedRecipientCategory` is a required enum value and is the only deterministic safe-share recipient scope used by export gates.
- Processing or replay loading remains blocked until every required purpose field, authority attestation, synthetic-data acknowledgement, prohibited-decision acknowledgement, cooperation-neutrality acknowledgement, release choice, and matching provider or replay acknowledgement is complete.
- Acknowledgement is exact to provider, release configuration, service tier, disclosure version `1.0.0`, retention and training-use disclosure, and data flow. Changing release or moving between live and replay clears the old acknowledgement and invalidates export readiness.
- Saving and changing purpose uses TASK-010 commands and audit events. Components do not set case status, run state, audit records, or gate readiness directly.
- `features/analysis/run-controller/` is the only client feature that builds the strict ID/mask-only `AnalyzeRequest`. It includes no raw content, free-text purpose, direct identifier, or `recoveryOfRunId`.
- For live execution, the controller dispatches `start_live_analysis(request, recoveryOfRunId local)` before transport. If that transition is rejected, it sends no request. If accepted, it makes exactly one `POST /api/analyze` call and never retries or switches providers itself.
- The controller maps `outcome: succeeded` only to `complete_live_analysis(startCommandId, succeeded response)`, `outcome: failed` only to `fail_live_analysis(startCommandId, failed response)`, and `outcome: rejected_before_run` only to `reject_live_analysis_preflight(startCommandId, rejected response)`.
- A fetch rejection, missing response, or response-envelope parse failure maps only to `record_live_analysis_transport_failure(startCommandId, reasonCode)`. It clears pending state through TASK-010, states that the remote outcome is unknown and no output was accepted, preserves the prior active run, and creates no run or recovery link.
- Deterministic replay is executed locally through `run_deterministic_replay(request)` naming only trusted bundle ID `REPLAY-CFN-DEMO-001-V1` and never calls `POST /api/analyze`. The controller cannot supply a bundle object, URL, persisted artifact, or provider output. It does not attach recovery metadata; TASK-010 validates the local link, resolves the compile-time registry entry, and owns run creation and activation.
- A retry, live-provider switch, or replay action never starts automatically. Same-provider retry, eligible live alternatives, replay, and Return to Purpose render from the safe `AnalysisRecoveryOption` contract in display order `0` through `5` without renumbering.
- Eligible provider switches are limited to documented operational failures. A switch requires an explicit selection, the new full disclosure, a fresh acknowledgement, and a separate run. Started failed runs remain visible; outputs from runs are never merged.
- A preflight rejection has `outcome: rejected_before_run`, `run: null`, and a safe audit event. UI must not invent a failed run.
- Invalid or prohibited input, privacy leak, provider refusal, prompt-injection propagation, prohibited conclusion, invalid citation, invalid structured response, or semantic-safety failure must not offer provider switching as a bypass.
- Errors show a safe category, affected selected release when applicable, local request reference, and next safe action. They never show credentials, secret names, key fragments, account or billing details, project identifiers, source content, request content, raw provider diagnostics, or stack traces.
- Replay requires acknowledgement that it is frozen local output with no provider transmission. `DEMO-CHECKPOINT-REVIEW` is a prepared replay-based state with fixture-reviewer provenance, not a third analysis mode, live output, or prior user session.

## 10. Implementation steps

1. Inspect Git status, owned files, canonical purpose and provider contracts, the state command surface, the pending live-analysis contract, the availability endpoint projection, and safe terminal response and recovery unions. Stop if any required dependency is absent or incompatible.
2. Implement the Purpose route and `CasePurposeBriefForm` using canonical types, accessible fieldsets and legends, one focused error summary, linked inline errors, and no local contract duplication.
3. Implement `ProviderSelectionPanel` from the safe option projection, preserving exact order, unselected initial state, release-specific disclosure, truthful unavailable reasons, synthetic-only labels, and matching acknowledgement behavior.
4. Wire save, purpose change, provider change, replay selection, and checkpoint selection only through the integrated state commands. Ensure purpose or release changes stale the appropriate gate through state rather than component mutation.
5. Implement the analysis run controller. Build only the canonical ID/mask-only request, dispatch start before one live POST, block transport on an invalid transition, correlate each terminal union with its start command, map a missing or invalid response to the canonical transport-failure command, and execute replay locally.
6. Implement `ProviderRecoveryPanel` from safe error and recovery contracts. Preserve failed-run or preflight provenance, require explicit action and fresh disclosure where required, pass recovery linkage only to local commands, and omit alternate-provider actions for safety failures.
7. Add focused tests for the required fields and acknowledgements, error-summary focus, exact order, selectability, Mistral evaluation state, replay labels, disclosure reset, request minimization, start-before-POST order, no transport on invalid start, one-POST limit, terminal response mapping, fetch and envelope failures, local replay, operational recovery matrix, no-switch safety matrix, no automatic action, safe errors, failed-run preservation, preflight behavior, and single-run separation.
8. Run every verification command, complete the manual checks, and inspect the final diff for unowned files, secrets, unsupported provider claims, raw diagnostic text, accidental auto-selection, direct route calls outside the controller, and contract drift.

## 11. Acceptance criteria

- `/case/demo/purpose` presents the one bundled synthetic case and a complete canonical Case Purpose Brief with accessible labels, fieldsets, legends, inline errors, and a focused linked error summary.
- An untouched form has no selected provider or replay and cannot save or begin processing. Each missing required field or acknowledgement produces a specific visible error.
- The analysis choices render exactly OpenAI, Gemini, Mistral, and replay in that order from the safe projection, with model, tier, content categories, data use, retention limitation, known limits, last verification, and current availability.
- Only eligible options are selectable. Mistral's exact release is visibly unavailable while reviewed static admission is not passed or deployed-account availability is not confirmed; unavailable cards expose no secret, account, billing, environment, or raw provider detail.
- Unpaid Gemini and free Mistral show their exact synthetic-only and data-use limitations. Replay is visually separate, says no provider transmission, and is always labelled not live AI.
- Saving succeeds only with all canonical fields, the complete excluded-decision set, authority and synthetic attestations, cooperation neutrality, one export kind, one selected release, and that release's current acknowledgement.
- The saved purpose appears through canonical state and audit history. Changing purpose, export kind, provider, or mode clears stale acknowledgement and invalidates export readiness through TASK-010.
- The run controller builds a strict request from allowlisted IDs, fixed purpose context, and approved mask records only. The request contains no free-text purpose, raw content, direct identifier, or recovery linkage.
- A live action dispatches a valid start before exactly one POST. An invalid or stale start causes no network call, and each terminal response union dispatches only its matching completion, failure, or preflight-rejection command. A fetch rejection or invalid envelope dispatches only the matching transport-failure command and leaves no pending request or invented run.
- Replay dispatches `run_deterministic_replay` locally with the fixed trusted ID and no POST. No component or controller supplies replay content, attaches recovery metadata, or directly appends or activates a run.
- An eligible operational failure shows only safe recovery actions from the API contract, starts nothing automatically, and requires a fresh acknowledgement before a selected alternate live run.
- A started failed run remains visible after retry, switch, or replay. A preflight rejection shows no invented run. Separate run outputs are never merged.
- Refusal, privacy, citation, injection, prohibited-output, structured-response, and semantic-safety failures show no provider-switch bypass.
- Provider and purpose tests assert safe loading, unavailable, blocked, error, awaiting-acknowledgement, replay-active, checkpoint-active, and success states without blank success.
- The route remains keyboard operable and reflows at 320 CSS pixels and 200 percent zoom with visible focus and no essential horizontal scrolling.

## 12. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/components/purpose tests/components/provider
npm run build
```

## 13. Manual checks

1. Open `/case/demo/purpose` with fresh case state and submit without completing it. Confirm focus moves to the error summary, each summary link focuses its field, no analysis choice was preselected, and processing remains blocked.
2. Select Bundled deterministic replay, review its disclosure, complete every required field and acknowledgement, and save. Confirm the brief is shown as complete, replay remains labelled not live AI, and no provider transmission claim appears.
3. Return to the analysis choices and select each projected live option in order. Confirm each card shows its own model, tier, data flow, data-use terms, retention limitation, and acknowledgement, and selecting a different release clears the prior acknowledgement.
4. Inspect Mistral while static admission or deployed-account availability is incomplete. Confirm `mistral-small-2603` and Admission required are visible, the option is not selectable, and no key, account, project, billing, or raw error detail is shown.
5. Exercise the run controller with one valid live action. Confirm the local start command succeeds before exactly one POST, the request contains only canonical IDs, fixed purpose context, and approved masks, and the terminal union maps to exactly one matching reducer command.
6. Exercise a stale or otherwise invalid start. Confirm no POST occurs. Select replay and confirm the controller dispatches local `run_deterministic_replay` with no POST.
7. In the provider component fixture, present a started timeout or quota failure. Confirm the failed run remains visible, no recovery starts on render, eligible choices keep registry order with replay last, and choosing another live release pauses for its new acknowledgement before dispatch.
8. In the same fixture, present a preflight not-configured rejection. Confirm there is a safe event but no invented run. Then present a refusal, privacy leak, invalid citation, invalid structured response, and semantic-safety failure one at a time and confirm no alternate-provider bypass is offered.
9. Simulate a network rejection, missing response, and invalid response envelope after a valid start. Confirm each dispatches the exact safe transport-failure reason, clears pending state, shows unknown remote outcome and no accepted output, preserves the prior active run, and creates no run or recovery link.
10. Complete the Purpose route by keyboard, then inspect it at 320 CSS pixels and 200 percent zoom. Confirm disclosure text, errors, selection cards, and actions remain readable, ordered, and operable.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add purpose provider selection and recovery UI`

## 15. Handoff requirements

Return a self-contained handoff containing:

- `Task: TASK-018, Purpose, provider selection, and recovery UI` and outcome `Complete`, `Partial`, or `Blocked`.
- Every changed path, listed exactly.
- The purpose, selection, acknowledgement, unavailable-state, run-controller, and recovery behavior now observable.
- Confirmation that provider order, explicit choice, minimized request data, start-before-POST order, no unsafe transport, local replay, synthetic-only data, no automatic fallback, no safety bypass, no run merging, safe-error, and server-only credential invariants were preserved.
- Each acceptance criterion with its result.
- Each required command and manual check with `PASS`, `FAIL`, or `NOT RUN` and a reason for any unrun check.
- The exact provider state or error fixture used for each recovery manual check, without sensitive content.
- Any dependency, contract, fixture, registry, provider, or state blocker requiring coordinator action.
- The commit hash only if commit permission was present and used; otherwise `Not committed`.

## 16. Stop conditions

Stop and notify the coordinator if:

- Any dependency is not integrated, the availability or state contract is missing, or the base branch cannot build the integrated interfaces.
- The task graph and this packet disagree about title, dependencies, owned paths, or verification commands.
- Completing the UI requires an edit to the API route, registry, adapter, prompt, state reducer, audit engine, replay fixture, shared contract, shell, primitive, package file, environment file, or another unowned path.
- A required provider, release, disclosure, recovery, purpose, fixture, or checkpoint contract is absent or contradicts a higher-authority document.
- The implementation would need a new dependency, environment variable, provider, endpoint, browser key input, raw-text request field, or cloud setting.
- A provider would need to be enabled, called for health, billed, supplied credentials, or changed in a local or production environment.
- An automatic provider attempt, silent replay substitution, cross-run merge, safety-result bypass, or non-synthetic input appears necessary.
- A page or presentation component would need to call the route directly, place `recoveryOfRunId` in `AnalyzeRequest`, attach recovery metadata, dispatch a terminal command without a successful start, or call replay through the live route.
- Any real or private data, credential, account detail, private URL, raw provider diagnostic, unsupported provider claim, or secret-like value appears.
- Verification reveals an upstream route, registry, state, or contract defect. Report the smallest safe reproduction and do not patch the dependency from this task.
