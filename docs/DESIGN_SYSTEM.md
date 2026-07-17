# Design System

## 1. Status and authority

This document freezes the P0 visual language, interaction patterns, component names, responsive behavior, and accessibility target for ContextFirst Nexus.

It is a design specification, not a claim that the application currently satisfies these requirements. Safety language in `docs/SAFETY_AND_DATA.md`, product behavior in `docs/PRODUCT_SPEC.md`, and shared values in `docs/CONTRACTS.md` take priority.

### 1.1 Superseding analysis interaction

DEC-045 replaces the provider-card, model-selection, and provider-switch interaction below. TASK-039 presents one plain-language Start analysis action, automatically binds only the sole selectable local replay release in the public demo, and fails closed when the service boundary is absent or ambiguous. Provider details move to Trust, safe audit, export provenance, and optional plain-language disclosure. TASK-040 owns later server-managed live-routing interaction reconciliation.

## 2. Design position

ContextFirst Nexus should feel like a calm, precise legal-workbench product. It must help a practitioner slow down at consequential moments, inspect sources, and understand what remains unknown.

The visual system is:

- professional and restrained;
- light-first and paper-like;
- dense enough for case work without looking like a surveillance dashboard;
- explicit about source, review, missingness, and system boundaries;
- free of sensational anti-trafficking imagery or emotional manipulation.

Do not use:

- victim photographs, chains, cages, fingerprints, mugshots, maps with threat pins, or police-style imagery;
- gradients, glass effects, neon accents, or dramatic dark-mode crime aesthetics;
- confidence meters, risk scores, traffic-light ratings, or celebratory success animation;
- decorative AI sparkles as the primary product identity;
- unsupported phrases such as detected trafficking, confirmed victim, verified true, or AI-powered justice.

## 3. Design principles

1. Context before conclusion.
2. Source access beside every consequential claim.
3. Status dimensions stay separate.
4. Unknown and conflicting states remain visible.
5. Human review actions are deliberate and reversible through audit, not hidden defaults.
6. Blocked states explain the reason and the next safe action.
7. Sensitive content is masked by default.
8. Accessibility is part of the primary flow, not a later polish task.
9. Analysis availability is plain-language and fail-closed; replay and any actual live-provider provenance remain truthful without exposing developer controls.

## 4. Foundation tokens

### 4.1 Typography

Use the local system font stacks. This avoids a font download, keeps the first render fast, and looks native on the user's device.

```text
Sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
```

| Token | Size and line height | Use |
|---|---|---|
| Display | 36 / 44 | Landing statement only |
| Heading 1 | 32 / 40 | Page title |
| Heading 2 | 24 / 32 | Major workspace section |
| Heading 3 | 20 / 28 | Panel or card heading |
| Body | 16 / 24 | Primary reading and form content |
| Body small | 14 / 20 | Metadata and supporting explanations |
| Label | 14 / 20, 600 weight | Fields, filters, and status names |
| Code or ID | 13 / 20 mono | Source, candidate, run, and version IDs |

Essential legal, boundary, error, or status text must never be smaller than 14 pixels.

### 4.2 Color

| Token | Value | Purpose |
|---|---|---|
| `canvas` | `#F5F7F6` | Application background |
| `surface` | `#FFFFFF` | Main work surfaces |
| `surface-subtle` | `#EEF2F1` | Secondary regions and selected rows |
| `ink` | `#14212B` | Primary text |
| `ink-muted` | `#52615F` | Secondary text |
| `border` | `#CDD7D4` | Decorative dividers and passive separators |
| `border-strong` | `#91A09C` | Decorative strong dividers only |
| `control-border` | `#64748B` | Input, control, and meaningful component boundaries |
| `brand` | `#5948B8` | Primary action and product identity |
| `brand-hover` | `#463894` | Primary action hover |
| `brand-subtle` | `#F0EEFF` | AI-origin or selected context background |
| `link` | `#315C93` | Underlined source links |
| `supported` | `#0F766E` | Exact support and completed safe actions |
| `supported-subtle` | `#ECFDF8` | Supported background |
| `warning` | `#8A4B08` | Pending, partial, or attention states |
| `warning-subtle` | `#FFF8E7` | Warning background |
| `conflict` | `#9A3412` | Conflicting evidence |
| `conflict-subtle` | `#FFF3ED` | Conflict background |
| `danger` | `#B42318` | Blocked, invalidated, failed, or destructive action |
| `danger-subtle` | `#FEF3F2` | Danger background |
| `neutral` | `#475569` | Unknown, draft, excluded, or not processed |
| `neutral-subtle` | `#F1F5F9` | Neutral background |

