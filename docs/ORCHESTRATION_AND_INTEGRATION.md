# Orchestration and Integration

## 1. Purpose

This document defines how ContextFirst Nexus is implemented through separate Codex worktree tasks without forcing every feature into one long sequential task.

The method uses a rolling pool:

- launch several independent ready tasks;
- integrate completed prerequisites as soon as they pass review;
- refill open worktree slots with newly ready tasks;
- keep shared files under one owner at a time;
- run complete verification at integration checkpoints.

Parallel work reduces waiting only when dependencies and file ownership are respected. It does not permit workers to guess missing contracts or edit the same files concurrently.

## 2. Roles

### Coordinator

The coordinator:

- maintains `plan.md`, `PLANS.md`, `TASK_GRAPH.yaml`, and task readiness;
- selects which tasks may start;
- confirms that dependencies are integrated, not merely completed in another worktree;
- prevents overlapping file ownership;
- resolves specification questions or records them in `decision-log.md`;
- tells the user which manual Codex task to create next.

### Worker

One worker owns one bounded `TASK-XXX` packet in one worktree. The worker:

- reads only the required shared context plus the assigned files;
- edits only its declared ownership paths;
- runs the packet's verification;
- reports a self-contained handoff;
- does not start, assign, or assume the next task.

### Integrator

The integrator may be the coordinator or a dedicated task. The integrator:

- reviews the handoff and diff;
- checks ownership and dependency assumptions;
- integrates one compatible change set at a time;
- runs the required integration checks;
- updates task status only after the change is present on the integration branch.

## 3. Sources of execution truth

Use these files together:

1. `TASK_GRAPH.yaml` answers what depends on what, which paths a task owns, and whether it is ready.
2. `tasks/TASK-XXX.md` gives the worker's exact outcome, context, scope, acceptance criteria, and verification.
3. `docs/CONTEXT_INDEX.md` routes the worker to the minimum authoritative context.
4. `PLANS.md` defines how implementation plans are written and updated.
5. This document defines scheduling and integration behavior.

Chat history is not execution truth. If a task packet and task graph disagree, the task is blocked until the coordinator fixes them.

## 4. Task readiness

A task is `ready` only when all of these conditions are true:

- every declared dependency is integrated into the branch from which its worktree will be created;
- every dependency passed its required verification;
- no active task owns any of the same write paths;
- its shared contracts are frozen and available;
- its task packet names exact allowed and forbidden paths;
- required dependencies and fixtures already exist;
- any required package is already installed by the dependency-bootstrap task;
- no unresolved decision would materially change the implementation;
- the documentation package is approved and pushed, and every task-specific approval is present.

`Completed in another worktree` is not the same as `integrated`. A dependent task must not start from a branch that cannot see its dependency.

## 5. Rolling parallel scheduling

### 5.1 Scheduling rule

The coordinator maintains a ready queue from the acyclic task graph. At each scheduling check:

1. Remove tasks whose dependencies are not integrated.
2. Remove tasks whose write paths overlap an active task.
3. Prefer tasks on the critical path.
4. Prefer a balanced mix of domain, UI, fixture, and test work when their dependencies permit it.
5. Fill only the number of worktree slots that the laptop can run comfortably.
6. When one task finishes and is integrated, recompute readiness immediately.
7. Offer the user the next highest-value ready task for manual launch.

The initial concurrency should be conservative on the MacBook Air M2. Start with three worker worktrees plus the coordinator. Increase only after checking memory use, build speed, and responsiveness. The graph may contain 20 or more tasks even when only a few are active at once.

### 5.2 Rolling example

If tasks A, B, C, and D are independent and ready, they may run together. If B finishes first and task E depends only on B, E becomes eligible only after B is integrated. E may then fill B's open slot while A, C, and D continue.

The coordinator does not wait for an entire wave when a newly ready task can run safely. It also does not launch a task early merely to keep every slot occupied.

### 5.3 No automatic next-task spawning

Workers must not create another Codex task, spawn the next worktree, or begin a follow-on packet automatically.

After a handoff:

1. the coordinator reviews and integrates the result;
2. the coordinator recomputes the ready queue;
3. the coordinator recommends the next task;
4. the user manually creates or approves that task in Codex.

This pause keeps the user in control and prevents stale worktrees from branching before their dependencies are integrated.

## 6. Exclusive file ownership

### 6.1 Ownership rule

Every task packet and task-graph entry must declare exact write paths. A path can have only one active writer.

A worker may read any required repository file but may edit only:

- its declared `owned_paths`;
- newly created files inside a declared owned directory;
- a shared file explicitly granted to that task as its exclusive owner.

An ownership declaration such as `features/review/**` does not grant permission to edit `lib/contracts/**`, `package.json`, global CSS, or another feature directory.

### 6.2 High-conflict files

The following files or surfaces require a dedicated exclusive owner:

- `package.json` and `package-lock.json`;
- framework, TypeScript, lint, test, and Playwright configuration;
- `components.json` and shared base UI primitives;
- `app/layout.tsx`, global styles, middleware, and deployment configuration;
- `lib/contracts/**`;
- the provider release registry and common analysis route orchestration;
- fixture manifests and stable fixture IDs;
- root case-state and reducer contracts;
- canonical export manifest construction;
- `TASK_GRAPH.yaml`, `PLANS.md`, and shared documentation.

The dependency-bootstrap task is the only task that may install packages or modify the package manifest and lockfile during bootstrap. A later dependency change requires a new approved exclusive task.

### 6.3 Ownership conflict

If a worker discovers that its result requires a forbidden path:

1. stop before editing that path;
2. describe the smallest required interface or change;
3. report the owning task or path;
4. let the coordinator add a dependency, create a small bridge task, or revise ownership;
5. resume only after the updated packet is approved.

Do not solve an ownership conflict by copying shared code into a feature directory.

### 6.4 Dependency-ordered ownership transfer

A later task may edit a path previously owned by an integrated task only when all of these conditions hold:

- the later task transitively depends on the earlier owner;
- both task packets explicitly declare the transfer;
- `TASK_GRAPH.yaml` lists the path for both tasks and records the dependency;
- the earlier task is integrated before the later task is marked ready;
- the two tasks are never active concurrently.

The P0 graph uses this rule only for `lib/ai/server/admission.ts`: TASK-011 creates the fail-closed record and TASK-026 later records the reviewed static evidence handoff after TASK-016. This is not shared concurrent ownership.

## 7. Shared-contract freeze

The product-truth documents listed in `docs/CONTEXT_INDEX.md` and the implemented shared schemas are frozen interfaces during parallel feature work.

A feature worker must not:

- rename a shared enum, identifier, route, component contract, fixture ID, or error code;
- add a competing local type for convenience;
- widen an API request with raw text, direct identifiers, arbitrary providers, or browser-supplied model settings;
- weaken provider, review, citation, privacy, or export gates;
- change the frozen provider order or create automatic fallback;
- add a dependency without an approved bootstrap or dependency task.

When a contract change is genuinely necessary:

1. stop every dependent task that would be affected;
2. record the proposed change and reason in `decision-log.md`;
3. identify affected contracts, fixtures, tests, task packets, and consumers;
4. assign one exclusive contract-change task;
5. integrate and verify that task first;
6. rebase or restart dependent work from the new integrated contract;
7. resume only after the coordinator marks the new contract frozen.

## 8. Integration order

Exact task IDs and dependencies live in `TASK_GRAPH.yaml`. Use this dependency order when constructing and integrating them:

