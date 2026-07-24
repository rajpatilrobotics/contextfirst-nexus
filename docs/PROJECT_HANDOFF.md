# ContextFirst Nexus — Project Handoff

Last updated: 2026-07-24  
Repository: `/Users/rajpatil/Documents/call for code-hack26/contextfirst-nexus`  
Stable replay-only deployment: <https://contextfirst-nexus.vercel.app>

Sections 1–22 preserve the complete 2026-07-19 handoff. Sections 23 onward
record the Replit and Lovable redesign work, the current repository state,
the agreed integration strategy, and the exact starting point for the next
Codex task.

## 1. Purpose of this document

This is the durable context file for starting a new Codex task without carrying the full original conversation. It records:

- why ContextFirst Nexus exists;
- who it serves;
- the complete intended workflow;
- the implemented architecture and safety contracts;
- what is working, what is replay-only, and what remains incomplete;
- the current UI redesign direction;
- the repository's present work-in-progress state;
- the safest next steps.

This file is a handoff, not a replacement for repository truth. Before changing code, also inspect `git status`, `README.md`, `PROJECT_BRIEF.md`, `plan.md`, `decision-log.md`, `TASK_GRAPH.yaml`, the relevant task packet, contracts, schemas, and tests.

## 2. Executive summary

ContextFirst Nexus is an AI-assisted evidence-organization and case-preparation workspace for professionals handling possible trafficking, exploitation, coercion, and forced-criminality context.

The product helps a qualified practitioner:

1. define the authorized purpose of a review;
2. add source documents;
3. inspect coverage and privacy masking;
4. organize events, evidence, contradictions, gaps, and relationships;
5. make explicit human review decisions;
6. see dependency effects when a decision changes;
7. create a gated, minimum-necessary handoff with traceable provenance.

It must **not** decide whether trafficking occurred, determine guilt, assess credibility, establish victim status, recommend prosecution or sentence, provide legal advice, or replace professional judgment.

The strongest product promise is not “AI makes the decision.” It is:

> Context before conclusion: turn a difficult document packet into a source-linked, limitation-aware workspace that keeps a human reviewer in control.

## 3. Problem statement

Practitioners may receive fragmented material such as job offers, recruiter messages, travel records, interviews, task logs, financial records, procedural notices, and support-provider notes. Important information is scattered across pages and sources.

The difficult work is to:

- reconstruct chronology without inventing missing facts;
- distinguish documented, reported, alleged, inferred, conflicting, and unknown information;
- preserve exact source locations and provenance;
- identify missing pages, unreadable content, contradictions, and evidence gaps;
- understand possible relationships among recruitment, movement, control, compelled activity, timing, and urgent protection context;
- avoid converting a pattern or hypothesis into a legal conclusion;
- record consequential human decisions and their downstream effects;
- share only reviewed, redacted, purpose-appropriate material.

Existing workflows often rely on manual notes, disconnected PDFs, spreadsheets, and memory. That makes review slow, hard to audit, and vulnerable to accidental overstatement or omission.

## 4. Intended users and stakeholders

Primary users:

- legal-aid and defence practitioners;
- public defenders and court-navigation teams;
- trained NGO or victim-support practitioners;
- anti-trafficking specialists;
- qualified investigators or evidence reviewers working within an authorized purpose.

The person described in the records is an affected stakeholder, not necessarily the direct software user. Product choices must protect that person's privacy, dignity, and procedural interests.

This is a professional evidence workbench, not a developer platform. Users should never be asked to select GPT, Gemini, Mistral, reasoning levels, API releases, or provider credentials in the ordinary interface.

## 5. Product principles

1. **Context before conclusion.** Organize evidence; do not adjudicate.
2. **Exact sources remain visible.** Every material statement should link to an exact approved source segment where possible.
3. **Unknown is a valid result.** Missing or insufficient evidence must not be filled with guesses.
4. **Contradictions stay visible.** Disagreement is review work, not an error to hide.
5. **Human review is consequential.** Accepting, rejecting, marking uncertain, confirming unknown, withdrawing, or superseding a decision changes downstream readiness.
6. **Provenance is first-class.** Distinguish extracted, AI-suggested, reviewer-supplied, and fixture-seeded content.
7. **Cooperation is neutral.** Cooperation with law enforcement must not control access or evidence treatment.
8. **Minimum necessary sharing.** Export only what the stated recipient and purpose require.
9. **No export bypass.** Unsafe or incomplete state fails closed.
10. **Guidance is not domestic law.** International guidance and practice resources remain separate from evidence and legal conclusions.
11. **Claims must match measured evidence.** Do not present simulated or unrun evaluation results as real effectiveness.
12. **Privacy by default.** Mask sensitive identifiers; make reveal explicit, justified, and audited.

## 6. Scope and non-goals

In scope:

- purpose and authority framing;
- local document intake and readability checks;
- coverage and masking review;
- source-linked candidate extraction and organization;
- chronology and relationship views;
- contradiction, missingness, uncertainty, and limitation handling;
- human review decisions;
- dependency-aware withdrawal and re-review;
- gated full handoff and minimum-necessary safe share;
- local semantic, JSON, and PDF output;
- audit, trust, guidance, and evaluation evidence.

Out of scope:

- survivor-facing crisis chat;
- emergency response or referral dispatch;
- live investigation or web scraping;
- biometric identification;
- cross-case prediction or risk scoring;
- credibility, guilt, victim-status, offence, prosecution, sentence, or case-outcome decisions;
- automated legal conclusions;
- silently transmitting source documents to external services;
- training models on uploaded case material;
- presenting mock analysis as real analysis.

## 7. Intended end-to-end user journey

### 7.1 Start or open a case

The ideal future shell can show a small case dashboard, but the current implemented demo centers on one fictional case. The user should immediately understand whether they are viewing a prepared replay or starting a fresh workspace.

### 7.2 Define the purpose

The practitioner records:

- practitioner role;
- organization type;
- authorized purpose;
- intended recipient or handoff;
- supported workflow;
- decisions explicitly excluded from system support;
- jurisdiction for local legal verification;
- source language and translation status;
- required attestations.

Saving the purpose does not itself start analysis. The screen needs an obvious next action leading to Documents.

### 7.3 Add documents

The desired product direction is an initially empty intake workspace that accepts **one or more PDFs**, not a form that requires exactly seven fixed files.

The interface should:

- support file chooser and drag-and-drop;
- accept arbitrary filenames and document counts within sensible technical limits;
- show selected, checking, readable, scanned/OCR-needed, failed, and ready states truthfully;
- let users add more, remove, replace, or retry documents;
- distinguish local browser parsing from later analysis;
- make missing document categories limitations, not intake failure;
- never claim text was extracted when it was not.

Suggested document categories may help organization—job offer, messages, travel record, practitioner note, financial/task log, procedural record, support note, and Other—but categories must not force a fixed packet.

### 7.4 Review coverage and privacy

For readable documents, show page coverage, extraction limitations, masking status, and source preview. Sensitive identifiers are masked by default.

An intentional reveal flow should:

1. explain that sensitive content will be shown;
2. require a reason;
3. append a safe audit event;
4. reveal only the necessary source;
5. allow masking to be restored;
6. avoid placing raw sensitive values into logs or audit summaries.

### 7.5 Start analysis explicitly

