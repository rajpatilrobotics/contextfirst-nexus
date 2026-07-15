# ContextFirst Nexus Agent Rules

## 1. Purpose

This file gives every Codex task the same safe working rules for ContextFirst Nexus.

The repository is a responsible-AI hackathon prototype for source-grounded case preparation. It is not a general document chatbot, a legal decision-maker, or a production case system.

## 2. Read before changing anything

Every implementation task must read, in this order:

1. This `AGENTS.md`.
2. The assigned `tasks/TASK-XXX.md` packet.
3. `PLANS.md`.
4. The assigned task entry in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md`.
6. Every remaining document listed under Required context in the task packet, in packet order.
7. Git status and the current versions of every file the task is allowed to edit.

Do not rely on chat history, private parent-folder notes, or assumptions from another worktree.

## 3. Documentation authority

When two instructions appear to conflict, use this authority order:

1. `docs/SAFETY_AND_DATA.md` controls safety, privacy, human-rights, data, and public-claims rules.
2. `PROJECT_BRIEF.md` controls product direction, scope, users, and non-goals.
3. `docs/PRODUCT_SPEC.md` controls user-facing behavior.
4. `docs/CONTRACTS.md` controls shared names, types, schemas, states, IDs, API behavior, and invariants.
5. `docs/ARCHITECTURE.md` controls modules, routes, runtime boundaries, dependencies, and persistence.
6. `docs/MODEL_ROUTING.md` controls provider admission, selection, disclosure, and recovery inside the approved architecture.
7. `docs/DEMO_AND_FIXTURES.md` controls the synthetic story, stable fixture IDs, expected behavior, and judged demo sequence.
8. `docs/DESIGN_SYSTEM.md` controls visual language, interaction patterns, component names, responsive behavior, and accessibility targets.
9. `docs/TESTING_AND_EVALUATION.md` controls verification, evaluation, and release gates.
10. `docs/SOURCE_REGISTER.md` controls which public sources may support product requirements and public framing.
11. `decision-log.md` records approved decisions but cannot weaken a higher-authority document.
12. `TASK_GRAPH.yaml` and the assigned task packet control task scope, dependencies, and file ownership but cannot override shared product truth.

If a conflict remains, stop. Report the exact documents and statements involved. Do not choose a convenient interpretation or silently change a contract.

## 4. Frozen P0 boundary

All workers must preserve these boundaries:

- The only enabled P0 case input is the bundled fictional adult fixture `CFN-DEMO-001`.
- Do not add arbitrary upload, real case data, child cases, survivor self-service, live investigation, scraping, biometrics, cross-case profiling, or automated external contact.
- The system organizes and suggests. A qualified practitioner makes every consequential review decision.
- Do not add victim, trafficking, credibility, guilt, eligibility, priority, case-strength, dangerousness, or overall-risk scores.
- Do not turn international guidance into domestic law or case evidence.
- Do not add bulk approval or a critical export-gate override.
- Unknown, conflicting, insufficient-evidence, citation-unresolved, and not-processed states are valid outcomes.
- Every source-supported consequential item must remain traceable to an exact or manually resolved citation.
- Evidence nature, item origin, support status, and review status must remain separate.
- Evidence withdrawal must invalidate only reachable downstream decisions and revoke export readiness.
- Final PDF and JSON outputs must come from the same reviewed, redacted, purpose-bound manifest.

## 5. Provider and credential rules

P0 contains three live-provider release configurations and one separate replay path:

1. OpenAI `openai-quality-v1`, model `gpt-5.6-sol`, reasoning effort `medium`.
2. Google Gemini `gemini-quality-v1`, model `gemini-3.5-flash`, unpaid synthetic-only tier.
3. Mistral `mistral-small-free-v1`, model `mistral-small-2603`, unpaid synthetic-only tier, reasoning effort `medium`.
4. Local `prepared-replay-v1`, visibly labelled bundled deterministic replay, not live AI.

Mandatory rules:

- Provider and replay display order is OpenAI, Gemini, Mistral, then replay.
- The order is presentation order only. It is never an automatic attempt chain.
- No silent cross-provider fallback, silent replay substitution, output merging, or safety-result shopping is allowed.
- Replay and checkpoint commands accept only their frozen trusted registry IDs. Never add a browser-supplied bundle, URL-loaded artifact, environment-selected artifact, persisted model output, or provider-generated checkpoint.
- A provider switch requires an explicit user action, the new provider disclosure, a new acknowledgement, and a separate linked run.
- A refusal, privacy block, citation failure, prohibited output, injection propagation, schema failure, or semantic-safety failure must not offer provider switching as a bypass.
- Gemini and Mistral unpaid configurations may receive only the exact allowlisted bundled fixture after server verification.
- Mistral remains unselectable until the exact frozen release has a matching passed reviewed static admission record and is available to the deployed account.
- All API keys remain server-side. Never put a key in source code, a tracked file, browser code, a URL, a task packet, a log, an error, an export, or chat.
- Never accept provider keys from an end user through the browser.
- Do not pool, share, round-robin, or rotate personal, friend, college, or multi-account keys to evade quotas, rate limits, billing, or provider restrictions.
- Multiple credentials may not be added as a quota-expansion mechanism. Security replacement requires a separately approved rotation design.
- A worker must not change cloud billing, provider accounts, quotas, environment values, production settings, Vercel settings, or deployment targets without explicit user approval.

## 6. Parallel worktree rules

Each implementation packet is one separate Codex task, branch, and worktree.

- Start only when every dependency in `TASK_GRAPH.yaml` is satisfied.
- Edit only the files listed under Exclusive write scope in the assigned packet.
- Read-only inspection outside that scope is allowed when needed.
- Do not edit a shared file because it would be convenient.
- Do not install a package, change `package.json`, change the lockfile, or edit shared tool configuration unless the packet explicitly owns the approved dependency change.
- Do not change shared contracts, architecture, product scope, fixture IDs, design tokens, environment names, or deployment behavior unless the packet explicitly owns an approved change.
- Do not copy another worktree's unmerged files into the current worktree.
- Do not merge, rebase, push, deploy, or close another task from a feature worktree.
- If an unlisted file must change, stop and request a scope amendment from the coordinator.

Exclusive file ownership prevents merge conflicts. It does not authorize a worker to ignore higher-level contracts.

## 7. Planning and approval

`plan.md` is the coordinator-owned project checkpoint during parallel execution. Feature workers must not edit it unless their task packet explicitly assigns that file.

An approved task packet is the feature worker's task-local plan. Before coding, the worker must:

1. Confirm the task goal and dependencies.
2. Confirm the exclusive write scope.
3. Inspect the relevant existing files and user changes.
4. Restate the smallest implementation sequence in the task update.
5. Stop for coordinator approval if the packet is missing, contradictory, or materially incomplete.

Small implementation details inside an approved packet do not require a new approval. A scope, contract, dependency, provider, security, data-flow, or architecture change does.

Follow `PLANS.md` for task execution and handoff behavior.

## 8. Code and data quality

- Use the current Next.js App Router, React, TypeScript, and Tailwind structure.
- Keep domain logic out of route page components.
- Import canonical shared contracts from `lib/contracts`. Do not create competing local types.
- Keep provider adapters and prompts server-only.
- Treat model output and document text as untrusted.
- Render case content as escaped React text. Do not use `dangerouslySetInnerHTML`.
- Keep functions small and names clear enough for a beginner to follow.
- Handle loading, empty, warning, blocked, error, unknown, insufficient-evidence, and success states explicitly.
- Add comments only when they explain why a safety or domain rule exists.
- Do not claim a feature, test, accessibility result, model quality result, or security property that was not actually implemented and verified.

## 9. Verification

Run the smallest relevant checks during implementation, then every command required by the task packet.

Common checks are:

```text
npm run typecheck
npm run lint
npm run test:unit
npm run test:contracts
npm run test:components
npm run test:e2e
npm run test:a11y
npm run eval
npm run build
```

Do not run live model evaluation unless the task explicitly authorizes it, current pricing has been checked, and the user has approved the estimated spend. Never hide a failing test, weaken an assertion, remove a fixture, or change an expected result merely to make a check pass.

## 10. Git and destructive actions

Before editing, inspect Git status and preserve existing user work.

Never, without explicit approval:

- delete user files, branches, repositories, or data;
- run destructive Git or filesystem commands;
- force push;
- modify files outside the repository;
- run `sudo` or install global tools;
- commit secrets or private research;
- change production infrastructure or billing.

Do not commit unless both the opening task prompt and the assigned task packet explicitly permit a commit. Use the exact commit message from the packet when one is provided. Otherwise hand off an uncommitted verified diff.

## 11. Required handoff

Every worker handoff must report:

1. Task ID and outcome.
2. Exact files changed.
3. User-visible behavior added or changed.
4. Contract and safety invariants preserved.
5. Verification commands run and their results.
6. Any tests not run and why.
7. Open blockers, assumptions, or follow-up work.
8. Commit hash only when committing was explicitly permitted.

Do not say complete when acceptance criteria remain unmet. Do not leave undocumented follow-up work for the integrator to discover.