Required information must not rely on color. Every status also has text, an icon, and where needed a pattern or border treatment. Decorative dividers may use `border`, but inputs and meaningful component boundaries use `control-border` to meet the 3:1 non-text target on white. Exact contrast must be verified in tests before any WCAG claim is made.

### 4.3 Spacing and shape

Use the spacing sequence `4, 8, 12, 16, 24, 32, 48, 64` pixels.

- Control minimum height: 44 pixels.
- Compact table row minimum height: 48 pixels.
- Button and input radius: 6 pixels.
- Card and panel radius: 10 pixels.
- Dialog and sheet radius: 12 pixels.
- Border: 1 pixel by default, 2 pixels for active focus or blocking emphasis.
- Shadow: subtle elevation only for drawers, dialogs, and menus.

### 4.4 Motion

- Use 150 to 200 millisecond transitions for drawers, disclosure panels, and focus-adjacent state changes.
- Do not animate timeline items into existence or use decorative looping motion.
- Dependency invalidation should update immediately, then use a short background emphasis that does not flash.
- Respect `prefers-reduced-motion` by removing non-essential movement.
- Processing uses a progress list and status text, not a decorative spinner alone.

## 5. Layout system

### 5.1 Judged desktop layout

Optimize the rehearsal at 1440 by 900 pixels.

- Global header: 64 pixels.
- Case navigation: 224 pixels.
- Main workspace: fluid, minimum 600 pixels.
- Source drawer: 400 pixels when open.
- Content grid: 12 columns with 24-pixel gaps.
- Reading column for prose: maximum 760 pixels.

The case header always shows:

- synthetic case label;
- case ID and current section;
- case-level status;
- plain-language Analysis status;
- replay or live provenance when applicable, without a provider selector;
- Reset Case action.

### 5.2 Responsive behavior

| Viewport | Layout |
|---|---|
| 1280 pixels and wider | Three-region workbench with navigation, main content, and non-modal source drawer |
| 768 to 1279 pixels | Compact navigation, single main workspace, overlay source drawer |
| Below 768 pixels | Single-column cards, top navigation, and modal source view |

At 320 CSS pixels and 200 percent zoom:

- the complete flow remains operable;
- essential tables become labelled cards without requiring horizontal scrolling;
- no graph is required to understand the Nexus;
- sticky regions reserve enough space so they never obscure keyboard focus;
- primary and destructive actions do not sit next to each other without spacing and labels.

## 6. Navigation and information architecture

The visible case navigation is:

1. Purpose
2. Documents
3. Review
4. Export

Trust and Safety is a global destination outside the case flow.

Each case step shows one of:

- Not started
- In progress
- Needs review
- Blocked
- Complete

These are navigation progress labels, not evidence or legal states.

The active step uses `aria-current="step"`.

Breadcrumbs are unnecessary inside the shallow P0 case flow. The case header and step navigation provide location. Browser back and forward behavior must remain correct.

## 7. Status presentation

The interface has five separate status systems. They must not be collapsed into one badge or confidence value.

### 7.1 Evidence nature

