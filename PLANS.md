# ContextFirst Nexus Execution Plans

## 1. Purpose

This file defines how approved ContextFirst Nexus work is planned, executed in separate Codex worktrees, verified, and handed back for integration.

The goal is fast parallel implementation without overlapping edits, hidden contract changes, or reliance on chat history.

## 2. Three planning levels

### Project checkpoint

`plan.md` tracks the documentation and implementation program at repository level. During parallel work, only the coordinator updates it unless a task packet explicitly assigns it.

### Task graph

`TASK_GRAPH.yaml` records task IDs, dependencies, readiness, exclusive file ownership, and scheduling information. It is the source of truth for which tasks may start in parallel.

### Task packet

Each `tasks/TASK-XXX.md` file is the approved execution plan for one worktree. It gives a worker enough context to complete one bounded outcome without reading this chat.

A task packet cannot weaken `AGENTS.md` or any higher-authority product document.

## 3. When a task may start

A task is ready only when:

1. Its packet exists and has no unresolved placeholders.
2. Every listed dependency is integrated into the task's base branch.
3. Its exclusive write scope does not overlap another active task.
4. Shared contracts it consumes are already frozen and available.
5. Required dependencies and test tooling are already installed, unless this is the dependency-bootstrap task.
6. The coordinator has assigned the task to a separate worktree.
7. Any required user approval, external credential, spend approval, or cloud-setting approval has been obtained.

Do not start a blocked task merely because a worktree slot is free.

## 4. Required task packet structure

Every task packet must contain these sections:

1. Task metadata.
2. Goal.
3. Why this task exists.
4. Dependencies and base requirement.
5. Required context.
6. Exclusive write scope.
7. Read-only context allowed.
8. Out of scope.
9. Frozen contracts and invariants.
10. Implementation steps.
11. Acceptance criteria.
12. Verification commands.
13. Manual checks.
14. Commit permission and commit message.
15. Handoff requirements.
16. Stop conditions.

The packet should use exact paths, contract names, fixture IDs, visible labels, and commands. Avoid instructions such as make it work, improve the UI, or add tests without defining an observable result.

## 5. Task packet template

Use this structure for implementation packets:

````md
# TASK-XXX: Short outcome

## 1. Task metadata

- Status: Ready
- Suggested branch: task/xxx-short-name
- Depends on: TASK-AAA, TASK-BBB
- Parallel-safe with: TASK-CCC
- Commit permission: No, or Yes with opening-prompt authorization

## 2. Goal

One observable outcome.

## 3. Why this task exists

The user or demo value this task unlocks.

## 4. Dependencies and base requirement

Exact integrated prerequisites.

## 5. Required context

1. `AGENTS.md` in full.
2. This assigned task packet in full.
3. `PLANS.md` in full.
4. The assigned task entry in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. Exact remaining shared documents and sections, in this packet's order.
7. Git status and the current contents of every owned path before editing.

## 6. Exclusive write scope