Analysis begins only after required prerequisites and an explicit user action. Provider routing is a server concern. The UI should say something plain such as **Start analysis**, with clear progress and recovery states.

### 7.6 Inspect structured analysis

The user reviews candidate items with:

- plain-language title and description;
- evidence nature;
- origin;
- support status;
- review status;
- exact citations;
- limitations and abstentions;
- dependency information.

No item is a legal conclusion. AI-suggested items remain proposals until reviewed.

### 7.7 Explore chronology and relationships

The Timeline reconstructs dated, approximate, conflicting, and unknown events while retaining source links.

The relationship view should be named neutrally—**Evidence Map**, **Relationships**, or **Context Map**—rather than implying a criminal charge or legal determination. It can show support, dependency, contradiction, and gaps, with a clear disclaimer that it is a visual organization of evidence, not a trafficking determination or legal opinion.

### 7.8 Make human decisions

The practitioner can accept, reject, mark uncertain, confirm unknown, defer, or otherwise record only contract-supported decisions. Consequential changes require clear confirmation.

If an accepted upstream item is withdrawn, the app previews affected downstream items, records the dependency change, invalidates relevant readiness, and requires renewed review. It must not silently preserve stale conclusions.

### 7.9 Export safely

The Export Gate lists blockers, affected IDs, severity, explanation, and remediation links. There is no override for critical blockers.

When ready, the user chooses:

- full practitioner handoff; or
- minimum-necessary safe share with explicit selection and confirmation.

One immutable canonical manifest drives semantic preview, canonical JSON, and local PDF. Outputs include provenance, reviewed-state identity, labels, limitations, gaps, coverage, guidance, review history, redaction status, and audit information appropriate to the contract.

## 8. Current routes

- `/` — landing page.
- `/case/demo/purpose` — Purpose Brief.
- `/case/demo/intake` — document intake, processing, masking, and prerequisites.
- `/case/demo/review` — timeline, candidates, lanes, queue, context gaps, dependency changes, and source drawer.
- `/case/demo/export` — export gate, semantic/JSON preview, local PDF, and safe share.
- `/trust` — system card, provider/admission truth, audit history, guidance, Safety Lab, and unsafe-output reporting.
- `/api/analyze` — availability GET and guarded analysis POST.

Historical shell flow is Purpose → Documents → Review → Export. The preferred redesign may use a persistent professional case navigation with Documents, Analysis, Evidence Map, Timeline, Export Gate, and Audit/Trust while preserving the same domain contracts.

## 9. Evidence vocabulary

The UI must not collapse these different dimensions:

### Evidence nature

- documented;
- reported;
- alleged;
- user-entered;
- conflicting;
- unknown.

### Origin

- extracted from a source;
- AI suggested;
- reviewer supplied;
- prepared/fixture seeded.

### Support status

- supported;
- partially supported;
- insufficient evidence;
- conflicting;
- unknown;
- invalidated or withdrawn where allowed.

### Review status

- pending review;
- accepted;
- rejected;
- marked uncertain;
- confirmed unknown;
- superseded;
- withdrawn;
- needs renewed review.

These labels are not interchangeable. For example, “reported” is not the same as “accepted,” and “AI suggested” is not the same as “supported.”

## 10. Major implemented feature areas

### Purpose

- canonical Purpose Brief and validation;
- required attestations;
- focusable validation errors;
- central state ownership and revision preservation;
- plain-language disclosure and replay preparation.

### Documents

- local PDF selection and browser-side processing foundation;
- coverage manifest;
- masking-review controls;
- redacted-first source display;
- audited reveal command;
- unsafe instruction-like content treated as inert evidence;
- prerequisite-gated analysis action.

### Review

- source-linked timeline;
- exact masked source drawer;
- review queue and lanes;
- candidate review cards;
- Nexus/context relationship matrix;
- context-gap review;
- dependency-change and withdrawal flow;
- prepared checkpoint with seeded reviewer decisions;
- remediation focus handling.

### Export

- canonical export gate;
- stable blocker codes and remediation links;
- immutable manifest;
- semantic preview and canonical JSON;
- lazy local PDF generation;
- local JSON/PDF downloads;
- full handoff and minimum-necessary safe share;
- post-withdrawal limitation preservation.

### Trust and evaluation

- static provider admission truth;
- deterministic evaluation harness;
- versioned admission reports;
- audit history;
- Safety Lab;
- guidance cards backed by corrected source metadata;
- unsafe-output reporting;
- no aggregate accuracy or effectiveness claim.

## 11. Current AI and provider truth

The production application is intentionally **replay-only** unless the exact server environment variable `ENABLE_LIVE_ANALYSIS="true"` is set.

Current public truth:

- OpenAI: not evaluated for release and non-selectable.
- Gemini: not evaluated for release and non-selectable.
- Mistral: not evaluated, deployed-account availability not verified, and non-selectable.
- Prepared local replay: available and selectable.
- Replay provider transmission: `false`.
- Public live analysis: disabled.
- Users do not select models in the UI.

The desired future managed routing policy is server-side:

1. OpenAI primary;
2. Gemini fallback for eligible transport/availability failures;
3. Mistral fallback if admitted and available;
4. otherwise a safe unavailable/recovery state.

A fourth provider should not be invented or exposed without explicit evaluation, admission, and implementation. Safety failures and invalid output must not trigger an automatic provider-switch bypass. Automatic merging of outputs from multiple providers is prohibited.

TASK-040 documents the managed-provider UX/routing direction but was not implemented at the time of this handoff.

## 12. Architecture and technology

Current stack:

- Next.js 16 App Router;
- React 19;
- TypeScript 5.9;
- Tailwind CSS 4;
- Zod for schema validation;
- PDF.js for browser-side PDF handling;
- `@react-pdf/renderer` for local PDF output;
- server-only OpenAI, Gemini, and Mistral adapters;
- Vitest and Testing Library;
- Playwright for browser flows;
- axe for automated accessibility checks;
- Vercel deployment.

State and data choices:

- a single canonical `CaseState` owner exposed through the case shell context;
- typed state commands with idempotency and revision checks;
- browser/session persistence for the demo;
- no production database or authentication system;
- deterministic bundled fixture and replay for the public demo;
- strict provider and export boundaries;
- canonical manifest used by every export renderer.

Do not rewrite the backend or state architecture merely to adopt a new visual design. Reuse the existing contracts, commands, reducer, review engine, export core, provider boundary, and audit behavior.

## 13. Security, privacy, and accessibility contracts

- Do not place secrets or provider credentials in client code.
- Do not send source files to a provider without explicit, authorized policy and user disclosure.
- Mask identifiers by default.
- Reveal actions require intent, reason, audit, and focus restoration.
- Audit summaries contain safe event types, stable IDs, and allowlisted reason codes—not raw source content.
- Treat instruction-like evidence as inert text.
- Keep restrictive response headers and CSP; local PDF rendering requires the narrow `'wasm-unsafe-eval'` token, not broad `'unsafe-eval'`.
- Export gates fail closed.
- Recovery choices are explicit; no invisible fallback or safety bypass.
- Preserve keyboard behavior, semantic landmarks, focus restoration, 320px reflow, 200% zoom, and reduced-motion support.
- Automated axe checks passed historically, but this is not a blanket accessibility-conformance claim.