| Value | Icon concept | Treatment |
|---|---|---|
| Documented in source | File with check | Neutral outlined label on each dependency |
| Reported or alleged in source | Quotation marks | Neutral outlined label with full wording |
| Reviewer-supplied context | Person with pen | Neutral outlined label |
| Unknown | Circle with question | Dashed neutral label |

Evidence nature is not ranked by color. A documented source can still be unauthenticated or false, and a reported account is not treated as less worthy.

### 7.2 Item origin

| Value | Treatment |
|---|---|
| Source extraction | Small source-origin label |
| AI suggestion | Violet label reading AI suggestion |
| Human-created | Small human-created label |

AI origin is provenance, not a reliability judgment.

### 7.3 Support status

| Value | Color family | Icon concept |
|---|---|---|
| Exact-source supported | Teal | Link with check |
| Partially supported | Amber | Part-filled circle |
| Conflicting | Orange | Crossing arrows |
| Insufficient evidence | Neutral | Open circle |
| Citation unresolved | Red | Broken link |
| Not processed | Neutral | Minus circle |

### 7.4 Review status

| Value | Icon concept |
|---|---|
| Pending | Clock |
| Human accepted | Check |
| Human edited | Pen |
| Rejected | X |
| Uncertain | Question |
| Invalidated | Rotate or warning triangle |

### 7.5 Case status

Show one case status in the header:

- Draft
- Processing
- Review required
- Blocked
- Ready to export
- Exported
- Processing failed

Blocked and Processing failed may share red styling, but their words, icons, explanation, and next action must differ.

## 8. Core components

Freeze these product component names:

- `AppShell`
- `SyntheticCaseBanner`
- `SyntheticCaseChooser`
- `CaseStatusBadge`
- `CaseStepNavigation`
- `CasePurposeBriefForm`
- `AnalysisAvailabilityNotice`
- `ProcessingStageList`
- `CoverageManifest`
- `MaskingReviewPanel`
- `SensitiveReveal`
- `StatusMatrix`
- `CitationLink`
- `SourceDrawer`
- `TimelineEventCard`
- `CandidateReviewCard`
- `ContextGapPanel`
- `NexusRelationshipRow`
- `ReviewLanePanel`
- `ReviewQueue`
- `DependencyChangePanel`
- `ExportGatePanel`
- `ExportPreview`
- `AuditHistory`
- `SystemCardPanel`
- `SafetyLabResult`
- `UnsafeOutputReport`

Use only the small set of base UI primitives needed to support them:

- button;
- input, textarea, checkbox, radio group, select, label, and field error;
- alert and alert dialog;
- badge;
- card;
- dialog and sheet;
- progress;
- separator;
- skeleton;
- table;
- tabs;
- tooltip for supplemental information only.

Required information must never exist only inside a tooltip.

## 9. Component behavior

### 9.1 SyntheticCaseBanner

The banner remains visible across all case routes. It reads:

> Synthetic training case. Do not upload or enter real case data.

It cannot be dismissed in P0.

### 9.2 CasePurposeBriefForm and analysis availability

- Group related fields with fieldsets and legends.
- Explain that role selection is not authentication.
- Present one plain-language Start analysis experience with no provider, model, release, or service-tier controls.
- In the replay-only public deployment, auto-bind only the sole selectable bundled deterministic replay. Zero, multiple, or live-only selectable services show a plain unavailable state.
- Show a concise consolidated data-flow disclosure; detailed provider and release provenance belongs in Trust, audit, and exports.
- The unpaid Gemini option carries a persistent Synthetic fixture only label and states that content may be used to improve Google products and reviewed by humans under the applicable terms.
- The Mistral option shows exact release `mistral-small-2603` and remains visibly unavailable until a passed versioned evaluation report is matched by the reviewed static admission record and coordinator-recorded deployed-account evidence confirms that exact release is available.
- When free Mistral is available, its card carries a persistent Exact bundled synthetic fixture only label. It states whether training use is enabled or opted out for the actual account, that inputs and outputs may be retained for up to 30 days for abuse monitoring, and that free zero data retention is not available or claimed.
- The free Mistral card states that moving to a paid tier would not authorize real, private, client, or survivor data.
- Do not describe any provider as best, safest, free forever, or guaranteed available.
- Show unavailable providers as unavailable without revealing keys, secret names, account details, project details, or billing details.
- State that replay is frozen local output rather than live AI and that no provider transmission occurs.
- Require the synthetic-data, authority-not-verified, analysis-disclosure, excluded-decision, and cooperation-neutrality acknowledgements.
- On failed submission, focus an error summary and link each error to its field.
- Save the brief only when every required acknowledgement is complete. Saving the brief never starts analysis.

