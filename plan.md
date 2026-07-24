# Exact Lovable UI transplant correction, 2026-07-24

## 1. Goal

Make every judge-visible screen match the approved Lovable repository at
commit `0bca52afe26babe477ef37f4ed8f7df32c9fb135` as closely as the same
framework can render it, while preserving the working canonical ContextFirst
state, commands, PDF processing, review, audit, export, and safety behavior.

## 2. Problem

The deployed application at commit `fbb23ee` is a hybrid. The prior pass
mapped Lovable colors and typography onto legacy Codex components and
hand-recreated page layouts. It did not transplant Lovable's actual shells,
shared UI system, route markup, spacing, or responsive composition.

The 2026-07-24 side-by-side audit confirmed material differences on Landing,
Dashboard, and Structured Analysis, and source comparison confirmed the same
pattern across the remaining routes. This is an implementation-strategy
error, not a Vercel cache or deployment error.

## 3. Proposed solution

Run one focused presentation-transplant phase:

- Treat the Lovable JSX, class structure, styles, section order, spacing,
  controls, and responsive layouts as the immutable presentation source.
- Keep Next.js routing and the existing canonical ContextFirst domain layer.
- Connect canonical selectors and commands to the transplanted UI through
  thin route-specific view-model adapters.
- Do not embed legacy workspaces inside Lovable-looking wrappers.
- Do not copy Lovable's Zustand store, static counters, fake mutations, mock
  export truth, or provider-transmission behavior.
- Keep the current production deployment unchanged until the exact-UI branch
  passes visual review and the user explicitly approves deployment.

## 4. Files to change

- `app/globals.css`
- `app/page.tsx`, `app/dashboard/page.tsx`, `app/trust/page.tsx`
- `app/case/demo/**/page.tsx`
- `components/marketing/`, `components/shell/`, and a faithful port of
  Lovable's shared `nexus-ui` presentation components
- Judge-visible feature presentation components under `features/`
- Small adapter modules that map canonical `CaseState` to Lovable display
  models
- Focused tests only where presentation wiring changes behavior

Canonical contracts, reducer semantics, PDF pipeline, audit rules, export
engine, and safety boundaries should change only if an adapter exposes a real
contract mismatch.

## 5. Step by step tasks

1. Create a new local integration branch from clean `main`.
2. Port Lovable's global styles and exact marketing/workspace shells.
3. Port the exact Lovable JSX and classes for every route.
4. Replace TanStack links with Next links and fixture/Zustand reads with
   canonical view-model adapters.
5. Wire each supported control to the existing canonical command; keep
   unsupported controls truthfully disabled.
6. Remove legacy presentation from judge-visible routes while retaining the
   domain logic behind it.
7. Capture matching-viewport screenshots of the Lovable reference and the
   corrected app, compare them side by side, and fix visible differences.
8. Stop after local verification. Do not commit, push, or deploy without
   explicit approval.

## 6. Acceptance criteria

- Landing, Dashboard, shell, and every workspace route use Lovable's actual
  layout hierarchy rather than a Lovable-inspired Codex layout.
- At the same viewport and state, section order, major dimensions, spacing,
  typography, borders, radii, controls, and responsive composition match the
  approved Lovable source.
- Differences are limited to canonical live values, truthful loading/error
  states, and compact safety disclosures required by the functional app.
- No parallel Zustand or fixture domain store is introduced.
- Existing Purpose, Documents, Analysis, Gaps, planning, Nexus, Timeline,
  Export, Audit, Trust, reset, persistence, and source-reveal behavior remains
  functional.
- No judge-visible route renders the old generic `cfn-*` workspace layout.
- Production remains untouched until the user reviews the local comparison.

## 7. Testing plan

- Run `npm run typecheck`.
- Run focused component tests for shell, Dashboard, Purpose, Documents,
  Analysis, Gaps, planning workflows, Export, reset, and persistence.
- Run `npm run build`.
- Browser-smoke every judge-visible route and the main demonstration flow.
- Capture same-viewport side-by-side screenshots for Landing, Dashboard,
  Purpose, Documents, Analysis, Gaps, Interview, Services, Nexus, Timeline,
  Export, Audit, and Trust.
- Run `git diff --check`.

Broad test suites are not required unless focused checks expose a shared
regression.

## 8. Open questions

- Implementation requires explicit approval of this corrected transplant
  plan.