## 14. Fixture, replay, and canonical identities

The public demo uses the fictional case `CFN-DEMO-001`, fixture version `1.0.0`.

Important preserved digests from the integrated baseline:

- canonical fixture: `ede4457873700cc4bce1bb5fad29c89a4e25d2e6ca7ccd33c323a2ce8ac5809c`;
- approved redacted input: `430b6bd635d101340c52c41e65d66b55c8d443fbff4a252748dab504845e18ee`;
- evaluation definition set: `649b10f68d8a445e79c626efa63ede464cc19b7a82ffab5785c8dcd84b4f2683`;
- guidance pack: `06e260eda0c033de1207b87cd9bbe3366cb65b88aeaa691e85fb639974a8b0a9`.

The canonical checkpoint contains 14 candidates, 23 unique citations, and six ordered `fixture_reviewer` decisions. The prepared replay must always be labeled as replay/fixture evidence, not live AI output.

## 15. Current deployment and verification evidence

Stable URL: <https://contextfirst-nexus.vercel.app>

The final replay-only production reconciliation recorded:

- live analysis disabled;
- all live providers disabled/non-selectable;
- prepared replay available/selectable;
- provider transmission false;
- zero analysis POSTs and zero provider calls during release rehearsals;
- five serial stable-URL rehearsals passed;
- full verification, E2E, automated accessibility, performance budgets, performance regression tests, build, and diff checks passed at that release baseline.

Common commands:

```bash
npm run verify
npm run test:e2e
npm run test:a11y
npm run measure:performance -- --mode prepared-checkpoint
npm run build
```

Use the smallest relevant checks during iteration. Do not present old passing evidence as proof that later uncommitted changes still pass.

## 16. Task and milestone history

- TASK-001 through TASK-038 established the domain, fixture, state, provider boundary, review engine, export core, evaluation, security, accessibility, deployment, and replay-only release.
- TASK-039 simplified the analysis experience and removed practitioner-facing model selection.
- TASK-040 describes managed server-side provider routing/fallback and remains the next documented task, not an implemented fact.

`TASK_GRAPH.yaml` is the authoritative graph. Confirm its current status before starting or reporting task readiness.

## 17. Current worktree warning and known incomplete work

At the time this handoff was created, the main repository had substantial **uncommitted user work**. A new task must run `git status --short --branch` before editing and must preserve every existing modification and untracked file.

Recent work-in-progress areas include:

- simplified purpose and provider UI;
- document selection and processing UX;
- local PDF source extraction experiments;
- masking-review and source-drawer changes;
- review workspace and queue changes;
- contract and state changes;
- PDF.js worker assets and tests;
- updates to `plan.md`.

Known product gap:

- The integrated product was designed around a fixed fictional packet and deterministic replay.
- The user has now explicitly requested a real empty workspace accepting arbitrary 1..N PDFs.
- Recent WIP made the file picker and exact demo files behave more realistically.
- Arbitrary PDF text extraction is not yet reliably working.
- Scanned/image-only PDFs require OCR, which is not currently implemented.
- Arbitrary uploaded documents cannot truthfully produce trustworthy candidates, timeline, relationship map, review state, and export until extraction and analysis are connected end-to-end.

Do not hide this gap with fixture results, filename matching, fabricated analysis, or success labels. Fix the actual ingestion/analysis path or clearly distinguish a prepared demo from arbitrary upload.

## 18. UI/UX redesign direction

The user strongly prefers a clearer professional workspace inspired by the recent Replit concept. That concept is a **visual and interaction reference only**, not a technical or legal source of truth.

Useful ideas to adapt:

- compact persistent case navigation;
- a clear dashboard/case entry point;
- master-detail Documents view;
- masked source preview with an intentional-reveal modal;
- master-detail Analysis view with decisions anchored near the selected item;
- neutral relationship graph with node details;
- readable chronological reconstruction;
- export blocker checklist with direct remediation;
- concise statuses and obvious next actions;
- fewer giant stacked cards and less unnecessary vertical scrolling.

Corrections required before adopting the reference literally:

- Use **Evidence Map**, **Relationships**, or **Context Map**, not “Charge-Coercion Nexus.”
- Do not show a target such as “Labor Trafficking indicators” as though the system is evaluating a charge.
- Keep every graph and analysis label explicitly non-determinative.
- Do not display “AI suggested” when the current output came from deterministic replay.
- Preserve exact canonical candidate IDs, statuses, limitations, citations, and export rules.
- Preserve Purpose before external analysis and retain Trust/Audit access.
- Avoid a fixed five-document assumption.

Visual direction:

- one coherent design, not three alternatives;
- desktop-first for the hackathon judging flow, while preserving existing responsive/accessibility contracts;
- calm, modern, serious, humane, and evidence-centered;
- compact information density with strong hierarchy;
- restrained color used semantically;
- no forced cyan/teal “AI SaaS” look;
- no decorative AI gradients or developer-console aesthetic;
- typography and spacing suitable for long professional review sessions.

Reference locations:

- `/Users/rajpatil/Documents/1.0 UI/replit 1.0/`
- `/Users/rajpatil/Documents/call for code-hack26/contextfirst-nexus-figma-handoff`
- `/Users/rajpatil/Documents/call for code-hack26/contextfirst-nexus-lovable-handoff`
- `/Users/rajpatil/Documents/call for code-hack26/contextfirst-nexus-replit-ui-handoff`

## 19. Invariants that must not break during redesign

1. One canonical case-state owner.
2. No duplicated local candidate or review truth.
3. Exact provenance and source links.
4. Separate evidence nature, origin, support, and review status.
5. Unknown, limitations, missingness, and contradictions stay visible.
6. No legal determination, credibility assessment, or aggregate risk score.
7. No model/provider chooser for practitioners.
8. Prepared replay is clearly labeled and never presented as live AI.
9. Reveal remains intentional, justified, audited, and reversible.
10. Withdrawal invalidates only reachable downstream items and requires renewed review.
11. Export remains fail-closed with no override.
12. One immutable manifest drives semantic, JSON, and PDF output.
13. Safe share requires eligible selection and minimum-necessity confirmation.
14. No silent external transmission.
15. Existing security headers, CSP, keyboard, focus, and accessibility behavior remain intact.

## 20. Recommended next sequence

1. **Stabilize current WIP first.** Inspect the dirty worktree, understand every change, and avoid overwriting it.
2. **Make arbitrary intake truthful.** Support 1..N ordinary text PDFs, clear partial failures, and an explicit scanned/OCR-needed state.
3. **Connect analysis honestly.** Decide whether the next demo uses admitted live server-side AI, a fully local deterministic analyzer, or a clearly chosen prepared replay. Never disguise one as another.
4. **Create a UI inventory.** Map each existing component and command to the preferred navigation and master-detail layouts.
5. **Redesign the shell and Documents view first.** Validate locally in the browser before broad rollout.
6. **Redesign Analysis, Evidence Map, Timeline, and Export Gate incrementally.** Reuse existing logic and tests.
7. **Run focused tests after each slice**, then full verification when the flow is stable.
8. **Do not commit, push, or deploy unless the user explicitly asks.**

## 21. New-task startup checklist

In a fresh Codex task:

1. Open the repository at `/Users/rajpatil/Documents/call for code-hack26/contextfirst-nexus`.
2. Read this file completely.
3. Read `AGENTS.md`, `README.md`, `PROJECT_BRIEF.md`, `plan.md`, `decision-log.md`, and `TASK_GRAPH.yaml`.
4. Run `git status --short --branch` and preserve all WIP.
5. Inspect the relevant implementation, contracts, tests, and the actual local browser behavior.
6. Separate current facts from desired future behavior.
7. Update `plan.md` for meaningful work and obtain approval before major implementation when required by `AGENTS.md`.
8. Work locally first; show the user the result before commit/push/deploy unless explicitly authorized.

## 22. Copy/paste kickoff prompt for a new Codex task

```text
Continue ContextFirst Nexus from the existing repository:
/Users/rajpatil/Documents/call for code-hack26/contextfirst-nexus

First read completely:
- docs/PROJECT_HANDOFF.md
- AGENTS.md
- README.md
- PROJECT_BRIEF.md
- plan.md
- decision-log.md
- TASK_GRAPH.yaml

Then inspect git status and preserve every existing tracked and untracked change. Do not reset, clean, stash, commit, push, deploy, install packages, or modify production settings unless I explicitly approve it.

Treat the repository contracts, schemas, reducer, review engine, export core, audit behavior, and tests as the technical source of truth. Treat the Replit/Figma/Lovable screenshots only as UI references.

Current priorities:
1. make arbitrary 1..N PDF intake truthful and usable;
2. clearly distinguish parsing, OCR need, analysis, replay, and human review;
3. redesign the experience into a clear professional workflow using the existing backend/domain logic;
4. preserve privacy, provenance, human control, dependency-aware withdrawal, and fail-closed export;
5. never invent analysis or legal conclusions.

Start by reporting the current repository state, what is genuinely working, what is incomplete, and the smallest safe next implementation slice.
```

## 23. July 20–24 executive update

The project now has three distinct bodies of work:

1. the existing Codex-built functional application;
2. the Replit UI prototype and workflow reference;
3. the latest Lovable UI prototype.

The decision is **not** to start over.

The final application should:

- keep `contextfirst-nexus` as the functional and domain foundation;
- use the latest Lovable repository as the authoritative visual and interaction specification;
- use the Replit repository only as a secondary source for useful workflow details;
- port the new interface incrementally into the functional application;
- replace Lovable's disconnected fixtures and page-local state with the existing canonical contracts, state commands, review engine, export core, audit behavior, and provider boundary.

The hackathon objective is not merely to show many attractive pages. The
strongest demonstration is one truthful end-to-end chain:

> source document → traceable observation → Evidence Integrity Map → visible gap or conflict → practitioner action → human review → blocked or minimum-necessary safe handoff

The public app must remain available at:

<https://contextfirst-nexus.vercel.app>

That link has already been sent to the judges. Do not replace it with a new
final domain. Use a preview deployment for verification, then promote the
tested build to the existing Vercel project only after explicit approval.

## 24. Repository and reference hierarchy

### 24.1 Canonical functional application

- Local path: `/Users/rajpatil/Documents/call for code-hack26/contextfirst-nexus`
- GitHub: <https://github.com/rajpatilrobotics/contextfirst-nexus>
- Current local and remote `main` HEAD: `8f7a201`
- Commit: `feat: simplify guided demo workflow`
- Stack: Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS 4, Zod, PDF.js, React PDF, Vitest, Playwright, axe, Vercel
- Package manager: npm, with `package-lock.json`
- Role: technical and safety source of truth

This repository already contains the real domain contracts, reducer/state
commands, source/citation handling, masking behavior, deterministic fixture
and replay, review engine, dependency handling, export gate, canonical export
manifest, provider adapters, evaluation artifacts, tests, and deployment
configuration.

Do not discard or rewrite that architecture merely to reproduce the latest
visual design.

### 24.2 Authoritative current UI reference

- GitHub: <https://github.com/rajpatilrobotics/remix-of-remix-of-remix-of-01-remix-of-case-navigator>
- Visibility: private
- Default branch: `main`
- Reviewed HEAD: `0bca52afe26babe477ef37f4ed8f7df32c9fb135`
- Commit: `Compactified analysis lanes`
- Commit date: 2026-07-23
- Stack: TanStack Start, TanStack Router and Query, React 19, TypeScript, Vite, Zustand, Tailwind CSS 4, Radix UI, Sonner
- Role: authoritative visual and interaction specification, **not** the final backend or state architecture

Important named commits in this Lovable repository include:

- `1c9b92d` — `Fixed demo navigation flow`
- `338fcb6` — `Linked all dashboard cards`
- `0bca52a` — `Compactified analysis lanes`

Treat this exact HEAD as frozen visual reference unless the user explicitly
selects a newer UI version.

### 24.3 Replit UI and workflow reference

- GitHub: <https://github.com/rajpatilrobotics/Front-End-Focus>
- Reviewed HEAD: `133da26f41bccf0771cfa7a4027ffb94bdb36845`
- Commit: `fix: polish Evidence Map and remove prompt artifacts`
- Role: secondary reference for Evidence Map details and workflows that may be richer than the Lovable version

The Replit preview URL was:

<https://3bcb032d-85b6-4d92-990a-265665508db0-00-2gycd93hndmvv.pike.replit.dev>

It is temporary and may display “Run this app” or stop responding. Do not
depend on the preview being online.

### 24.4 Superseded Lovable repositories

Lovable remixes created new GitHub repositories instead of continuing to sync
to the first repository. Examples include:

- <https://github.com/rajpatilrobotics/case-navigator>
- <https://github.com/rajpatilrobotics/01-remix-of-case-navigator>
- later `remix-of-...` repositories

These are historical checkpoints. Do not merge every remix and do not treat
them as independent product branches. The repository in section 24.2 is the
current selected UI.

The local folders `case-navigator` and `01-remix-of-case-navigator` are stale
checkpoints, not the latest Lovable UI.

### 24.5 Screenshots and design references

Useful local references include:

- `/Users/rajpatil/Documents/1.0 UI/replit 1.0/`
- `/Users/rajpatil/Documents/1.0 UI/Lovable/`
- `/Users/rajpatil/Documents/call for code-hack26/ContextFirst-Lovable-Top-10`
- `/Users/rajpatil/Documents/call for code-hack26/design-audits/`
- `/Users/rajpatil/Documents/call for code-hack26/contextfirst-nexus-figma-handoff`
- `/Users/rajpatil/Documents/call for code-hack26/contextfirst-nexus-lovable-handoff`
- `/Users/rajpatil/Documents/call for code-hack26/contextfirst-nexus-replit-ui-handoff`

GitHub source is more reliable than a temporary preview or screenshot. Use
screenshots for visual comparison, not as technical truth.

## 25. Final integration decision

### Chosen approach

Use the existing functional `contextfirst-nexus` application and port the
Lovable UI into it.

### Rejected approach

Do not rebuild the full application from scratch inside the Lovable codebase.

Starting from Lovable would require reimplementing and revalidating:

- case state and revision handling;
- document intake and local PDF parsing;
- masking and intentional reveal;
- exact citations and provenance;
- human review commands;
- dependency-aware withdrawal;
- export readiness and fail-closed blockers;
- canonical JSON and PDF output;
- audit history;
- provider boundaries and evaluation;
- security, keyboard, focus, and accessibility behavior;
- tests and deployment configuration.