- path/to/file.ts
- path/to/folder/**

## 7. Read-only context allowed

- Exact paths useful for integration

## 8. Out of scope

- Neighboring features and shared files this worker must not change

## 9. Frozen contracts and invariants

- Exact types, IDs, labels, transitions, and safety rules to preserve

## 10. Implementation steps

1. Inspect.
2. Implement the smallest testable unit.
3. Add focused tests.
4. Verify.

## 11. Acceptance criteria

- Observable result one
- Observable result two

## 12. Verification commands

```text
exact command
```

## 13. Manual checks

1. Exact user action and expected result.

## 14. Commit permission and message

- Permission: No, or Yes only when the opening prompt also authorizes it
- Message: feat: exact message

## 15. Handoff requirements

- Changed files, tests, results, blockers, and commit hash when applicable

## 16. Stop conditions

- Contract conflict, required unowned file, new dependency, unsafe data flow, or missing prerequisite
````

## 6. Worker execution flow

### Phase A: Preflight

1. Read, in order, `AGENTS.md`, the assigned packet, `PLANS.md`, the assigned task entry in `TASK_GRAPH.yaml`, `docs/CONTEXT_INDEX.md`, and then the remaining Required context items in packet order.
2. Inspect Git status and the current contents of every owned file.
3. Confirm that dependencies are present in the current branch.
4. Confirm that no other active task owns the same files.
5. Share a short implementation sequence.

Stop before editing if any preflight condition fails.

### Phase B: Implement in small slices

1. Add the smallest coherent behavior.
2. Run its focused verification.
3. Fix the smallest cause of any failure.
4. Keep the application runnable after each slice where practical.
5. Continue until all packet acceptance criteria are observable.

Do not widen scope to clean up unrelated code. Record optional improvements for a later task.

### Phase C: Verify

1. Run every packet command.
2. Perform every listed manual check.
3. Inspect the final diff for unowned files, secrets, debug output, and accidental scope expansion.
4. Confirm that user-facing copy follows the frozen language and contains no unsupported claim.
5. Confirm that failure, unknown, empty, and blocked states are handled where applicable.

### Phase D: Handoff

Use this format:

```text
Task: TASK-XXX
Outcome: Complete, Partial, or Blocked
Files changed:
- exact path
Behavior:
- observable result
Contracts preserved:
- named invariant
Verification:
- command: pass or fail
Not run:
- command and reason
Blockers or follow-up:
- exact issue or None
Commit:
- hash, or Not committed
```

## 7. Coordinator workflow

The coordinator maintains a rolling pool of ready worktrees.

1. Select only tasks whose dependencies are satisfied.
2. Prefer tasks with disjoint exclusive write scopes.
3. Give every task its packet and exact base revision.
4. Keep shared configuration ownership with one bootstrap or integration task.
5. Review each handoff against its packet before integration.
6. Inspect the diff for out-of-scope changes and contract drift.
7. Run the smallest integration checks after each accepted task.
8. Update task status and unlock newly ready dependants.
9. Run the complete deterministic verification set at integration milestones.
10. Ask for user approval before any commit, push, deployment, billing, credential, or production-setting action that was not already explicitly authorized.

The coordinator must not integrate a task simply because its branch is conflict-free. Its behavior and acceptance criteria must pass.

### Rolling concurrency

The graph may contain 20 or more total tasks. This does not mean they run sequentially or all at once.

- Start with a small pool of ready, disjoint tasks that the MacBook Air M2 can run comfortably.
- Refill a slot as soon as one task hands off and its dependant can safely start.
- Increase active worktrees only when memory, build time, and editor responsiveness remain stable.
- A slow or blocked task must not stop unrelated ready tasks.
- Shared-contract and integration tasks form short synchronization points. Feature tasks branch out again after those points integrate.
- Total task count and simultaneous worktree count are separate settings.

## 8. File ownership rules

- One active task owns a file or writable subtree at a time.
- A broad folder owner and a narrow file owner inside that folder overlap and cannot run together.
- Generated files belong to the task that owns the generator or to a separately named generation task.
- `package.json`, `package-lock.json`, shared test setup, framework configuration, and dependency scripts belong to dependency bootstrap until it is integrated.
- `docs/CONTRACTS.md`, shared contract implementations, fixture manifests, root reducer types, and provider registry are shared-contract surfaces. Their tasks must integrate before dependent feature tasks start.
- Page-composition tasks should consume feature components after those feature tasks integrate. They should not recreate feature logic locally.
- Test tasks may read application code but may edit only their assigned test paths unless the packet explicitly includes a narrow implementation fix.

If two tasks need the same file, split the file first through an integration task or schedule the tasks sequentially.

## 9. Dependency and contract changes

A worker must stop and request a decision when the work appears to require:

- a new runtime package;
- a shared type or enum change;
- a route, persistence, provider, prompt, fixture, or export-contract change;
- a new environment variable;
- a new external service;
- arbitrary upload or real-data handling;
- weaker review, citation, privacy, or export gates;
- unclassified or browser-controlled provider fallback, safety-bypassing fallback, or any replay substitution;
- cloud, billing, quota, deployment, or production-setting changes;
- edits outside the exclusive write scope.

The coordinator records an approved change in `decision-log.md`, updates all affected authoritative documents and contracts together, versions incompatible contracts when required, and then revises the task graph and packets. A worker must not make these changes locally and hope that integration resolves them.

## 10. Provider implementation plan rules

Provider work is split into separate bounded layers:

1. Shared provider contracts and server-only evaluated registry.
2. Canonical request construction and shared deterministic post-validation.
3. OpenAI native adapter.
4. Gemini native adapter.
5. Mistral native adapter.
6. Analysis route orchestration and safe errors.
7. Replay-only plain-language analysis entry and consolidated disclosure.
8. Contract-reconciled managed server routing and safe operational fallback.
9. System card and audit provenance.
10. Provider contract and evaluation tests.

Adapter tasks may run in parallel only after shared contracts and approved dependencies are integrated. An adapter task must not edit route orchestration, another adapter, the practitioner analysis-entry flow, or the managed router.

The public flow calls only its sole auto-bound local replay release. Future live work uses the DEC-045 managed order only after contract reconciliation, static admission, and all runtime approvals. Replay remains a separate local path.

## 11. Approval gates

The following gates require explicit user approval:

- moving from documentation into application implementation;
- adding or changing a package outside the already approved dependency bootstrap;
- estimated live-model evaluation spend;
- adding credentials to local or hosted secret storage;
- enabling public live analysis;
- changing Vercel, provider, billing, quota, firewall, or production settings;
- committing or pushing when the opening task did not authorize it;
- deploying a changed application;
- any destructive action.

Approval for one gate does not imply approval for another.

## 12. Completion rules

A task is Complete only when:

- every acceptance criterion is satisfied;
- every required verification passes;
- required manual checks are completed;
- no secret, real case data, private research, or unsupported claim was added;
- the diff contains only owned files;
- the handoff identifies any unrun non-required checks;
- no known blocker remains inside the task scope.

Use Partial when safe work is useful but required work remains. Use Blocked only when the worker cannot continue safely without a missing decision, dependency, permission, or external state change.