### 9.3 ProcessingStageList

- Before processing starts, show one explicit Start analysis action beside a prerequisite summary. It remains unavailable until purpose, authority, coverage, masking, leak scan, exact-one service availability, and consolidated disclosure acknowledgement are current.
- In the public deployment, activating Start analysis dispatches `run_deterministic_replay` locally exactly once and never calls the live route. Future live intent remains provider-neutral.
- While a live request is pending, disable duplicate launch and provider-change actions, show the selected release, and explain that the pending request is not saved across refresh.
- Disable every other material case action while the live request is pending. Starting the request does not increment the source case revision.
- Show the name and explicit state of every stage.
- Keep completed safe stages visible after a later failure.
- Identify the exact document or page affected by extraction failure.
- Retry only a retryable failed stage.
- Keep the selected provider, model, and live or replay mode visible while analysis is active.
- A stateless live response is terminal execution data only. The interface does not show a linked run until the reducer validates the matching pending command and source case revision, creates the run, and attaches browser-local recovery metadata.
- If the browser loses the network or cannot parse the response envelope, show Remote outcome unknown and No output accepted. Clear pending state through the canonical transport-failure command, preserve the prior active run, and do not show a run or recovery link.
- Use a polite live region for normal progress and an assertive announcement for failure.

#### Legacy ProviderRecoveryPanel removal target

The following bullets document the integrated pre-TASK-039 control so the worker can remove it without losing failure provenance. They are not current practitioner-facing requirements.

- Open after a safe operational failure such as not configured, disabled, service tier unavailable, authentication failure, rate limiting, quota exhaustion, timeout, or transient unavailability.
- State which provider selection or run failed, what local work remains safe, and that no completed analysis was created.
- Offer only applicable actions: Retry selected provider, Choose another provider, or Use labelled replay.
- List remaining eligible provider choices in OpenAI, Gemini 3.5 Flash, and Mistral Small 4 order, followed by Bundled deterministic replay, not live AI last. Exclude the failed or unavailable selection as applicable.
- Treat this as display order only. Never automatically call the next provider or replay.
- Choosing another provider opens that provider's disclosure and acknowledgement before the practitioner explicitly starts a new attempt. The browser reducer creates a linked run only after validating the preserved failed run and terminal execution.
- Keep the failed run visible after recovery when a run began. Show preflight rejection and browser transport failure in a separate non-run-attempt region, never in run history. Label preflight as not transmitted and not started. Label transport as unknown transmission and unknown remote outcome. In both cases show No output accepted, preserve any prior active run, and do not invent a run or recovery link.
- For a client transport failure, show its separate safe audit event and unknown remote outcome. Any later attempt is a new explicit unlinked attempt, not a recovery from a verified failed run.
- Do not offer provider switching for a refusal, safety block, privacy block, citation failure, schema failure, prohibited inference, or semantic-validation failure.
- Use a safe reference ID for support. Never render credentials, key fragments, secret names, account or billing details, project identifiers, request content, or raw provider diagnostics.
- Announce the failure once. Move focus to the recovery heading without forcing an action.

### 9.4 CoverageManifest

