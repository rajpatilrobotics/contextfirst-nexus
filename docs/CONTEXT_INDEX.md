# Context Index

## 1. Purpose

This index tells a Codex worker which project documents to read for one bounded implementation task. It exists to provide enough context without loading every project document into every task.

This file is a routing guide. It does not replace the product, safety, architecture, contract, design, fixture, or testing documents.

## 2. Required starting context

Every implementation worker must read these files before changing anything:

1. `AGENTS.md`
2. The assigned `tasks/TASK-XXX.md` packet
3. `PLANS.md`
4. The task entry in `TASK_GRAPH.yaml`
5. This context index
6. Every document or section listed under `Required context` in the task packet

The worker must also inspect the current files it is allowed to edit and check Git status before making a change.

Workers must not rely on chat history, private parent-folder notes, inferred judge preferences, or another worker's unmerged changes. Repository documents and integrated code are the shared context.

## 3. Canonical authority by question

Use the narrowest authority that directly answers the question.

| Question | Canonical authority | What it controls |
|---|---|---|
| Is the behavior safe or permitted? | `docs/SAFETY_AND_DATA.md` | Safety, privacy, human-rights boundaries, prohibited data, prohibited decisions, provider data rules, and public claims |
| What product are we building? | `PROJECT_BRIEF.md` | Product direction, users, scope, P0 and P1 boundary, hero artifact, and strongest demo moment |
| What should the user experience do? | `docs/PRODUCT_SPEC.md` | Screens, user flows, functional requirements, visible states, and product acceptance criteria |
| What are the exact shared names and shapes? | `docs/CONTRACTS.md` | Types, enums, schemas, identifiers, API unions, state transitions, error codes, and cross-contract invariants |
| Where does code belong and how does it run? | `docs/ARCHITECTURE.md` | Routes, modules, dependencies, runtime boundaries, browser and server responsibilities, persistence, and performance choices |
| How are models selected and recovered? | `docs/MODEL_ROUTING.md` | Provider registry, adapters, release admission, disclosures, explicit recovery, and provider-specific restrictions |
| What exact synthetic story and expected behavior must work? | `docs/DEMO_AND_FIXTURES.md` | Packet, stable IDs, expected candidates, demo checkpoint, hero transition, and evaluation fixtures |
| How should the interface look and behave? | `docs/DESIGN_SYSTEM.md` | Tokens, layouts, components, responsive behavior, wording, focus behavior, and accessibility target |
| How is a change verified? | `docs/TESTING_AND_EVALUATION.md` | Test layers, commands, matrices, release gates, model evaluation, accessibility, security, and rehearsal requirements |
| Which external facts may be used? | `docs/SOURCE_REGISTER.md` | Vetted sources, allowed use, limitations, traceability, and prohibited source claims |
| Why was a technical or product choice made? | `decision-log.md` | Approved decisions, superseded decisions, exact dependency versions, and recorded exceptions; it cannot weaken a higher authority |
| How are worktrees scheduled and integrated? | `docs/ORCHESTRATION_AND_INTEGRATION.md` | Readiness, ownership, rolling scheduling, handoff, conflict handling, and integration verification |
| What work is active or complete? | `plan.md`, `PLANS.md`, and `TASK_GRAPH.yaml` | Phase status, execution rules, dependency status, and task readiness |

If two documents appear to conflict, stop the task. Do not invent a compromise. Safety rules control all safety and data questions. For other conflicts, report the exact passages to the coordinator and wait for a recorded resolution.

## 4. Reading levels

Task packets may use one of these reading levels:

- `Full`: read the complete named document.
- `Sections`: read every named section, including its tables, code blocks, and linked subsection rules.
- `Reference`: use the named document only to confirm a value or resolve an implementation question.

`AGENTS.md`, `PLANS.md`, the task packet, and the assigned task-graph entry are always full reads. A worker may read more context when needed, but it must not broaden its write scope.

Safety-critical tasks must read `docs/SAFETY_AND_DATA.md` in full. These include provider routes, masking, source processing, model validation, review rules, dependency invalidation, exports, logs, fixtures, and public claims.

## 5. Minimum context by task type

The task packet is the final authority on required reading. Use this table when creating or checking a packet.