- Commit, push, and production deployment remain separate approval gates.

# Lovable UI integration and hackathon completion, 2026-07-23

## Read-only reconnaissance checkpoint, 2026-07-24

This checkpoint records the verified starting point for the requested
integration. It supersedes older source-reference, readiness, and
arbitrary-upload statements later in this file wherever they conflict. No
application code, dependency, branch, deployment, or production setting was
changed during reconnaissance.

### 1. Goal

Integrate the latest Lovable presentation into the existing functional
Next.js application without replacing its canonical contracts, reducer,
commands, selectors, audit trail, replay boundary, or fail-closed export
engine.

The reviewed Lovable reference is the private repository
`rajpatilrobotics/remix-of-remix-of-remix-of-01-remix-of-case-navigator` at
commit `0bca52afe26...` (`Compactified analysis lanes`, 2026-07-23). It is a
visual and interaction reference, not a second runtime or state architecture.

### 2. Problem and verified starting state

- Git is on `main` at `8f7a201`, exactly aligned with `origin/main`
  (`0` ahead, `0` behind).
- The worktree is materially dirty: 31 tracked files are modified (about
  2,479 insertions and 247 deletions) and 7 paths are untracked.
- `git diff --check` passes, but `node_modules` is absent. The dirty WIP has
  not received a fresh typecheck, lint, test, build, accessibility, or browser
  verification and must not be described as verified.
- The committed application is a coherent, synthetic, replay-only workflow:
  landing; Purpose Brief; exact seven-PDF fixture intake and local PDF.js
  extraction; coverage and masking; deterministic replay; source-grounded
  human review; dependency invalidation; Timeline and Nexus views; fail-closed
  JSON/PDF export from one immutable manifest; audit; and Trust/Safety.
- OpenAI, Gemini, and Mistral adapters exist, but every live provider remains
  unadmitted and the public product remains replay-only. TASK-040 is the
  separate ready task for managed provider routing and is outside this UI
  phase.
- The dirty WIP adds browser-local intake for 1–25 PDFs, readable/image-only
  page states, approved masking, privacy checks, and neutral source-excerpt
  review candidates. It does not yet provide substantive arbitrary-document
  analysis or export.
- The frozen product brief and DEC-004 authorize only the bundled synthetic
  packet, while the dirty WIP and older plan text describe arbitrary PDF
  intake. Higher-authority product truth wins until this conflict is explicitly
  reconciled and approved.
- The task graph has no UI-integration task packet. A bounded packet and
  exclusive write scope are required before implementation, and they must not
  overlap TASK-040.

### 3. Lovable UI-to-functional-code mapping

| Lovable destination | Functional foundation in this repository | Integration classification |
| --- | --- | --- |
| Landing | Existing safety-boundary landing | Visual port and route to Dashboard |
| Case Dashboard | No canonical case collection | Small real implementation; only M. Chen enters the deep workspace |
| Purpose Brief | Validated canonical form and command | Primarily visual port |
| Documents & Source Health | Strong bundled-fixture flow plus unverified local-PDF WIP | Visual port; WIP policy and verification remain separate |
| Structured Analysis | Canonical candidates, lanes, queue, citations, decisions, and source drawer | Visual/master-detail port over existing selectors |
| Urgent Needs | No canonical model | Real contracts, commands, audit, and cross-links required |
| Evidence Gaps | Canonical context-gap candidates and responses | Visual port plus real gap-to-action commands |
| Interview Planner | Missing | Real implementation tied to canonical `GAP-*` identifiers |
| Services & Referrals | Missing | Real implementation with fictional-provider and no-transmission rules |
| Case Tasks | Missing | Real shared state, commands, ownership, status, and due dates |
| Notes & Journal | Missing | Real implementation kept separate from evidence and audit truth |
| Evidence Integrity Map | Dependencies, citations, and Nexus selectors exist | New neutral visual route driven by canonical data |
| Timeline | Canonical selector and component exist | Route and visual port, including explicit undated handling |
| Export Gate | Canonical blockers, manifest, preview, and local JSON/PDF renderers | Visual port after the input/export policy is reconciled |
| Audit Trail | Canonical audit events exist | Separate filtered presentation |
| Trust & Safety | System Card, admission truth, Safety Lab, guidance, and reports | Visual port with current truthful copy |

