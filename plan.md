# ContextFirst Nexus Documentation Foundation Plan

## 1. Goal

Create a complete, consistent documentation foundation that gives Codex enough product, technical, safety, design, testing, and execution context to build ContextFirst Nexus through a rolling pool of separate worktree tasks.

This phase creates documentation only. Application implementation begins only after the documentation is reviewed and approved.

## 2. Problem

The repository currently contains a blank Next.js shell and a completed infrastructure plan. The detailed research and product reasoning live outside the Git repository, so new Codex worktrees cannot access them. The repository also lacks shared contracts, task boundaries, verification rules, and an orchestration process.

Starting parallel implementation now would create a high risk of inconsistent assumptions, overlapping edits, merge conflicts, unsafe product behavior, and wasted time.

## 3. Proposed solution

Distill the approved research into a small set of authoritative repository documents. Define the product and demo first, then freeze its architecture, interfaces, safety boundaries, design system, fixtures, and evaluation criteria. Finally, create a dependency-aware task graph and one self-contained packet for every implementation worktree.

Keep `AGENTS.md` concise. It will define durable repository rules and direct each worker to its task packet and only the relevant shared documents. A coordinator will maintain a rolling pool of ready worktree tasks, integrate verified commits, and prevent concurrent edits to shared files.

## 4. Files to change

Create or update only documentation and Codex orchestration files inside this repository:

- `AGENTS.md`
- `PROJECT_BRIEF.md`
- `README.md`, deferred to implementation TASK-025 rather than changed in this documentation phase
- `plan.md`
- `decision-log.md`
- `PLANS.md`
- `TASK_GRAPH.yaml`
- `docs/CONTEXT_INDEX.md`
- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTRACTS.md`
- `docs/SAFETY_AND_DATA.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DEMO_AND_FIXTURES.md`
- `docs/MODEL_ROUTING.md`
- `docs/TESTING_AND_EVALUATION.md`
- `docs/SOURCE_REGISTER.md`
- `docs/ORCHESTRATION_AND_INTEGRATION.md`
- `tasks/TASK-XXX.md` files for each approved work package

Add `.codex/config.toml`, `.env.example`, or `.worktreeinclude` only later if the approved architecture or worktree setup requires them. Do not copy the private parent-folder research notes into the public repository.

## 5. Step by step tasks

1. [x] Audit the repository, current Codex behavior, worktree requirements, and documentation gaps.
2. [x] Create the product-truth documents: project brief, product specification, safety and data rules, demo and fixture specification, and vetted source register.
3. [x] Review the product-truth documents together and resolve contradictions, unsupported claims, open scope decisions, and non-goals.
4. [x] Create the engineering documents: architecture, contracts, design system, and testing and evaluation plan.
5. [x] Review and freeze shared names, data schemas, module boundaries, provider choices, user flows, and quality gates.
6. [x] Research and freeze safe multi-provider routing with explicit practitioner-controlled recovery, including a synthetic-only free-tier boundary.
6a. [x] Add and freeze one evaluated free live option after Gemini, including contracts, disclosures, display order, and tests.
7. [x] Create the execution documents: `AGENTS.md`, `PLANS.md`, context index, orchestration and integration rules, and decision log.
8. [x] Create an acyclic `TASK_GRAPH.yaml` with 26 bounded tasks, explicit dependencies, active-write ownership, dependency-ordered ownership transfer, and rolling scheduling rules.
9. [x] Create one self-contained `tasks/TASK-XXX.md` packet per worktree with exact context, scope, contracts, acceptance criteria, verification, commit permission, and handoff requirements.
10. [x] Audit the complete document set for missing information, conflicting instructions, unsafe claims, broken paths, excessive context, task ownership, task-graph integrity, and document structure.
11. [x] Present the final documentation package for approval before any application implementation.
12. [ ] After explicit approval, commit and push the documentation to the permanent repository.
13. [ ] Add the exact `contextfirst-nexus` Git repository folder as a Codex project and perform a small worktree-readiness check before launching implementation tasks.

## 6. Acceptance criteria

- A new Codex task can understand the product without relying on this chat or private parent-folder notes.
- Product purpose, users, workflow, demo, non-goals, terminology, and responsible-AI boundaries are explicit and consistent.
- Technical choices, module boundaries, data contracts, APIs, states, and error behavior are defined before parallel feature work begins.
- Every task has one bounded outcome, satisfied dependencies, exclusive active-write ownership, observable acceptance criteria, and exact verification commands. The one static-admission ownership transfer is dependency-ordered and never concurrent.
- The coordinator can keep ready worktree slots filled without waiting for unrelated tasks.
- Workers cannot silently change shared contracts, dependencies, deployment configuration, or product scope.
- Unsupported legal conclusions, victim or credibility scoring, unsafe data use, and unverified claims are explicitly prohibited.
- No secrets, private research, credentials, survivor data, or unsupported partnership claims enter the public repository.
- Application code remains unchanged during this documentation phase.

## 7. Testing plan

- Inspect the final Git diff and confirm that only approved documentation and orchestration files changed.
- Check every internal file reference and required-reading path.
- Validate that the task dependency graph has no cycles and that every dependency exists.
- Compare file-ownership rules across all task packets and remove overlapping write access.
- Review each task packet as if the worker has no chat history and confirm it is independently executable.
- Verify that acceptance criteria describe user-visible or test-observable behavior.
- Confirm that shared contracts, fixtures, safety rules, and verification commands agree across all documents.
- Confirm that no private parent-folder content or secrets are included.

## 8. Open questions

- Confirm the final API credentials and external services available before implementation begins. Credentials will never be written into documentation or committed.
- Decide the final number of active worktree slots after a lightweight setup test on the MacBook Air M2. Start conservatively and increase only if memory and build performance remain stable.
- Resolved for P0 provider resilience: Mistral Small 4 is the third live candidate after Gemini, subject to the same contract and safety gates and unavailable until the exact release passes evaluation and is exposed by the deployed free account. Cerebras remains a reserve candidate. Provider changes are explicit, keys stay server-side, and deterministic replay remains separate and visibly labelled.
- Resolved for P0: no OCR, no production authentication, no durable server case store, versioned redacted synthetic state in browser session storage, PDF.js text extraction, and local React-pdf plus JSON exports. Exact installed versions and measured model choices will be recorded before dependent tasks launch.
- The approved graph contains 26 task packets. Any later count change requires coordinated updates to the graph, affected packets, ownership rules, and integration order.
