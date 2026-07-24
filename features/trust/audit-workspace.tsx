"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { useCaseState } from "../../components/shell";
import { Alert, Select } from "../../components/ui";
import type { AuditEvent } from "../../lib/contracts";
import { AuditHistory } from "./audit-history";

type ActorFilter = "all" | AuditEvent["actor"];

export function AuditWorkspace() {
  const { state } = useCaseState();
  const [query, setQuery] = useState("");
  const [actor, setActor] = useState<ActorFilter>("all");
  const [eventType, setEventType] = useState("all");
  const eventTypes = useMemo(
    () => [...new Set(state.audit.map((event) => event.eventType))].sort(),
    [state.audit],
  );
  const visible = useMemo(
    () =>
      state.audit.filter((event) => {
        if (actor !== "all" && event.actor !== actor) return false;
        if (eventType !== "all" && event.eventType !== eventType) return false;
        const searchText = [
          event.id,
          event.eventType,
          event.summary,
          event.actor,
          ...event.entityIds,
        ]
          .join(" ")
          .toLowerCase();
        return !query || searchText.includes(query.toLowerCase());
      }),
    [actor, eventType, query, state.audit],
  );

  return (
    <div className="grid min-w-0 gap-5">
      <header className="grid gap-3 border-b border-[var(--color-border)] pb-5">
        <div className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-1 shrink-0 text-[var(--amber)]" size={22} />
          <div>
            <p className="cfn-type-label text-[var(--color-ink-muted)]">Utility · canonical local state</p>
            <h1 className="cfn-type-heading-1">Audit Trail</h1>
            <p className="mt-1 max-w-3xl text-sm text-[var(--color-ink-muted)]">
              Search and filter the canonical browser-session event record. Raw source text and preview-only notes are never inserted here.
            </p>
          </div>
        </div>
        <Alert title="Explanatory prototype record" tone="neutral">
          This is not an immutable, forensic, tamper-evident, independently witnessed, or production-grade audit log.
        </Alert>
      </header>

      <section aria-label="Audit filters" className="grid gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
        <label className="relative">
          <span className="sr-only">Search audit events</span>
          <Search aria-hidden="true" className="absolute left-3 top-3 text-[var(--color-ink-muted)]" size={16} />
          <input
            className="min-h-10 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] pl-9 pr-3 text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search safe summaries, IDs, or entities"
            type="search"
            value={query}
          />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="cfn-type-label">Actor</span>
          <Select onChange={(event) => setActor(event.target.value as ActorFilter)} value={actor}>
            <option value="all">All actors</option>
            <option value="practitioner">Practitioner</option>
            <option value="fixture_reviewer">Fixture reviewer</option>
            <option value="system">System</option>
          </Select>
        </label>
        <label className="grid gap-1 text-xs">
          <span className="cfn-type-label">Event type</span>
          <Select onChange={(event) => setEventType(event.target.value)} value={eventType}>
            <option value="all">All event types</option>
            {eventTypes.map((value) => (
              <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
            ))}
          </Select>
        </label>
      </section>

      <p className="font-mono text-xs text-[var(--color-ink-muted)]">
        Showing {visible.length} of {state.audit.length} canonical events
      </p>
      {state.audit.length && !visible.length ? (
        <Alert title="No audit events match these filters" tone="neutral">
          Clear or change the search, actor, or event-type filter.
        </Alert>
      ) : (
        <AuditHistory events={visible} />
      )}
    </div>
  );
}