The Lovable shell, editorial color and typography tokens, compact
master-detail layouts, cards, filters, badges, navigation, and responsive
composition need visual porting. Lovable's Zustand fixtures, static counters,
toast-only actions, fixed graph data, mock exports, route casts, and
component-local review decisions must not be copied as functional truth.

### 4. Smallest safe proposed solution

#### Phase 0 — approval and baseline protection

1. Obtain explicit approval before creating a safety branch, committing the
   dirty worktree, installing dependencies, or running any networked setup.
2. Preserve the WIP without rewriting history, then run the smallest focused
   local-PDF tests and the existing verification commands.
3. Reconcile bundled-fixture-only product truth versus arbitrary local PDF
   intake. Record any approved product change in the authoritative brief,
   decision log, contracts, and export policy before relying on it.
4. Create and approve a bounded UI-integration task packet with exclusive
   write scope that does not overlap TASK-040.

#### Phase 1A — first implementation slice after approval

1. Port only the Lovable visual tokens, institutional landing, global shell,
   six-stage tracker, and a truthful Case Dashboard.
2. Keep `CFN-DEMO-001` as the stable internal identifier and treat the Lovable
   case reference as display metadata.
3. Allow only the complete M. Chen fixture to enter the existing functional
   workspace. Show secondary cases as visibly read-only summaries with no
   workspace link and no possibility of M. Chen data leakage.
4. Preserve the existing Purpose, Documents, Review, Export, Trust,
   `CaseStateProvider`, reducer, commands, reset, and API behavior.
5. Derive displayed progress and counts from canonical state. If a value is
   unavailable, say so; never copy Lovable's static counts.
6. Keep not-yet-integrated destinations visibly unavailable rather than
   creating blank or deceptive routes. Add each as a real routed feature in a
   later approved slice.

### 5. Files for the first implementation slice

Expected scope, subject to the approved task packet:

- `app/page.tsx` and a bounded Dashboard route.
- `app/globals.css` for ported visual tokens.
- `components/shell/` for the stage tracker and typed navigation.
- A small dashboard feature/view-model module that exposes display metadata
  and derives primary-case values from canonical state.
- Focused unit, component, accessibility, and end-to-end tests for only this
  slice.

Do not change provider routing, export policy, arbitrary-PDF contracts, or
new support-workflow domain state in Phase 1A.

### 6. Acceptance criteria for Phase 1A

- Both landing calls to action open the Dashboard.
- Dashboard cards are keyboard-operable, responsive, and truthful.
- Only the complete synthetic primary case can enter the workspace.
- Secondary cases remain read-only and cannot expose primary-case data.
- Active case identity is preserved through supported workspace navigation;
  unknown case identifiers fail safely.
- Existing Purpose → Documents → Review → Export and Trust behavior remains
  functional.
- Reset still dispatches the single canonical `reset_case` command.
- Counts and progress derive from `CaseState`; no parallel Zustand or
  page-local domain store is introduced.
- There are no dead links, fake actions, copied static claims, or blank route
  stubs.
- Keyboard focus, screen-reader semantics, reduced motion, zoom, and 320 px
  reflow remain usable.

### 7. Testing plan

After dependency installation is separately approved:

1. Re-run `git diff --check` and capture a clean baseline.
2. Run focused tests for the dirty local-PDF WIP before UI integration.
3. Add and run focused shell, Dashboard, routing, state-provider, read-only
   case, unknown-case, and reset tests.
4. Run regressions for Purpose, Documents, Review, Export, and Trust.
5. Run `npm run typecheck`, `npm run lint`, `npm run test:unit`,
   `npm run test:contracts`, `npm run test:components`, and `npm run build`.
6. Run Playwright for landing → Dashboard → primary Purpose, blocked secondary
   cases, case-preserving navigation, unknown-case fallback, reset, and the
   existing guided demo.
7. Run automated accessibility checks plus manual keyboard, focus, reduced
   motion, 320 px reflow, zoom, and macOS VoiceOver checks.
8. Verify the arbitrary-PDF WIP on a separate track, including provenance and
   export-policy tests, before calling it end-to-end functional.

### 8. Open questions and approval gates

- Approve or reject the Phase 0 safety branch and local WIP commit. No branch
  or commit has been created.
- Approve dependency installation before the planned test matrix. No package
  has been installed.
- Decide whether the product remains bundled-fixture-only or formally adopts
  arbitrary browser-local PDFs; the current authoritative documents and WIP
  disagree.