That would be slower, riskier, and easier to misrepresent during the
hackathon.

### Porting rule

Port presentation and interaction patterns, not incompatible application
architecture.

In particular:

- do not replace Next.js routing with TanStack Router;
- do not replace canonical `CaseState` with Lovable's small Zustand store;
- do not preserve page-local mock decisions as application truth;
- do not copy static counters or export blockers;
- do not copy fixture data over canonical data;
- do not add a dependency solely because Lovable used it;
- do adapt layouts, spacing, controls, master-detail patterns, content hierarchy, and semantic visual states.

Create typed adapters or view models where the Lovable component shape differs
from the existing contracts.

## 26. Agreed information architecture

The user explicitly does **not** want the feature destinations condensed.
Preserve the separate workspace screens.

### Public and entry screens

- Landing page
- Case Dashboard
- Trust & Safety

### Twelve case-workspace destinations

1. Purpose Brief
2. Documents and Source Health
3. Structured Analysis
4. Urgent Needs
5. Evidence Gaps
6. Interview Planner
7. Services & Referrals
8. Case Tasks
9. Notes & Journal
10. Evidence Integrity Map
11. Timeline
12. Export Gate

Also preserve:

- Audit Trail
- Dashboard return from the workspace
- Trust & Safety access

The Lovable screen still uses the historical label “Charge–Coercion Nexus” in
places. The user-facing final label should be neutral:

- **Evidence Integrity Map** is preferred;
- **Evidence Map**, **Relationships**, or **Context Map** are acceptable;
- do not imply a criminal charge or trafficking determination.

### Six-stage progress model

1. Purpose
2. Documents
3. Analysis
4. Planning
5. Review
6. Export

### Required navigation behavior

- Landing `Start Demonstration` → Case Dashboard
- Landing `Case Dashboard` → Case Dashboard
- Dashboard case card → that case's Purpose Brief
- Sidebar navigation preserves the active `caseId`
- Dashboard return is always available
- Unknown case IDs have a safe fallback

## 27. Current dashboard case truth

The latest Lovable dashboard shows:

- `REF-2024-0047-SYN` — M. Chen
- `REF-2024-0031-SYN` — A. Okafor
- `REF-2024-0029-SYN` — R. Salazar

Only M. Chen currently has a deep fixture in the Lovable prototype. The other
cards change the header but still expose M. Chen's underlying page data.

Until proper case-scoped fixtures exist:

- make A. Okafor and R. Salazar truthful read-only dashboard summaries; or
- create complete separate `CaseBundle` fixtures before allowing workspace entry.

Never show M. Chen evidence under another person's header.

For the hackathon, one deeply working synthetic case is better than three
misleading editable cases.

The existing functional fixture uses internal ID `CFN-DEMO-001`, while the
Lovable UI displays `REF-2024-0047-SYN`. Reconcile this intentionally. A safe
option is:

- keep the stable internal canonical ID;
- add a distinct display/reference number;
- never duplicate the same case into two independent state records.

Similarly, the existing canonical fixture has 14 candidates while the Lovable
prototype commonly displays six. Final counters must be derived from canonical
state, not copied from the prototype.

## 28. Priority differentiators

These are the strongest feature priorities for an elite hackathon submission.

### 28.1 Evidence Integrity Map — hero feature

The Map should:

- show evidence, observations, conflicts, gaps, support links, provenance, and dependency chains;
- use a deterministic, understandable layout;
- include selected-node details and exact citations;
- include a clear legend and compact filters;
- distinguish documented, reported, suggested, human-created, conflicting, insufficient, and unknown states;
- make gaps and contradictions visible without turning them into conclusions;
- avoid horizontal clipping at ordinary desktop widths;
- remain keyboard accessible;
- state clearly that the graph is evidence organization, not a trafficking or legal determination.

The Replit implementation is a particularly useful visual reference for this
feature.

### 28.2 Gap-to-action workflow

A reviewer should be able to convert a canonical gap into:

- an Interview question;
- a Document request;
- a Case task;
- a Compare-conflicting-sources action;
- a Preserve-as-Unknown decision.

The resulting object must appear in the corresponding real workflow and share
the same stable gap ID. A toast without a state change is not sufficient.

### 28.3 Truthful Source Health

Documents should expose:

- selected/checking/ready/failed state;
- page extraction coverage;
- unreadable or missing pages;
- scanned/OCR-needed limitations;
- masking and redaction status;
- source origin;
- exact citation availability;
- whether analysis has or has not occurred.

Unavailable evidence must never be represented as negative evidence.

### 28.4 Purpose-bound safe handoff

The handoff should preserve:

- declared authorized purpose;
- named recipient and recipient category;
- full practitioner handoff versus minimum-necessary safe share;
- required attestations;
- selected eligible fields;
- masking and review readiness;
- limitations and unresolved gaps;
- audit trace.

Export must remain blocked whenever the canonical state contains a critical
blocker.

### 28.5 One real evaluated AI path — only if permitted

Prefer one narrow, genuinely working and evaluated path over many decorative
AI buttons.

Any machine-assisted suggestion must:

- be labelled non-binding and unverified;
- retain exact sources and limitations;
- never become a case finding without an explicit practitioner decision;
- fail safely;
- have a small evaluation fixture;
- obey the provider admission and transmission rules.

The current public production truth remains replay-only. Do not turn on live
analysis, add credentials, change routing, or make effectiveness claims without
separate approval and verified admission evidence.

## 29. Selected Lovable UI behavior by screen

### 29.1 Landing

Preserve the polished institutional landing experience. Both `Start
Demonstration` and `Case Dashboard` should lead to the dashboard rather than
opening a case workspace directly.

### 29.2 Case Dashboard

Preserve:

- open-case and readiness summary;
- immediate-attention notice;
- synthetic case cards;
- full-card navigation;
- export readiness, pending review, urgent need, gap, task, document, and activity summaries.

All figures must be derived from case state. Cards that are not backed by a
complete fixture must be visibly read-only.

### 29.3 Purpose Brief

The current Lovable Purpose screen is a strong reference. Preserve:

- practitioner role;
- organization type;
- authorized purpose;
- supported workflow;
- intended recipient;
- recipient category;
- jurisdiction;
- source language;
- translation status;
- Full Practitioner Handoff;
- Minimum-Necessary Safe Share;
- required acknowledgements;
- prohibited determinations;
- gated `Record purpose & continue`.

Purpose completion must be meaningful application state, not local checkbox
decoration.

### 29.4 Documents and Source Health

Use a compact master-detail layout. Preserve:

- arbitrary 1..N PDF selection;
- no fixed filename or seven-file requirement;
- truthful parsing states;
- source/page coverage;
- masking review;
- exact masked source preview;
- intentional reveal with reason and audit;
- OCR-needed and partial-failure states;
- explicit `Start analysis` only when prerequisites are satisfied.

Do not show prepared replay output as though it came from newly selected PDFs.

### 29.5 Structured Analysis

Keep the latest compact Lovable design:

- Lane A — Trafficking Indicators
- Lane B — Non-Punishment Relevance
- Lane C — Protection & Urgency

Keep compact review filters:

- All
- Pending
- Accepted
- Edited
- Rejected
- Uncertain
- Conflict

