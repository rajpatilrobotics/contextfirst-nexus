# ContextFirst Nexus — Agent Handoff

## Why this file exists

This project has been developed through a long conversation that was compacted several times. Treat this file as the starting context for a fresh Codex thread. The repository and tests remain the authority for implementation details; do not assume that every idea below is already implemented.

## Product mission

ContextFirst Nexus is a professional evidence-review workspace for practitioners handling complex, sensitive case material related to trafficking, exploitation, coercion, and connected proceedings.

It helps a practitioner:

1. define the purpose and limits of a review;
2. ingest available documents, whether that is one file or many;
3. extract and organize chronology, provenance, evidence, contradictions, gaps, and possible relationships;
4. review every consequential machine-generated proposition;
5. understand dependencies and the impact of withdrawing a proposition; and
6. create a traceable handoff only after required review gates pass.

The product must never decide guilt, credibility, legal status, prosecution, or whether trafficking legally occurred. It supports human review; it does not replace it.

## Intended users

- legal and investigative practitioners;
- victim-support and anti-trafficking specialists;
- trained case analysts and authorized reviewers;
- multidisciplinary teams that receive large, inconsistent document sets.

This is not a developer tool. Users should not choose AI providers or models in the interface.

## Core experience

The intended journey is linear and understandable:

1. **Purpose** — record the review purpose, authorized role, intended handoff, exclusions, jurisdiction, and required acknowledgements.
2. **Documents** — start empty; accept any reasonable number of user-selected files, not a fixed seven-file demo set. Clearly distinguish selected, uploaded/read, parsed, OCR-required, failed, and ready states.
3. **Review** — show extracted candidates, citations, provenance, contradictions, gaps, limitations, and human decisions. Preserve the distinction between reported, documentary, inferred, and user-entered material.
4. **Nexus and chronology** — make relationships and event order legible without implying legal conclusions. Show dependencies and downstream effects before withdrawal.
5. **Export** — block handoff creation until required review is complete. Explain blockers and provide direct remediation. Never offer an override that bypasses evidence-review gates.

Privacy-sensitive information should be concealed by default. Any reveal must be intentional, justified, auditable, and reversible in the interface where appropriate.

## Current implementation direction

The existing Next.js application contains substantial working domain logic, state transitions, review mechanics, export gates, tests, and safety controls. Preserve and reuse that work. Do not restart the application or replace the backend merely to obtain a new visual design.

The interface, however, needs a major usability pass. The user found the earlier layout confusing, overly tall, repetitive, and difficult to follow. The preferred visual reference is the recent Replit concept: a compact professional case workspace with persistent navigation, clear local context, split-pane review where useful, legible statuses, and direct next actions. Use it as inspiration, not as code or a requirement to reproduce every decorative choice.

A persistent sidebar is acceptable only if it genuinely improves orientation and does not waste most of the viewport. The finished product should feel like a serious evidence workstation, not a generic AI dashboard.

## Visual and interaction goals

- calm, credible, modern, and restrained;
- dense enough for professional work without becoming cramped;
- obvious information hierarchy and next actions;
- minimal scrolling for routine decisions;
- strong empty, loading, partial, failure, and recovery states;
- keyboard accessible, high contrast, and usable at narrow desktop widths;
- no unnecessary provider controls or technical implementation jargon;
- no automatic preference for cyan/teal or any previous palette—choose a palette that fits the mission;
- no generation of multiple design directions unless the user explicitly asks for them.

## Critical truthfulness requirements

The current document screen has at times displayed contradictory states such as files being “ready” while extraction had failed. Fix the state model and wording rather than hiding the failure.

Keep these concepts separate:

- the browser accepted or read a file;
- text was successfully parsed;
- OCR is required or completed;
- analysis was actually run;
- citations were produced and verified;
- the user completed human review.

Do not claim real extraction, OCR, model analysis, or provider failover unless it actually happened. When a capability is unavailable, explain that plainly and preserve a useful recovery path.

The product should accept one document, several documents, or a larger set. A missing expected category may create a coverage limitation, but must not make arbitrary document intake impossible.

## AI-provider behavior

Provider selection belongs behind the scenes. The desired eventual service order is OpenAI, then Gemini, then Mistral, with explicit eligibility and failure rules. Do not silently switch providers in a way that changes evidence semantics or provenance. Always record which provider and model produced a result. The current deployed application may intentionally have all remote providers disabled; verify repository and runtime state before describing this as implemented.

## Safety invariants to preserve

- evidence provenance and citation integrity;
- human review before consequential handoff;
- limitations and coverage gaps remain visible downstream;
- dependency-aware withdrawal and renewal;
- no model-generated legal conclusions;
- no sensitive-data reveal without an auditable action;
- export blockers cannot be bypassed;
- no fabricated analysis when services are disabled or files cannot be parsed.

## How to continue in a fresh thread

1. Inspect `git status` before doing anything. The worktree may contain important uncommitted user changes.
2. Preserve all existing changes and do not reset, overwrite, or delete them.
3. Read the repository instructions, current implementation, tests, and relevant task documents.
4. Establish what is actually working versus mocked or incomplete, especially document parsing/OCR and analysis.
5. Diagnose the current failure before redesigning around it.
6. Reuse the existing domain and safety logic while simplifying the user experience.
7. Work locally first. Do not deploy or push merely to preview UI changes.
8. Do not commit, merge, or publish until the user asks.

## Recommended immediate objective

First make the document intake and status flow truthful and understandable for an arbitrary number of files. Then use the same state model to redesign the complete Purpose → Documents → Review/Nexus → Export journey without weakening existing review or safety guarantees.