- Approve a new UI-integration task packet and write scope before Phase 1A.
- Live-provider work, credentials, spend, preview deployment, and production
  deployment remain separate decisions and are not authorized by this plan.

## 1. Goal

Ship one fully demonstrable ContextFirst Nexus application at the existing
`https://contextfirst-nexus.vercel.app` URL by combining:

- the Lovable interface from `rajpatilrobotics/case-navigator`; and
- the tested contracts, state engine, document processing, review logic,
  export gate, audit, safety, evaluation, and replay path already implemented
  in `rajpatilrobotics/contextfirst-nexus`.

The result should look like the Lovable product while behaving like the
working ContextFirst application.

## 2. Problem

- `case-navigator` contains the preferred interface and all intended routes,
  but its data is static synthetic fixture data and most actions only update
  component or Zustand memory.
- The Structured Analysis Lovable change is present in GitHub at `135e3bd`,
  but the later Evidence Gaps redesign and proposed Interview Planner
  enhancement are not in GitHub.
- `contextfirst-nexus` contains the valuable working domain core and the
  existing Vercel project, but its presentation layer is not the desired UI.
- The local `contextfirst-nexus` checkout contains substantial uncommitted,
  typechecking arbitrary-PDF and local-analysis work. It must be preserved
  before integration begins.
- Running two separate applications would duplicate state, review, audit,
  export, and safety logic and would complicate the judge-facing deployment.

## 3. Proposed solution

Use `contextfirst-nexus` as the canonical repository and deployment target.
Use `case-navigator` as a read-only visual and component reference.

Before changing application code:

1. Preserve the current dirty `contextfirst-nexus` work on an explicit safety
   branch and commit after user approval.
2. Create a focused integration branch from that preserved state.
3. Keep the existing contracts, reducer, selectors, API boundary, replay,
   document pipeline, export engine, audit rules, and safety boundaries.
4. Replace the old shell and feature presentation incrementally with the
   Lovable layout, styles, routes, and compact master-detail workspaces.
5. Recreate the unsynced Evidence Gaps design from the archived screenshot and
   build the approved Interview Planner improvements directly in Codex.
6. Add real typed state and audit behavior for the new support workflows rather
   than leaving their controls as decorative toasts.
7. Verify the complete judge flow locally and on a Vercel preview before any
   explicitly approved production deployment.

The hackathon definition of “fully working” is a reliable, interactive,
source-grounded single-case demonstration with local PDF intake, deterministic
replay/local extraction, human review, dependency invalidation, safe export,
and audit. Production authentication and durable multi-user storage remain
out of scope unless separately approved.

## 4. Files to change

Primary target: `contextfirst-nexus`

- `app/` for the Lovable route structure and existing API boundary.
- `components/shell/` and `components/ui/` for the new shell and shared UI.
- `features/purpose/`, `features/documents/`, `features/review/`,
  `features/export/`, and `features/trust/` for presentation replacement and
  existing behavior wiring.
- New bounded feature folders for dashboard, urgent needs, interview planning,
  services/referrals, tasks, and notes.
- `lib/contracts/`, `lib/state/`, and `lib/review/` only for typed commands,
  selectors, audit events, and state required by the new workflows.
- Focused unit, contract, component, accessibility, and end-to-end tests.
- `PROJECT_BRIEF.md`, `docs/PRODUCT_SPEC.md`, and `decision-log.md` only when
  new implemented workflow behavior needs to become product truth.

Reference only: `case-navigator`

- `src/styles.css`
- `src/components/case-shell.tsx`
- `src/components/nexus-ui.tsx`
- `src/routes/`
- `src/fixtures/case.ts`

Do not rewrite or force-push the Lovable repository history.

## 5. Step by step tasks

1. [ ] With user approval, preserve the current dirty working tree on a named
   safety branch and commit it without pushing or rewriting existing history.
2. [ ] Run the focused tests for the arbitrary-PDF WIP, fix only baseline
   failures, and record the verified starting point.
3. [ ] Create the integration branch and port the Lovable global styles,
   landing page, dashboard, case shell, six-stage tracker, and 12 sidebar
   destinations without changing domain behavior.
4. [ ] Bind Purpose and Documents to the existing canonical state, local PDF
   extraction, masking, coverage, and analysis-start commands.