| Task type | Required reading | Useful reference |
|---|---|---|
| Dependency and test bootstrap | `docs/ARCHITECTURE.md` Sections 3 through 7, 15, and 16; `docs/TESTING_AND_EVALUATION.md` Sections 3, 4, 6, and 17; relevant technical entries in `docs/SOURCE_REGISTER.md` | `decision-log.md` |
| Shared contracts and Zod schemas | `docs/CONTRACTS.md` in full; `docs/SAFETY_AND_DATA.md` in full; `docs/ARCHITECTURE.md` Sections 7 through 9 | `docs/TESTING_AND_EVALUATION.md` Sections 7 and 8 |
| Synthetic fixture manifests and assets | `docs/DEMO_AND_FIXTURES.md` in full; `docs/CONTRACTS.md` Sections 2, 3, 6 through 9, 15, 16.5, and 23; `docs/SAFETY_AND_DATA.md` in full | `docs/TESTING_AND_EVALUATION.md` Sections 5 and 11 |
| Case state, live-run lifecycle, citation resolution, audit, and session storage | `docs/CONTRACTS.md` Sections 2, 4, 5, 9, 14 through 16, 18, 24, 25, and 26; `docs/ARCHITECTURE.md` Sections 8.4, 8.6, 8.7, 11, and 13; `docs/SAFETY_AND_DATA.md` in full | `docs/DEMO_AND_FIXTURES.md` Sections 9 and 11 |
| PDF extraction, coverage, and source drawer service | `docs/ARCHITECTURE.md` Sections 4, 7, 8.2, 12, and 16; `docs/CONTRACTS.md` Sections 6, 8, and 9; `docs/DEMO_AND_FIXTURES.md` Sections 6 through 8; `docs/SAFETY_AND_DATA.md` in full | `docs/DESIGN_SYSTEM.md` Sections 9.4 and 9.9 |
| Masking, redaction, leak scanning, or sensitive reveal | `docs/SAFETY_AND_DATA.md` in full; `docs/CONTRACTS.md` Sections 6, 7, 9, 19, and 20; `docs/DEMO_AND_FIXTURES.md` Section 7 | `docs/DESIGN_SYSTEM.md` Sections 9.5 and 11; `docs/TESTING_AND_EVALUATION.md` Sections 8.2 and 14 |
| Stateless analysis route and common model validation | `docs/SAFETY_AND_DATA.md` in full; `docs/CONTRACTS.md` Sections 4.7 and 16; `docs/ARCHITECTURE.md` Sections 8.4, 8.5, 9, 12 through 15; `docs/MODEL_ROUTING.md` in full | `docs/TESTING_AND_EVALUATION.md` Sections 7.2, 12, and 14.1 |
| One provider adapter | `docs/MODEL_ROUTING.md` Sections 2, 5, 6, 8, 9, 10, and 11; `docs/CONTRACTS.md` Sections 4.7 and 16; `docs/SAFETY_AND_DATA.md` in full; the provider entries in `docs/SOURCE_REGISTER.md` | `docs/TESTING_AND_EVALUATION.md` Sections 7.2, 12, and 14.1 |
| Static provider admission handoff | `docs/CONTRACTS.md` Sections 4.7, 22, 23, and 26; `docs/MODEL_ROUTING.md` Sections 6, 8, 10, and 11; `docs/TESTING_AND_EVALUATION.md` Sections 12, 14, 18, and 19; `docs/SAFETY_AND_DATA.md` in full | `decision-log.md` provider admission and implementation-time evidence records |
| Provider selector, disclosure, run controller, or recovery UI | `docs/PRODUCT_SPEC.md` Sections 5, 7.3, and 7.5; `docs/CONTRACTS.md` Sections 4.7, 16, and 18; `docs/MODEL_ROUTING.md` Sections 6 and 7; `docs/DESIGN_SYSTEM.md` Sections 9.2, 9.3, and 10.1; `docs/SAFETY_AND_DATA.md` in full | `docs/TESTING_AND_EVALUATION.md` Sections 7.2 and 9 |
| Application shell, navigation, or base UI | `docs/ARCHITECTURE.md` Sections 6 and 7; `docs/DESIGN_SYSTEM.md` Sections 2 through 8, 11, and 13; `docs/PRODUCT_SPEC.md` Sections 6, 8, and 9 | `PROJECT_BRIEF.md` End-to-end prototype flow |
| Purpose route | `docs/PRODUCT_SPEC.md` Sections 7.1 through 7.3; `docs/CONTRACTS.md` Sections 4.7 and 5; `docs/DESIGN_SYSTEM.md` Sections 9.1 and 9.2; `docs/SAFETY_AND_DATA.md` Sections 2 through 5 and 8 | `docs/DEMO_AND_FIXTURES.md` Sections 4 and 13 |
| Intake and documents route | `docs/PRODUCT_SPEC.md` Sections 7.4 and 7.5; `docs/CONTRACTS.md` Sections 6 through 8 and 17; `docs/DESIGN_SYSTEM.md` Sections 9.3 through 9.5; `docs/SAFETY_AND_DATA.md` in full | `docs/DEMO_AND_FIXTURES.md` Sections 6 through 8 |
| Timeline, Nexus, lanes, review queue, or dependency UI | `docs/PRODUCT_SPEC.md` Sections 7.6 through 7.12; `docs/CONTRACTS.md` Sections 9 through 15 and 18; `docs/DESIGN_SYSTEM.md` Sections 7 through 9.13; `docs/DEMO_AND_FIXTURES.md` Sections 8 through 11; `docs/SAFETY_AND_DATA.md` in full | `docs/TESTING_AND_EVALUATION.md` Sections 8.4, 8.5, 9, and 10 |
| Export gate, manifest, PDF, or JSON | `docs/SAFETY_AND_DATA.md` in full; `docs/CONTRACTS.md` Sections 19 and 20; `docs/PRODUCT_SPEC.md` Sections 7.13 and 7.14; `docs/DESIGN_SYSTEM.md` Sections 9.11 and 9.14; `docs/DEMO_AND_FIXTURES.md` Sections 9, 11, and 13 | `docs/TESTING_AND_EVALUATION.md` Sections 7.4, 8.6, 10, and 14.3 |
| Trust page, system card, or Safety Lab | `docs/PRODUCT_SPEC.md` Section 7.15; `docs/CONTRACTS.md` Sections 22 and 23; `docs/DESIGN_SYSTEM.md` Sections 9.15 and 9.16; `docs/SAFETY_AND_DATA.md` Sections 8, 18, 19, and 20; `docs/DEMO_AND_FIXTURES.md` Sections 14 through 16 | `docs/TESTING_AND_EVALUATION.md` Sections 11, 12, and 19 |
| Unit, contract, component, end-to-end, or accessibility tests | `docs/TESTING_AND_EVALUATION.md` in full; the canonical product or contract document for the behavior under test | `docs/DEMO_AND_FIXTURES.md` for stable fixture IDs |
| Deployment and runtime configuration | `docs/ARCHITECTURE.md` Sections 3, 4, 8.4, 12, 14 through 16; `docs/MODEL_ROUTING.md` Sections 6, 8, and 9; `docs/SAFETY_AND_DATA.md` Sections 8 and 16 | `docs/TESTING_AND_EVALUATION.md` Sections 6, 14, 15, and 19 |
| Integration and release verification | `docs/ORCHESTRATION_AND_INTEGRATION.md` in full; `TASK_GRAPH.yaml`; `docs/TESTING_AND_EVALUATION.md` Sections 17 through 22; `plan.md` | All task handoffs included in the integration set |