Also preserve:

- search;
- origin filter;
- support-state filter;
- candidate master list;
- selected candidate detail;
- exact citations;
- limitations and dependencies;
- review actions.

The lane controls, status filters, and search area must not consume half of the
viewport. The latest Lovable commit specifically compacted this area.

If filtering removes the selected item from the result set, select the first
visible result or show a clear empty state. Never display a hidden item in the
detail panel.

### 29.6 Urgent Needs

Urgent needs should remain distinct from legal conclusions. Preserve:

- immediate/active/resolved status;
- practitioner ownership;
- safe-contact constraints;
- next action;
- due time;
- links to tasks and services where appropriate.

The app is not an emergency service and must not imply that it contacted a
provider or emergency responder.

### 29.7 Evidence Gaps

Preserve the strong master-detail layout and compact filters:

- All
- Open
- Investigating
- High Priority
- Export Blockers

Always communicate:

> A gap is not proof. Missing evidence is not negative evidence.

Show:

- gap type and priority;
- why it matters;
- consequence if unresolved;
- related observations and Map nodes;
- sources already reviewed;
- creating dependency;
- export effect;
- real gap-to-action controls.

### 29.8 Interview Planner

Preserve:

- collapsible Session Setup;
- interview purpose;
- interviewer;
- language and interpreter;
- accessibility;
- safe-contact constraints;
- consent confirmation;
- trauma-informed guidance;
- status and gap filters;
- question master list and selected detail;
- neutral suggested wording;
- why the question may help;
- known source context;
- sensitivity note;
- practitioner approval, edit, defer, remove, and inappropriate decisions.

Questions must reference canonical `GAP-*` IDs. Do not maintain a separate
invented `EG-*` dataset, and do not hard-code “gaps covered.”

Never infer dishonesty from hesitation, uncertain memory, inconsistency,
missing information, or refusal. Questions must remain non-leading and
non-accusatory. A person may pause or stop.

### 29.9 Services & Referrals

Use:

- compact filters above the result list;
- provider cards in a left master column;
- selected-provider details on the right;
- hours;
- languages;
- accessibility;
- eligibility;
- safe-contact method;
- verification source and date;
- referral status.

Every demo provider is fictional. State clearly:

- listing does not guarantee eligibility, capacity, or availability;
- the provider must be independently verified;
- no information is transmitted without explicit confirmation and consent.

Stored status IDs and displayed labels must use one normalized enum.

### 29.10 Case Tasks

Tasks should be connected to:

- originating gap, urgent need, interview item, document request, or review decision;
- owner;
- due date;
- priority;
- status;
- export impact where applicable.

Task totals and overdue counts must be derived from shared state.

### 29.11 Notes & Journal

Separate:

- private practitioner notes;
- source-backed observations;
- audit events.

Notes must not silently become evidence or accepted findings. Preserve author,
time, origin, and visibility.

### 29.12 Evidence Integrity Map

Use the Map as the main visual differentiator. Preserve selected-node details,
source citations, support/conflict/gap/dependency edges, legend, filters, and
safe explanatory language.

Do not use the Map to score a person or determine trafficking, guilt,
credibility, eligibility, prosecution, or sentence.

### 29.13 Timeline

Use:

- dates on the left;
- spaced event cards on the right;
- exact, approximate, range, conflicting, and unknown labels;
- information inside bounded cards;
- source citations;
- selected-event detail and actions.

An unknown date belongs in an explicit undated section. Never give it an
arbitrary chronological sort date.

Buttons must work or be disabled and labelled as unavailable/demo-only. Do not
leave prominent silent buttons.

### 29.14 Export Gate

Readiness must derive from the same canonical state as every upstream screen.
Blockers include:

- pending candidate decisions;
- unresolved export-blocking gaps;
- invalidated dependencies;
- source or masking failures;
- missing purpose or recipient;
- incomplete attestations;
- missing minimum-necessary selection.

Resolving a real blocker should update Export Gate immediately. There is no
critical-blocker override.

### 29.15 Audit Trail

Record consequential actions with safe summaries:

- purpose and attestation changes;
- reveal/mask events;
- analysis/replay run identity;
- review decisions;
- gap conversions;
- withdrawals and renewed review;
- referral status changes;
- export readiness and generation.

Never place raw sensitive source content into audit summaries.

### 29.16 Trust & Safety

Preserve the seven designed tabs:

1. System Card
2. Safety Lab
3. Evaluation
4. Guidance
5. Audit
6. Report
7. AI Boundaries

Claims must match actual evidence. Do not display invented accuracy,
effectiveness, partner, adoption, or provider-admission claims.

## 30. What the latest Lovable prototype actually implements

Verified at HEAD `0bca52a`:

- landing routes to the dashboard;
- all three dashboard cards are full-card links;
- dashboard urgent-needs navigation works;
- case shell reads `caseId`, changes header/profile, preserves `caseId` in sidebar links, and has an unknown-case fallback;
- secondary case headers display a read-only label;
- Structured Analysis uses compact 44px lane controls and combined compact toolbars;
- Evidence Gaps has compact filters, summaries, master-detail content, export impact, and conversion controls;
- Interview Planner has session setup, guidance, filters, master-detail review, provenance, context, and sensitivity concepts;
- Services & Referrals has filters above a master list and a detail pane;
- Timeline has a left-side date rail and spaced event cards;
- Documents includes Source Health concepts;
- the Map, Export Gate, Audit, and Trust/Safety screens are present.

However, this is still a UI prototype:

- no production backend or database;
- no authentication or tenancy;
- no real case-scoped persistence;
- no real uploaded-document storage or OCR;
- no trustworthy end-to-end analysis of arbitrary PDFs;
- no external provider contact/transmission;
- no generated canonical handoff;
- many controls are local-only, demo toasts, disabled, or unconnected.

Its `package.json` has development, build, lint, and format commands but no
dedicated typecheck or test script. No CI verification was found. It also has
package-manager ambiguity (`bun.lock` while its README mentions npm).

## 31. Critical Lovable defects that must not be ported

### P1 — Cross-case data leakage/misattribution

The shell changes the case header, but every feature page consumes the same
M. Chen fixture. Zustand state is not keyed by `caseId`. “Read-only” is a label,
not an enforced permission.

Required fix:

- one canonical `CaseBundle` or equivalent keyed by `caseId`; and
- case-scoped commands/state; or
- prevent secondary case workspace entry until complete fixtures exist.

### P1 — Analysis and Export are disconnected

Analysis decisions use component-local state. Export uses static blockers and
static pending counts. Accepting every candidate does not change readiness.

Required fix:

- derive Analysis and Export from the same canonical state and commands.

### P1 — Evidence Gaps and Interview are disconnected

Interview uses separate seed data and `EG-*` identifiers. Canonical gap records
use `GAP-*`. Coverage is hard-coded.

Required fix:

- generate/link questions through canonical gap commands and derive coverage.

### P2 — Incomplete reset

Reset clears only Zustand state while Analysis and Interview local state can
remain visible.

Required fix:

- one resettable canonical case state.

### P2 — Hidden filtered selection

The Analysis detail pane can continue showing an item removed by the active
filter.

Required fix:

- validate selection against the filtered collection.

### P2 — Timeline integrity