5. [ ] Bind Structured Analysis, Evidence Gaps, Nexus Map, and Timeline to
   existing selectors, citations, review decisions, and dependency
   invalidation. Recreate the unsynced Evidence Gaps layout.
6. [ ] Implement typed, audited workflows for Urgent Needs, Interview Planner,
   Services & Referrals, Case Tasks, and Notes & Journal, using the Lovable UI
   and the approved compact Interview Planner design.
7. [ ] Bind Export Gate, semantic preview, JSON/PDF downloads, Audit Trail,
   Trust & Safety, and reset behavior to canonical state.
8. [ ] Complete the strongest demo path: load/select documents, process,
   analyze via labelled replay or conservative local extraction, review exact
   citations, expose a gap, convert it into an action, reject supporting
   evidence, observe dependent Nexus invalidation, and see export blocked.
9. [ ] Run typecheck, lint, unit, contract, component, accessibility,
   end-to-end, security, build, and manual desktop checks.
10. [ ] Create and inspect a Vercel preview. Deploy to the existing production
    URL only after explicit user approval.

## 6. Acceptance criteria

- The judge-facing interface matches the Lovable information architecture and
  visual direction, including all 12 workspace destinations.
- No route is a blank stub; support screens may be lighter, but their primary
  actions update canonical state and produce audit events.
- Purpose, documents, masking, analysis, citations, review, dependency
  invalidation, evidence gaps, Nexus, timeline, export gate, JSON/PDF export,
  audit, and trust behavior remain functional.
- Uploaded PDF bytes and extracted text retain the approved local-only privacy
  boundary.
- Every consequential item preserves separate evidence nature, origin,
  support, and review status.
- Evidence Gaps can create accountable interview, document-request, comparison,
  preservation, or task actions.
- Interview questions expose their gap, Nexus, citation, origin, rationale,
  sensitivity, and explicit practitioner-review state.
- Unsafe features remain prohibited: credibility scoring, deception/emotion
  inference, automated legal conclusions, AI auto-approval, and hidden live
  provider transmission.
- The app builds successfully and the complete demo works at the unchanged
  `contextfirst-nexus.vercel.app` URL after approved production deployment.

## 7. Testing plan

- Preserve and verify the current arbitrary-PDF WIP before UI integration.
- Add focused unit tests for new commands, selectors, gap conversions,
  interview readiness, task/referral state, audit events, and export blockers.
- Add component tests for every new interactive screen and important empty,
  loading, error, blocked, and reset state.
- Keep contract tests around analysis requests, citations, review decisions,
  export manifests, and audit records.
- Run Playwright through the complete judge demo and important keyboard paths.
- Run automated accessibility checks and manually verify focus, labels, status
  semantics, responsive stacking, and non-color state communication.
- Compare the implemented screens with the archived Lovable and Replit
  references at consistent desktop viewports.
- Verify local JSON/PDF downloads and a Vercel preview before production.

## 8. Open questions

- Approval is required before creating the safety branch and committing the
  existing uncommitted `contextfirst-nexus` work.
- The safe default is the labelled deterministic replay plus conservative
  local extraction. Enabling a live AI provider requires separate credentials,
  evaluation/admission evidence, spend approval, and production approval.
- Production authentication and durable multi-case storage are not necessary
  for the hackathon demonstration and should not delay the working judge flow.

# ContextFirst Nexus Documentation Foundation Plan

## Current program update, 2026-07-17

The original documentation foundation and TASK-001 through TASK-038 implementation program are integrated. The approved next direction removes provider and model selection from the practitioner-facing product because ContextFirst Nexus is a case-preparation application, not a developer platform.

- TASK-039 will simplify the current replay-only public demo to one plain-language `Start analysis` path. It will automatically bind the only selectable bundled replay release, fail closed if replay is unavailable or selection is ambiguous, preserve internal provenance and `providerTransmission: false`, and keep the prepared checkpoint separate.
- TASK-040 will begin with exact contract and architecture reconciliation, then implement server-managed live-provider routing only behind the existing global server gate and static admission. Its frozen future order is OpenAI, Gemini, Mistral, then an evaluated fourth provider. Groq `openai/gpt-oss-120b` is only the current fourth-provider evaluation candidate and is not admitted, enabled, configured, or approved for calls or deployment.
- This direction explicitly supersedes the practitioner-controlled provider-selection and provider-switching plan recorded in DEC-025. Replay remains separate from live AI, and no live provider may be enabled without exact evaluation, reviewed static admission, credentials, spend approval, and separate production approval.