## 6. Shared-contract freeze

These are shared authorities, not feature-worker scratch files:

- `PROJECT_BRIEF.md`
- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTRACTS.md`
- `docs/SAFETY_AND_DATA.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DEMO_AND_FIXTURES.md`
- `docs/MODEL_ROUTING.md`
- `docs/TESTING_AND_EVALUATION.md`
- `docs/SOURCE_REGISTER.md`

During implementation, a worker may not edit these documents unless its task packet grants exact ownership of the named file. A discovered contradiction or missing contract is a coordinator issue, not permission to change the contract locally.

Shared implementation surfaces, including `package.json`, the lockfile, common test configuration, `lib/contracts`, the provider registry, global styles, and root layouts, also require one exclusive owner at a time as declared in `TASK_GRAPH.yaml`.

## 7. Context handoff rule

A worker's final handoff must be understandable without chat history. It must include:

- task ID and outcome;
- files changed;
- acceptance criteria completed;
- verification commands and results;
- any unresolved issue or assumption;
- contract or dependency concern that needs coordinator action;
- commit hash only when both the opening task prompt and the assigned task packet explicitly permitted a commit.

The handoff must not claim that unrun tests passed or that planned behavior was implemented.

## 8. Index maintenance

Update this index only when an authoritative document, task category, or ownership boundary changes. Do not add a new document merely to restate existing authority.

When a path changes:

1. update this index;
2. update every affected task packet;
3. update `TASK_GRAPH.yaml` if ownership or dependencies changed;
4. record a material decision in `decision-log.md`;
5. run the documentation reference audit before launching another dependent task.