- List every expected document and page count.
- Show D04 page 3 as Unavailable with the internal reason Missing page, not as blank or successfully processed.
- Separate consequential, non-consequential, and unknown-consequence coverage issues. Unknown consequence remains visibly fail-closed until a practitioner records a qualified limitation through the central coverage-review action.
- Never display a misleading overall completeness score.

### 9.5 MaskingReviewPanel

- Use readable replacements such as `[Phone masked]`, not black rectangles.
- Show detector class, source location, proposed replacement, and review state.
- Require preview and approval before live analysis.
- Provide a safe default view and a separate intentional reveal action.
- State the exact supported classes and avoid an anonymization claim.

### 9.6 CandidateReviewCard

Each card shows together:

- proposed wording;
- item origin;
- support and review status;
- supporting, limiting, and contrary dependencies;
- unknowns and coverage warnings;
- Open source links;
- one individual review control group.

Actions use these exact labels:

- Accept suggestion
- Edit wording
- Reject suggestion
- Mark uncertain
- Confirm as unknown
- Record as limitation

Normal acceptance is unavailable for an insufficient-evidence positive proposition. `Record as limitation` is the only positive completion path for that state.

Edit, reject, uncertain, limitation, and withdraw actions require a concise reason. There is no bulk approval control.

### 9.7 Timeline

- Use an accessible ordered list grouped by date or range.
- Show approximate and conflicting dates in text.
- Keep allegations visually labelled as allegations.
- Opening a source must not reset the timeline's scroll or filter state.
- Do not use an attractive linear line that implies false chronological certainty.

### 9.8 Charge-Coercion Nexus

Use a semantic matrix built with an HTML table at desktop and labelled row cards on small screens.

Each row includes:

- review question;
- relationship category;
- support status;
- source and candidate dependencies;
- limiting or contrary evidence;
- unknowns;
- review status and action when required.

Optional SVG connectors may illustrate dependencies at desktop, but the table remains the complete accessible representation. Do not use a graph library or an overall score.

The desktop table has a descriptive caption, column headers, and row headers. Equivalent mobile cards preserve the same labels and reading order.

### 9.9 SourceDrawer

Desktop behavior:

- non-modal complementary region;
- 400-pixel width;
- exact page, segment, and quote highlighted;
- source, AI wording, and reviewer wording visually separated;
- focus moves to the drawer heading or exact quote after opening;
- focus is not trapped because the region is non-modal;
- Escape and the Close control both close it;
- close action returns focus to the invoking citation link.

Mobile behavior:

- modal dialog or sheet;
- focus moves inside on open and remains contained;
- Escape and explicit Close both work;
- focus returns to the invoking control.

Show citation match status, extraction quality, language, translation status, source type, and provenance limitation. The drawer must say that exact location does not prove truth or authenticity.

For `ambiguous_match`, do not open one candidate range as if it were valid. This state is available only for repeated exact-codepoint occurrences inside the citation's existing eligible canonical segment. Show only the pure resolver's recomputed exact-range choices. Multiple normalized-only matches never reach this control. Selecting a choice dispatches `resolve_citation` with the candidate ID, citation ID, existing segment ID, and redacted range. Keep the control in a resolving state and open the selected source only after canonical state contains the `CitationResolutionDecision`, updated `manually_resolved` citation, support recalculation, and `citation_manually_resolved` audit event. The drawer cannot set citation validity or review status directly.

PDF canvas rendering may support visual inspection, but semantic DOM text with the exact masked source segment is always available and is the accessible source representation.

### 9.10 DependencyChangePanel

- Before withdrawal, list each item that will be affected.
- Require confirmation and a reason.
- After withdrawal, persist the before-and-after change in the main workspace.
- Move focus to the change summary.
- Announce newly invalidated items.
- A toast may supplement the panel but cannot replace it.

### 9.11 ExportGatePanel

The Export button remains operable while blocked. Activating it opens the gate panel rather than presenting an unexplained disabled button.