One “Date unknown” event has a chronological sort key, one conflict
self-references, and several actions have no handlers.

Required fix:

- explicit undated grouping, correct conflict links, and working or honestly
  disabled actions.

### P2 — Services status mismatch

Fixture values such as `offered` or `in-progress` do not match title-cased
select values.

Required fix:

- one stable enum with separate display labels.

### P2 — Route type safety

Dynamic sidebar destinations are forced through a route cast.

Required fix:

- explicit typed route mapping in the final framework.

### P3 — Services accessibility

The master list mixes `listbox` semantics with focusable button options without
complete active-descendant/focus behavior.

Required fix:

- implement and test correct keyboard and screen-reader interaction.

## 32. Current functional repository state

At the time of this update:

- branch: `main`
- local HEAD: `8f7a201`
- remote-tracking state: `main...origin/main`, no reported ahead/behind count
- the worktree is substantially dirty;
- no safety branch or WIP commit has yet been created;
- all current modifications and untracked files belong to the user and must be preserved.

Current `git status --short`:

```text
 M features/analysis/provider-selection/provider-selection-panel.tsx
 M features/analysis/run-controller/index.ts
 M features/documents/analysis-prerequisites.tsx
 M features/documents/document-cards.tsx
 M features/documents/documents-workspace.tsx
 M features/documents/index.ts
 M features/documents/masking-review-panel.tsx
 M features/documents/pdf-selection-panel.tsx
 M features/documents/processing-stage-list.tsx
 M features/purpose/case-purpose-brief-form.tsx
 M features/purpose/purpose-workspace.tsx
 M features/review/candidate/review-workspace.tsx
 M features/review/queue/review-queue.tsx
 M features/review/source/source-drawer.tsx
 M lib/contracts/index.ts
 M lib/documents/index.ts
 M lib/documents/pdf-source-service.ts
 M lib/state/index.ts
 M plan.md
 M public/vendor/pdfjs/pdf.worker.min.mjs
 M scripts/copy-pdfjs-assets.mjs
 M tests/components/documents/documents.test.tsx
 M tests/components/provider/provider-selection.test.tsx
 M tests/components/purpose/purpose-form.test.tsx
 M tests/components/purpose/purpose-workspace.test.tsx
 M tests/components/review/candidate/review-workspace-focus.test.tsx
 M tests/components/review/queue/review-queue.test.tsx
 M tests/components/review/source/source-drawer.test.tsx
 M tests/e2e/task-039-simplified-analysis.spec.ts
 M tests/unit/documents/pdf-source-service.test.ts
 M tests/unit/export/core/export-core.test.ts
?? AGENT_HANDOFF.md
?? docs/PROJECT_HANDOFF.md
?? lib/analysis/local-source-extraction.ts
?? public/vendor/pdfjs/pdf.worker.legacy-6.1.200.min.mjs
?? tests/components/documents/local-analysis-safety.test.tsx
?? tests/unit/analysis/
?? tests/unit/state/local-document-masking.test.ts
```

This handoff itself is currently the untracked
`docs/PROJECT_HANDOFF.md` entry in that list.

The modified `plan.md` already begins with:

> Lovable UI integration and hackathon completion, 2026-07-23

Read that section before creating a replacement plan. Update it rather than
silently discarding it.

Before integration:

1. inspect and explain the dirty diff;
2. determine which WIP is valid;
3. propose a safety branch and WIP commit;
4. obtain explicit approval before creating the commit;
5. never reset, clean, force-push, or overwrite the WIP.

## 33. Dependency and local-disk status

With explicit user approval, generated dependency and build directories inside
the hackathon workspace were deleted on 2026-07-24:

- `node_modules`
- `.next`
- `.output`
- other discovered generated cache directories in scope

No source code, Git repository, branch, uncommitted file, or Codex task history
was deleted.

After cleanup:

- approximately 15 GiB was available;
- the hackathon workspace fell from roughly 11 GiB to roughly 209 MiB;
- the canonical functional repository has no installed `node_modules`;
- build caches are absent.

Before running checks in `contextfirst-nexus`, use its npm lockfile and install
dependencies:

```bash
npm install
```

Installation is a network and disk write. Explain it and obtain any required
approval in the new task before running it.

Avoid recreating dependency folders in dozens of old task worktrees. The
previous workspace contained many `contextfirst-nexus-task-*` worktrees with
duplicated dependencies. Prefer the main repository or at most one bounded
integration worktree unless the user approves otherwise.

Approximately 24 GiB of Codex session history remains under
`/Users/rajpatil/.codex/sessions`. It contains Codex conversation/task logs,
not application source, and was intentionally preserved.

## 34. Functional repository verification commands

The canonical application provides:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run test:contracts
npm run test:components
npm run build
npm run verify
npm run test:e2e
npm run test:a11y
npm run measure:performance -- --mode prepared-checkpoint
```

Do not claim that the current dirty worktree passes based on the older release
baseline. Reinstall dependencies and establish a fresh baseline after the WIP
is protected.

Use focused checks after each integration slice. Run the full suite before
deployment.

## 35. Recommended implementation sequence

### Phase 0 — Protect and baseline

1. Read this handoff and the required repository documents.
2. Inspect the dirty diff and current running behavior.
3. Propose a safety branch and WIP commit.
4. Obtain explicit approval before creating or committing.
5. Reinstall dependencies.
6. Run focused baseline checks, then `npm run verify`.
7. Record failures as pre-existing versus newly introduced.

### Phase 1 — Define integration contracts

1. Inventory canonical contracts and state commands.
2. Inventory every Lovable route and component.
3. Create a screen-to-command and screen-to-state mapping.
4. Define a case-scoped `CaseBundle` or equivalent without duplicating truth.
5. Reconcile internal case IDs and display reference numbers.
6. Define adapters from canonical data to Lovable-style view models.
7. Decide which secondary cases remain read-only.

### Phase 2 — Shell, landing, and dashboard

1. Port the visual system and global shell.
2. Implement Landing → Dashboard.
3. Implement case cards and safe workspace routing.
4. Preserve the active `caseId`.
5. Enforce truthful read-only secondary cases.
6. Add routing and unknown-case tests.

### Phase 3 — Purpose and Documents

1. Port Purpose Brief while reusing canonical purpose commands.
2. Port Documents/Source Health.
3. Finish truthful arbitrary 1..N text-PDF intake.
4. Preserve scanned/OCR-needed and partial-failure states.
5. Preserve masking, intentional reveal, and audit.
6. Connect the real analysis prerequisite action.

### Phase 4 — Analysis, urgent needs, and gaps

1. Port compact lanes and review filters.
2. Bind every count and status to canonical state.
3. Port Urgent Needs without implying emergency response.
4. Port Evidence Gaps.
5. Implement real gap-to-action commands.
6. Test filtered selection and dependency effects.

### Phase 5 — Planning

1. Port Interview Planner using canonical gaps and questions.
2. Port Services & Referrals with normalized state and truthful no-transmission language.
3. Port Case Tasks and Notes & Journal.
4. Connect created actions across screens.
5. Add keyboard and accessibility tests.

### Phase 6 — Review

1. Port Evidence Integrity Map.
2. Bind nodes and edges to canonical evidence and dependencies.
3. Port Timeline with explicit undated grouping.
4. Preserve citations, limitations, and conflict truth.
5. Make all actions work or label them unavailable.

### Phase 7 — Export, Trust, and Audit

1. Derive Export Gate entirely from canonical state.
2. Preserve fail-closed behavior and no override.
3. Port full handoff and minimum-necessary safe share.
4. Preserve one immutable manifest for semantic, JSON, and PDF output.
5. Port Audit Trail and Trust & Safety tabs.
6. Reconcile claims with evaluation and provider truth.

### Phase 8 — Optional admitted AI path

Only after the full deterministic/replay workflow works:

1. select one narrow path;
2. verify credentials and transmission policy;
3. evaluate it;
4. obtain admission and deployment approval;
5. keep human review consequential;
6. preserve a safe unavailable/replay path without misrepresentation.

### Phase 9 — Release

1. Run unit, contract, component, E2E, accessibility, build, and focused performance checks.
2. Test the complete M. Chen judge journey.
3. Verify responsive and keyboard behavior.
4. Deploy a preview.
5. Inspect the preview manually.
6. Obtain explicit production-deployment approval.
7. Promote to the existing Vercel project and preserve
   `https://contextfirst-nexus.vercel.app`.