## Current implementation pass, 2026-07-18

### Goal

Make the hackathon demo feel interactive: remove model/provider choices from the practitioner UI and make Documents begin empty until the user selects the seven bundled demo PDFs.

### Problem

The current Documents screen immediately shows D01-D07, so it looks prefilled and static. The practitioner-facing Purpose flow also exposes implementation details that should be managed by the system.

### Proposed solution

- Keep one plain-language analysis action with provider/model details hidden from practitioners.
- Add a real browser-local multi-file PDF chooser. Nothing is transmitted to a server.
- Validate the selected packet against the seven bundled demo files, then show clear `Selected`, `Verified`, `Processing`, and `Ready` progress.
- Reveal D01-D07 and enable the existing processing/review flow only after validation succeeds.
- Use plain demo-safety copy on Documents without presenting the packet as already loaded.

### Files to change

- Purpose/provider UI files already owned by TASK-039.
- `features/documents/`, `lib/documents/`, and focused component/unit tests.
- This plan checkpoint.

### Step by step tasks

1. Recover and integrate the completed model-selector removal.
2. Add exact seven-file browser-local PDF packet validation.
3. Replace the prefilled Documents screen with an empty chooser and visible progress states.
4. Connect validated files to the existing local PDF processing flow.
5. Run focused tests, typecheck/build, inspect the local demo once, then commit and push.

### Acceptance criteria

- Documents starts empty and D01-D07 are not shown before selection.
- The user can choose the seven bundled PDFs from macOS Finder.
- Unknown, incomplete, duplicate, non-PDF, or modified packets fail safely.
- Accepted files visibly progress through the four required states and remain browser-local.
- Existing D04 coverage limitation and D07 inert-content safeguards remain intact.
- No model/provider chooser is shown to practitioners.

### Testing plan

- Focused Documents unit/component tests.
- Focused Purpose/analysis UI tests.
- Typecheck and production build.
- One local browser pass through empty, rejected, and accepted packet states.

### Open questions

- None for this pass. Server upload, arbitrary real-case files, OCR, and cloud storage remain out of scope.

## Flexible local PDF intake clarification, 2026-07-18

### Goal

Let a practitioner select one or more PDFs without a false seven-file error, and make the boundary between local PDF reading and the prepared demo analysis unmistakable.

### Problem

The current Documents step presents a frozen seven-file fixture verifier as if it were a general upload tool. It can label files ready even when a page could not be read, and it shows later analysis stages as pending alongside local PDF-reading stages. A first-time user cannot tell whether a PDF is valid, whether text was extracted, or why analysis has not started.

### Proposed solution

- Accept any non-empty set of ordinary PDFs for browser-local inspection.
- Show concise per-file results: pages read, readable text found, or a clear warning when text cannot be extracted.
- Keep arbitrary uploaded files separate from the canonical D01-D07 replay state; do not manufacture fixture findings for unrelated documents.
- Unlock the prepared replay only for the exact verified demo packet and explain that limitation in plain language.
- Separate local PDF-reading progress from downstream analysis progress, which starts only after the user explicitly starts analysis.
- Treat familiar document types such as job offers, recruiter messages, travel records, and practitioner notes as optional organization labels only. A practitioner may leave a file unclassified or choose `Other` with a custom title; categories must never become required upload slots.

### Files to change

- `lib/documents/pdf-source-service.ts` and `lib/documents/index.ts`.
- `features/documents/pdf-selection-panel.tsx`, `documents-workspace.tsx`, `document-cards.tsx`, and `processing-stage-list.tsx`.
- Focused Documents unit and component tests.

### Step by step tasks

1. [x] Add safe 1..N PDF validation and browser-local inspection without persisting file bytes or raw text.
2. [x] Detect the exact prepared demo packet separately from general local files.
3. [x] Simplify the Documents UI and accurately label readable, warning, and unavailable states.
4. [x] Explain that candidate, citation, timeline, and export checks begin only after analysis starts.
5. [x] Verify focused tests, typecheck, lint, build, and the local browser flow.

### Acceptance criteria

- Selecting one PDF is accepted instead of producing a seven-file-count error.
- Any non-empty set of valid PDFs can be inspected locally, within safe file limits.
- Local inspection never creates D01-D07 records, candidates, citations, or exports for unrelated PDFs.
- Page-read failures cannot be presented as successful text extraction.
- The exact demo packet can still enter the existing masking, replay, Review, and Export journey.
- The UI clearly says that arbitrary-document AI analysis is not connected in this demo.