Each blocker includes:

- plain-language reason;
- affected item IDs and names;
- remediation action;
- a link back to the exact review, citation, coverage, jurisdiction, or masking location.

Cross-route blocker links use stable target IDs, preserve the blocker context, and move focus to the destination heading after navigation.

No critical override control exists.

### 9.12 ContextGapPanel

- Offer Answer, Defer, Preserve as unknown, and Outside current scope actions.
- Never require an answer or turn an unanswered gap into negative evidence.
- Label an answer as reviewer-supplied context unless a new source is added.
- Require a concise explanation for both Defer and Outside current scope.

### 9.13 ReviewLanePanel

- Keep the three lanes in separate labelled regions.
- Repeat the relevant boundary: indicators prompt further assessment, non-punishment relevance is not an eligibility decision, and urgency items are questions for qualified action.
- Reusing the same evidence in two lanes must not merge the candidate or approval action.

### 9.14 ExportPreview

- Preview only the handoff kind selected in the current Purpose Brief.
- Changing the handoff kind returns to Purpose and invalidates export readiness.
- Use tabs for a semantic HTML preview and structured JSON summary. Generate the downloadable PDF lazily from the same manifest.
- A PDF iframe or canvas is never the only preview.
- Show the minimum-necessary selection before generation.
- Display all four required export labels.
- Say explicitly that download is local and that the application does not transmit the file.

### 9.15 SystemCardPanel and SafetyLabResult

- Show intended use, prohibited use, enabled data origin, selected release before a run, every attempted provider, exact release configuration, reviewed static admission status, matched evaluation-report identity and digest, requested and returned model identifiers when known, service tier, provider-specific data-use terms, actual storage or retention setting and limitation, acknowledgement version, run mode, human-review requirements, unsupported conditions, and measured fixture results.
- Present evaluation reports as versioned evidence only. Do not imply that generating or loading a report enabled a provider. The reviewed fail-closed static admission record is the runtime authority.
- For free Mistral, show the actual training-use or opt-out state, the up-to-30-day abuse-monitoring retention limitation, the absence of free zero data retention, and the exact bundled-fixture restriction.
- When a prepared checkpoint is active, show its checkpoint ID, checkpoint version, replay version, fixture-reviewer provenance, and no-provider-transmission state.
- The checkpoint control dispatches only the fixed trusted checkpoint ID. It is never a file picker, URL field, paste target, or provider-output import. Show one clear validating state, then either the complete checkpoint or an atomic safe error with no partially loaded purpose, masks, run, candidates, or decisions.
- Show each failed run and safe failure category separately from successful live analysis and bundled replay.
- State that all three live providers use the same validation, citation, privacy, prohibited-inference, and human-review gates.
- Failed and not-run fixtures remain visible.
- Do not calculate an overall accuracy score.
- Link each result to its fixture version and measured check names. Render deterministic CI harness results in a separate section labelled Not live model evidence, with planned-release and mock-harness provenance only. They must not appear in provider comparison, recommendation, or admission UI.

### 9.16 UnsafeOutputReport

- Allow the user to report a prohibited claim, privacy concern, citation problem, or another safe category.
- Record only the category and affected entity IDs in audit history.
- Do not ask the user to paste source evidence, identifiers, or sensitive text.
- P0 may copy a sanitized report for manual team follow-up but must not automatically transmit it.

## 10. Required interface states

Every asynchronous or data-dependent product component has designed states for:

- loading;
- empty;
- partial or warning;
- blocked;
- error with safe retry;
- successful;
- unknown;
- insufficient evidence.

A blank panel never means success. Skeletons preserve the expected panel shape and are replaced with explicit empty or failed states.

### 10.1 Analysis availability and recovery states