1. Freeze documentation and orchestration.
2. Integrate dependency and test bootstrap.
3. Start shared TypeScript and Zod contracts and the visual foundation independently after bootstrap.
4. Integrate synthetic fixture manifests and stable assets after contracts.
5. Start eligible deterministic domain services, state, source processing, masking, and independent interface work in parallel according to the graph.
6. Integrate the server-only provider core, release registry, common prompt, proposal schema, and disclosure projection after their domain prerequisites.
7. Run the OpenAI, Gemini, and Mistral adapter tasks in parallel after the provider core. Build browser state and deterministic replay after their domain and fixture prerequisites.
8. Integrate the stateless analysis API after the provider core, all three adapters, citation validation, and review policy are integrated.
9. Integrate the shell after browser state. Then integrate the Purpose and run-controller task after the shell, state, and analysis API, followed by the Documents and Start analysis task.
10. Integrate the model evaluation harness, then TASK-026 for the reviewed static admission handoff, and then the Trust and Safety Lab that consumes both measured results and admission evidence.
11. Run cross-feature end-to-end, accessibility, privacy, security, performance, and deterministic verification after every required user-facing flow is integrated.
12. Perform release integration, rehearsal, and maintainer handoff last.

These are dependency layers, not global waves. Independent work in a later numbered line may start while unrelated work in an earlier line continues when `TASK_GRAPH.yaml` marks it ready. Within one dependency chain, integrate the smallest stable shared dependency before its consumers. A UI can use typed fixture stubs only when its task packet defines them and a later integration task owns replacement with the real service.

## 9. Worker procedure

Each worker follows this sequence:

1. Confirm the task ID and worktree.
2. Read the required starting context from `docs/CONTEXT_INDEX.md`.
3. Check task dependencies and inspect current Git status.
4. Confirm that every intended edit is inside `owned_paths`.
5. Restate the bounded outcome in the task's local plan when required.
6. Implement the smallest complete slice.
7. Run the exact task verification.
8. Inspect the diff for accidental shared-file, secret, private-data, and scope changes.
9. Commit only when both the opening task prompt and the assigned task packet explicitly grant commit permission.
10. Return the handoff format in Section 12.

The worker must not merge, rebase, push, deploy, change cloud settings, add secrets, or enable live provider spending. The coordinator or integrator performs any separately approved integration, push, or deployment action.

## 10. Integration procedure

For each completed task, the integrator:

1. checks that the task started from the correct integrated dependency state;
2. reads the worker handoff and inspects the full diff;
3. confirms that only owned paths changed;
4. confirms that no frozen contract was silently changed;
5. runs the task's verification on the integration branch;
6. runs direct consumer tests when the change affects a shared interface;
7. integrates the change without combining unrelated fixes;
8. records the integrated commit or change reference;
9. marks the task integrated in the graph or execution tracker;
10. recomputes the ready queue and recommends the next manual task.

Do not mark a task integrated merely because its worktree tests passed.

## 11. Conflict handling

### 11.1 Mechanical conflict

A mechanical conflict changes no behavior, such as adjacent imports or formatting. The integrator may resolve it only after confirming both task intents and rerunning affected checks.

### 11.2 Behavioral conflict

A behavioral conflict affects a contract, state transition, fixture, public copy, safety rule, or feature meaning. Stop integration and return the conflict to the coordinator. The coordinator identifies the canonical authority and creates a recorded resolution or bridge task.

### 11.3 Stale worktree

If integrated dependencies changed while a task was running:

- do not force a blind merge;
- compare the changed interfaces with the task assumptions;
- ask the coordinator or integrator to rebase or recreate the worktree only with user approval when required by repository rules;
- rerun every affected verification;
- restart the task when its assumptions are no longer valid.

Never use destructive reset, forced push, or broad conflict resolution. Never discard another worker's or the user's changes.

## 12. Required handoff format

Every worker returns:

```text
Task: TASK-XXX, short title
Outcome: Complete, Partial, or Blocked

Files changed:
- exact/path

Acceptance criteria:
- criterion and result

Verification:
- command or manual check: PASS, FAIL, or NOT RUN

Integration notes:
- dependency or ordering information
- shared interface consumed

Open issues:
- none, or exact blocker

Commit:
- hash if explicitly permitted, otherwise Not committed
```

Use `partial` only when the packet permits a partial handoff. A blocked worker must report the exact authority, dependency, ownership, or test failure that prevents safe progress.

## 13. Verification checkpoints

### Worker checkpoint

Run the smallest relevant checks named by the task packet. A worker may not claim broader readiness from a narrow check.