### Testing plan

- Unit tests for flexible validation, limits, readable pages, image-only pages, and failed PDF loading.
- Component tests for one-file intake, multi-file intake, local-only completion, and exact demo-packet handoff.
- Typecheck, lint, production build, and one desktop browser pass.

### Open questions

- Full analysis of arbitrary case documents remains a separate future feature requiring a generalized case contract and an approved live analysis pipeline.
- Optional document-type labels are the recommended next intake enhancement. They should organize uploaded files, not determine whether a file is accepted or analyzed.

## Fast-track workflow redesign, 2026-07-18

### Goal

Turn the working demo into a simple guided journey that a first-time hackathon judge can finish without guessing where to click next.

### Problem

The current UI exposes too many internal stages, large technical panels, and repeated status details. Purpose has no obvious forward action, Documents expands into a long engineering checklist, and Review/Export do not feel like one continuous workflow.

### Proposed solution

- Keep the four real stages, but present them as a compact persistent journey header with an obvious current step.
- Add a primary `Continue` action after each successful stage.
- Make Documents progressive: choose files, process them, resolve only required checks, then start analysis. Hide advanced details until requested.
- Replace giant document and processing cards with compact rows and concise summaries.
- Keep canonical state, safety gates, masking, coverage, citations, review decisions, export gating, and local-only processing unchanged.

### Files to change

- `components/shell/` and global UI styles.
- `features/purpose/`, `features/documents/`, `features/review/`, and `features/export/` presentation files.
- Focused component tests only where visible labels or navigation change.

### Step by step tasks

1. [x] Simplify the shared shell and compact the persistent progress journey.
2. [x] Add a clear Purpose completion confirmation and Continue to Documents action.
3. [x] Collapse Documents into four understandable phases and compact technical detail.
4. [x] Simplify Review and Export hierarchy while retaining all working actions and blockers.
5. [x] Verify focused flows, typecheck, lint, build, and inspect the local desktop journey.

### Acceptance criteria

- A first-time user always sees the current stage and the next primary action.
- Purpose can advance directly to Documents after saving.
- Documents does not show the entire internal pipeline at once.
- Seven selected documents fit in a compact summary rather than seven giant panels.
- Technical coverage, mask, and source details remain accessible but are secondary.
- No canonical state, safety rule, or export gate is bypassed.

### Testing plan

- Focused Purpose, Documents, Review, Export, and shell component tests.
- Typecheck and lint.
- Production build.
- One local desktop pass from Purpose through Export.

### Open questions

- None. The local desktop flow is ready for user review before any commit, push, or deployment.

## Safari PDF compatibility fix, 2026-07-18

### Goal

Make the same verified demo PDFs extract successfully in Safari and Chromium.

## Arbitrary local document analysis, 2026-07-18

### Goal

Let a judge choose any non-empty set of PDFs and continue through a useful, honest local analysis flow without requiring the prepared seven-file packet or a live AI model.

### Problem

The current intake can inspect arbitrary filenames, but Safari page extraction may fail and the canonical Review flow is still tied to the prepared replay. That leaves valid user-selected files blocked behind demo-packet language.

### Proposed solution

- Repair browser PDF text extraction for ordinary text PDFs.
- Accept any number of PDFs within the existing safety limits.
- Convert readable pages into session-only document and source records.
- Derive conservative local review items from extracted text using deterministic rules, clearly labelled as local document triage rather than AI or legal conclusions.
- Preserve unreadable or scanned pages as explicit limitations while allowing readable files to continue.
- Keep the prepared replay available as a separate optional demonstration path.

### Files to change

- `lib/documents/` PDF reading and local-analysis helpers.
- Central contracts/state only where needed to carry browser-local records.
- `features/documents/` and the existing run controller for the guided transition.
- Focused unit and component tests.

### Step by step tasks

1. Fix Safari-compatible text extraction and explain scanned/unreadable pages plainly.
2. Build dynamic document, page, and segment records for any selected PDFs.
3. Add a deterministic local triage run that creates reviewable citations and items from those segments.
4. Connect Documents to Review with one obvious action and remove the demo-packet-required message.
5. Run focused tests, typecheck, lint, and a local browser pass.

### Acceptance criteria