| State | Required presentation | Safe actions |
|---|---|---|
| Not selected | Choose a live analysis service or bundled replay before processing | Open analysis-mode choices |
| Ready to start | Every current prerequisite has passed and the selected release disclosure is acknowledged | Start analysis or return to Purpose |
| Live request pending | Show the selected release, current processing stage, and that refresh restores the last stable state but cannot confirm the remote outcome | Wait; avoid refresh; never start another attempt automatically |
| Stable state restored after refresh | State that no pending request was resumed and the user must not infer whether provider transmission completed | Review the stable state and explicitly start a new attempt only if appropriate |
| Preflight rejected | Show the safe blocker and audit reference, state that no run was created, and retain any prior active run | Fix the prerequisite, choose an eligible release, use labelled replay, or return to Purpose |
| Client transport failure | Show Remote outcome unknown, No output accepted, the safe local audit reference, and the preserved prior active run | Return to Purpose or explicitly begin a new unlinked attempt |
| Mistral admission required | Mistral Small 4 is unavailable because passed evidence, reviewed static admission, or deployed-account availability for exact release `mistral-small-2603` is missing | Choose another eligible provider in the approved order or labelled replay last |
| Not configured | This analysis service is unavailable in this deployment | Choose a remaining configured, statically admitted provider in the approved order or labelled replay last |
| Disabled | This analysis service is disabled in this deployment | Choose a remaining enabled, statically admitted provider in the approved order or labelled replay last |
| Service tier unavailable | This exact provider service tier is unavailable in this deployment | Choose a remaining eligible, statically admitted provider in the approved order or labelled replay last; retry only after service access changes |
| Authentication failed | This analysis service could not authenticate without exposing account details | Choose a remaining eligible, statically admitted provider in the approved order or labelled replay last; retry only after configuration changes |
| Rate limited | This analysis service cannot accept the run yet | Retry when appropriate, acknowledge a remaining eligible provider in the approved order, or use labelled replay last |
| Timeout or transient outage | Name the failed provider and state that no completed analysis was created | Retry, acknowledge a remaining eligible provider in the approved order, or use labelled replay last |
| Quota exhausted | State that the selected service cannot accept this run now without exposing billing or account details | Acknowledge a remaining eligible provider in the approved order or use labelled replay last |
| Shared validation rejected | State which validation category failed and that the output was not accepted | Retry only when policy permits; do not offer a provider-switch bypass |
| Awaiting new acknowledgement | Show the new provider disclosure and retain the failed run summary | Acknowledge and start a new run, or cancel |
| Replay active | Persistent Bundled deterministic replay, not live AI label | Return to Purpose or continue the labelled demo |
| Prepared checkpoint active | Show Prepared synthetic review checkpoint plus Bundled deterministic replay, not live AI, fixture-reviewer provenance, and no provider transmission | Continue the labelled demo or return to Purpose |

## 11. Interaction rules

- No action occurs on hover alone.
- No automatic page advance follows a review decision.
- Opening a citation preserves current filters and focus context.
- Resolving an ambiguous citation dispatches the central command and waits for canonical state and audit confirmation before opening the chosen range.
- Sensitive content reveal requires an explicit action and warning.
- Evidence withdrawal lists consequences before confirmation.
- Destructive actions use plain names and are visually separated from primary actions.
- Error messages identify the problem, affected item, and safe next step.
- Provider errors use safe categories and local reference IDs, never raw provider responses or credential details.
- Keyboard shortcuts are not required for P0.
- Undo is not presented as deletion of audit history. A new review action supersedes an earlier action.
- The current mode, live analysis or bundled replay, remains visible after analysis.
- The final provider/release remains visible in Trust, audit, and export provenance after an approved live analysis.
- Failed provider attempts remain visible through safe provenance after managed routing.
- Replay never enters the managed live-provider order.
- The UI never reads an evaluation report, environment value, or provider response as authority to enable a release.
- Preview and download only the handoff kind approved in Purpose. Full practitioner and safe-share flows are tested separately.

## 12. Content and tone

Preferred wording:

- The source reports...
- The record documents that an allegation was made...
- AI suggestion for practitioner review
- Exact quote found in the processed source
- Insufficient evidence to support this relationship
- Citation unresolved
- Unknown from the available packet
- Local legal verification required
- Bundled deterministic replay, not live AI
- Choose an analysis service
- OpenAI did not complete this run. Your reviewed work is unchanged.
- Gemini 3.5 Flash did not complete this run. Your reviewed work is unchanged.
- Mistral Small 4 did not complete this run. Your reviewed work is unchanged.
- Mistral Small 4 is not available until exact release `mistral-small-2603` has passed evidence, reviewed static admission, and confirmed deployed-account availability.
- Free Mistral is limited to the exact bundled synthetic fixture. Review its training-use setting and up-to-30-day retention before continuing.
- This response was not accepted because it did not pass required validation.
- Review the selected provider's data terms before starting a new run.

Avoid:

- Detected trafficking
- Confirmed victim
- Verified true
- Proves coercion
- Legally eligible
- Anonymous or fully anonymized
- Safe by default
- UN-approved or partner-approved

Use person-first, non-judgmental language. Initial consent, inconsistency, silence, migration status, and cooperation status are not framed as adverse evidence.

## 13. Accessibility target

Target WCAG 2.2 Level AA. Do not publish a conformance claim until the complete flow has been tested.

Required implementation behavior:

- semantic landmarks and one clear page heading;
- skip link to main content;
- descriptive page titles;
- native buttons, links, fields, tables, fieldsets, and legends whenever possible;
- visible two-layer focus treatment on light, brand, and warning backgrounds;
- logical focus order and no keyboard trap;
- text and labels at 200 percent zoom without loss of function;
- reflow at 320 CSS pixels;
- icon plus text for all meaningful status;
- accessible names for icon-only controls;
- status announcements that do not steal focus unnecessarily;
- input error summary and inline errors;
- reduced-motion support;
- 44 by 44 pixel internal target standard;
- focus restoration after drawers, dialogs, and blocker navigation;
- no essential information conveyed only by color, position, animation, or tooltip.

Automated checks cannot establish full accessibility. Manual keyboard, zoom, reduced-motion, and VoiceOver checks are required.

## 14. Design acceptance checklist

- The interface looks like a legal workbench, not a crime dashboard.
- The synthetic-data boundary is persistent.
- Evidence nature, origin, support, review, and case status are separately labelled.
- The Nexus remains understandable without graphics or color.
- Every consequential item has source access beside its review control.
- Unknown, conflict, limitation, and failed processing states are first-class designs.
- The practitioner interface contains no provider, model, release, or credential controls.
- Replay-only analysis auto-binds exactly one selectable local replay and fails closed for zero, multiple, or live-only selectable services.
- Start analysis is a separate explicit action enabled only after every current prerequisite passes, and duplicate launch is blocked while a request is pending.
- Failed live attempts remain visible through safe provenance; replay is never substituted for live analysis.
- Refusal, safety, privacy, citation, schema, and semantic-validation failures offer no provider-switch bypass.
- Unpaid Gemini remains visibly limited to the bundled synthetic fixture.
- Free Mistral remains unavailable until exact release `mistral-small-2603` has passed evaluation evidence, matching reviewed static admission, and confirmed deployed-account availability. When enabled, it remains visibly limited to the exact bundled synthetic fixture with training-use or opt-out, up-to-30-day retention, and no-free-ZDR copy.
- There is no bulk approval or confidence score.
- Blocked export explains every reason and remediation.
- Sensitive source text is masked until intentionally revealed.
- The source drawer preserves focus and exact location.
- Ambiguous citation resolution waits for canonical decision and audit state before the source drawer opens the selected range.
- Desktop, tablet, mobile, keyboard, zoom, and reduced-motion behavior are specified.
- No visual or copy pattern implies a legal or victim-status decision.