## 36. Strongest hackathon demonstration

The primary judge path should be short, coherent, and real:

1. Open the landing page.
2. Start the demonstration and reach the Case Dashboard.
3. Open the M. Chen synthetic case.
4. Confirm purpose, recipient, and required acknowledgements.
5. Inspect document Source Health and a masked exact source.
6. Start the admitted replay/local analysis path explicitly.
7. Review one source-linked candidate.
8. Open the Evidence Integrity Map and show its sources, support, conflict, and gap.
9. Convert a gap into an interview question or task.
10. Show the created action in the target screen.
11. Inspect a conflicting or unknown Timeline event.
12. Show Export Gate blocked by real unresolved state.
13. Resolve a blocker and show readiness change.
14. Prepare a minimum-necessary safe handoff.
15. Show Audit Trail and Trust/Safety evidence.

Every visible state in this demonstration must be connected. Avoid spending
time on secondary cases until this path works end to end.

## 37. Final-app acceptance criteria

The integrated hackathon app is ready only when:

- the latest selected UI is recognizable and consistently applied;
- all twelve workspace destinations exist separately;
- the primary case works end to end;
- case state is isolated by `caseId`;
- secondary cases are truthful and read-only unless fully implemented;
- all counts and blockers are derived, not hard-coded;
- every material observation has exact provenance;
- evidence nature, origin, support, and review status remain distinct;
- uncertainty, conflict, limitations, and unknowns remain visible;
- gap conversions create real downstream records;
- Interview questions use canonical gaps;
- Timeline does not invent dates;
- Services does not imply provider verification or transmission;
- human decisions update dependencies and export readiness;
- reset restores the whole active case consistently;
- critical export blockers fail closed;
- minimum-necessary share requires explicit selection and confirmation;
- one canonical manifest drives semantic, JSON, and PDF output;
- Audit Trail records consequential actions safely;
- no legal, credibility, guilt, trafficking-status, eligibility, prosecution, sentence, or person-risk determination is made;
- the production link remains unchanged;
- tests and manual judge-path verification pass.

## 38. Actions that still require explicit approval

Do not perform these merely because they are listed as future work:

- create a safety branch;
- commit or push the current WIP;
- install dependencies if approval is required by the environment;
- add a new package;
- add or use provider credentials;
- enable live analysis;
- transmit source documents externally;
- change Vercel project settings;
- deploy to production;
- delete worktrees, branches, files, histories, or repositories;
- force-push, reset, clean, or rewrite history.

Read-only inspection and a written plan should come first.

## 39. New-task startup checklist, updated 2026-07-24

In the new Codex task:

1. Open `/Users/rajpatil/Documents/call for code-hack26/contextfirst-nexus`.
2. Read `docs/PROJECT_HANDOFF.md` completely, including sections 23 onward.
3. Read `AGENTS.md`, `README.md`, `PROJECT_BRIEF.md`, `plan.md`,
   `decision-log.md`, `TASK_GRAPH.yaml`, and relevant tests/contracts.
4. Run read-only `git status --short --branch`, `git diff --stat`, and focused diff inspection.
5. Verify the latest Lovable HEAD is still `0bca52a` before treating it as the UI source.
6. Do not use the stale local Lovable clones as the selected UI.
7. Report:
   - what works in the functional app;
   - what the current WIP changes;
   - what Lovable provides visually;
   - the smallest safe integration slice;
   - the tests for that slice.
8. Update the existing integration section at the top of `plan.md`.
9. Present the plan in simple language and wait for approval before major coding.
10. Protect the dirty worktree before implementation, but commit only after explicit approval.

## 40. Copy/paste kickoff prompt for the next Codex task

```text
Continue ContextFirst Nexus from:
/Users/rajpatil/Documents/call for code-hack26/contextfirst-nexus

First read completely:
- docs/PROJECT_HANDOFF.md
- AGENTS.md
- README.md
- PROJECT_BRIEF.md
- plan.md
- decision-log.md
- TASK_GRAPH.yaml

The authoritative functional application is:
https://github.com/rajpatilrobotics/contextfirst-nexus

The authoritative UI reference is:
https://github.com/rajpatilrobotics/remix-of-remix-of-remix-of-01-remix-of-case-navigator
Reviewed UI commit: 0bca52afe26babe477ef37f4ed8f7df32c9fb135

The Replit repository is only a secondary workflow reference:
https://github.com/rajpatilrobotics/Front-End-Focus
Reviewed Replit commit: 133da26f41bccf0771cfa7a4027ffb94bdb36845

Do not rebuild the application from scratch. Keep the existing Next.js
contracts, canonical case state, commands, review engine, source/citation
handling, masking and reveal behavior, export core, audit behavior, provider
boundary, tests, and Vercel project. Port the Lovable presentation and
interaction patterns into that functional foundation.

The current functional worktree is dirty. Preserve every tracked and untracked
change. Do not reset, clean, stash, commit, push, deploy, install packages,
modify production settings, add credentials, or enable live analysis unless I
explicitly approve the relevant action.

Generated dependencies and build caches were intentionally removed to recover
disk space. The functional repository uses npm and currently needs dependencies
reinstalled before tests or builds can run.

Start with read-only reconnaissance:
1. inspect git status and the dirty diff;
2. map existing functional capabilities to every Lovable screen;
3. identify what can be reused and what genuinely needs implementation;
4. update the existing Lovable integration section in plan.md;
5. propose a small, testable first integration slice;
6. wait for my approval before major implementation.

Non-negotiable requirements:
- keep all twelve workspace destinations separate;
- use Evidence Integrity Map as the neutral hero feature;
- connect gap-to-action, Source Health, Analysis, Interview, Timeline, Tasks,
  Export, and Audit through one canonical case-scoped state;
- never place M. Chen evidence under another case header;
- never invent analysis, dates, citations, provider transmission, or legal
  conclusions;
- preserve human review, privacy, provenance, uncertainty, limitations,
  dependency-aware withdrawal, fail-closed export, and minimum-necessary share;
- keep the final public app at https://contextfirst-nexus.vercel.app.

First report what you found and the smallest safe next step. Do not start a
broad rewrite.
```