### Shared-interface checkpoint

After contracts, fixtures, root state, provider registry, route boundaries, shell foundations, or export manifests change, run:

- type checking;
- contract and directly affected unit tests;
- lint for changed surfaces;
- a production build when the interface reaches a route or browser bundle.

### Feature integration checkpoint

After a complete route or user flow is integrated, run:

- relevant unit and component tests;
- route-level end-to-end checks;
- keyboard and focus checks for changed interactions;
- browser inspection of loading, empty, warning, blocked, error, and success states.

### Release checkpoint

Follow the full order in `docs/TESTING_AND_EVALUATION.md` Section 17. Live-provider evaluation is separate, opt-in, and requires current credentials, cost estimation, and user approval. Deterministic replay must keep the public judged flow usable when live analysis is disabled.

No failing test may be hidden, deleted, weakened, or relabelled without a recorded decision.

## 14. Beginner-friendly manual Codex workflow

Use this process for every separate worktree task:

1. Open the `contextfirst-nexus` repository as the Codex project.
2. Ask the coordinator which task is currently ready. Do not choose only by task number because a lower number may still be waiting on a dependency.
3. Create a new Codex task and select the repository worktree option offered by the app.
4. Name it with the task ID and short title, for example `TASK-007 citation validator`.
5. Paste the launcher prompt below, replacing the task ID.
6. Let that task work only inside its separate worktree.
7. When it finishes, review its summary, verification results, and changed files.
8. Return to the coordinator for integration review.
9. Merge or apply the task only after the coordinator confirms its dependencies and ownership are correct.
10. Ask the coordinator for the next ready task and create it manually.

Launcher prompt:

```text
Implement tasks/TASK-XXX.md in this separate worktree.

Read, in this order, AGENTS.md, tasks/TASK-XXX.md, PLANS.md, the TASK-XXX entry in TASK_GRAPH.yaml, docs/CONTEXT_INDEX.md, and every remaining Required context item in the task packet before editing.

Edit only the packet's owned paths. Do not change shared contracts, dependencies, deployment settings, secrets, or files owned by another task. Follow the packet's acceptance criteria and verification exactly. Do not start another task when finished. Return the required handoff from docs/ORCHESTRATION_AND_INTEGRATION.md.
```

If the Codex app uses different labels after an update, preserve the same intent: one new task, one separate repository worktree, one task packet, and no automatic follow-on task.

## 15. Coordinator readiness board

The coordinator should keep a small current view with these states:

- `pending`: defined but waiting for documentation approval or prerequisites;
- `blocked`: a dependency, decision, ownership, or approval is missing;
- `ready`: safe for the user to launch now;
- `active`: running in one worktree;
- `review`: worker finished and integration review is pending;
- `integrated`: present on the integration branch and verified;

Only `ready` tasks may become `active`. Only an integrated task can satisfy another task's dependency.

## 16. Stop conditions

Stop the affected task and notify the coordinator when:

- a product-truth document conflicts with another authority;
- a safety rule cannot be implemented as written;
- an owned path overlaps another active task;
- a missing shared contract would require guessing;
- a new dependency or cloud change appears necessary;
- a fixture ID or expected result is inconsistent;
- a verification failure indicates a broader shared-interface problem;
- a secret, real person, private record, or prohibited data appears in the repository;
- completing the task would require destructive Git or filesystem action.

Stopping under these conditions is correct coordination, not task failure.

## 17. Orchestration acceptance checklist

- Every implementation task has one packet and one graph entry.
- The task graph is acyclic.
- Every dependency names an existing task.
- Every active task has exclusive write ownership.
- Shared contracts are integrated before consumers start.
- Package and lockfile changes have one exclusive owner.
- A dependent task starts only from integrated prerequisites.
- Open worktree slots are refilled from the current ready queue.
- No worker automatically launches its next task.
- Every handoff lists exact files and actual verification results.
- Integration runs the required checks again.
- Conflicts are resolved through canonical authority, not worker preference.
- The user manually controls task creation, integration, deployment, secrets, and live-provider spending.