- One PDF or more than ten PDFs can be selected, subject only to existing size/count safety limits.
- Arbitrary filenames are accepted.
- Readable text PDFs proceed without the prepared packet.
- Mixed readable/unreadable input proceeds with visible limitations; an entirely unreadable set explains that OCR is needed.
- Review receives only statements grounded in extracted text with exact source links.
- No live provider, fabricated finding, or legal conclusion is implied.
- Raw PDF bytes and extracted text are not sent to a server or persisted in browser storage.

### Testing plan

- Unit tests for PDF extraction, dynamic record creation, and deterministic triage.
- Component tests for one-file, many-file, mixed-quality, and all-unreadable flows.
- Typecheck, lint, focused tests, and one Safari/Chromium local pass.

### Open questions

- OCR for image-only PDFs is not available in this fast pass; those pages remain explicit limitations.

### Problem

Safari can reject the modern PDF.js runtime even though file validation succeeds. The resulting failure is persisted in the current tab and appears as seven text-extraction failures.

### Proposed solution

- Load PDF.js's matching legacy browser runtime and worker.
- Keep the existing local-only file boundary and processing contracts unchanged.
- Verify focused document tests, build, and a fresh seven-file browser run.

### Acceptance criteria

- The reader and worker use the same PDF.js legacy build.
- A fresh seven-file run opens all expected readable pages.
- No AI provider is called during PDF extraction.

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
6. [x] Research and freeze the original multi-provider approach; its practitioner-controlled selection and recovery portion is superseded by the 2026-07-17 managed-analysis direction and follow-up TASK-039/TASK-040 reconciliation.
6a. [x] Add and freeze one evaluated free live option after Gemini, including contracts, disclosures, display order, and tests.
7. [x] Create the execution documents: `AGENTS.md`, `PLANS.md`, context index, orchestration and integration rules, and decision log.
8. [x] Create an acyclic `TASK_GRAPH.yaml` with 26 bounded tasks, explicit dependencies, active-write ownership, dependency-ordered ownership transfer, and rolling scheduling rules.
9. [x] Create one self-contained `tasks/TASK-XXX.md` packet per worktree with exact context, scope, contracts, acceptance criteria, verification, commit permission, and handoff requirements.
10. [x] Audit the complete document set for missing information, conflicting instructions, unsafe claims, broken paths, excessive context, task ownership, task-graph integrity, and document structure.
11. [x] Present the final documentation package for approval before any application implementation.
12. [x] After explicit approval, commit and push the documentation to the permanent repository.
13. [x] Add the exact `contextfirst-nexus` Git repository folder as a Codex project and complete the rolling implementation and replay-only release program through TASK-038 and TASK-025.
14. [x] Implement and integrate TASK-039 to remove practitioner-facing provider/model selection and provide one fail-closed replay-only `Start analysis` experience.
15. [ ] After TASK-039 integrates, reconcile and implement TASK-040 managed server-side routing with classified safe fallback, exact admission gates, bounded attempts, isolated outputs, and no replay misrepresentation.

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
- The practitioner-facing Purpose flow contains no provider or model chooser and cannot silently select a live provider.
- The current public deployment remains replay-only; exactly one selectable replay may be bound automatically, while zero or multiple selectable services fail closed.
- Future managed live routing is server-owned, bounded, admission-gated, records safe attempt metadata, accepts at most one result, never merges outputs, and falls back only for explicitly classified pre-execution operational failures.

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
- Resolved product direction: practitioners do not select providers or models. Current public analysis uses only labelled local replay. Future server-managed live routing is ordered OpenAI, Gemini, Mistral, then an evaluated fourth provider; Groq `openai/gpt-oss-120b` is only the current evaluation candidate and remains unavailable until its exact API behavior, structured output, data-use and retention disclosure, evaluation, static admission, credentials, spend, provider-call approval, and deployment approval are all separately satisfied. Deterministic replay remains separate and visibly labelled, never a disguised live fallback result.
- Resolved for P0: no OCR, no production authentication, no durable server case store, versioned redacted synthetic state in browser session storage, PDF.js text extraction, and local React-pdf plus JSON exports. Exact installed versions and measured model choices will be recorded before dependent tasks launch.
- The active graph will contain 40 task packets after TASK-039 and TASK-040 are documented. Any later count change requires coordinated updates to the graph, affected packets, ownership rules, and integration order.
