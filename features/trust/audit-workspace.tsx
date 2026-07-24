"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useCaseState } from "../../components/shell";
import {
  Chip,
  SectionTitle,
} from "../../components/lovable/nexus-ui";
import { Alert, Select } from "../../components/ui";
import type { AuditEvent } from "../../lib/contracts";

type ActorFilter = "all" | AuditEvent["actor"];

const ACTOR_LABELS: Record<AuditEvent["actor"], string> = {
  practitioner: "Current practitioner",
  fixture_reviewer: "Fixture reviewer",
  system: "System",
};

function eventLabel(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

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
    <div className="space-y-6">
      <SectionTitle
        description="Safe event descriptions only. Raw sensitive source content is never placed in audit summaries."
        eyebrow="Utility"
        title="Audit Trail"
      />

      <section
        aria-label="Audit filters"
        className="flex flex-wrap items-center gap-2"
      >
        <div className="flex flex-wrap gap-1">
          {["all", ...eventTypes].map((value) => (
            <button
              aria-pressed={eventType === value}
              className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${
                eventType === value
                  ? "border-[color:var(--amber)] bg-[color-mix(in_oklab,var(--amber)_15%,transparent)]"
                  : "border-border hover:bg-muted"
              }`}
              key={value}
              onClick={() => setEventType(value)}
              type="button"
            >
              {value === "all" ? "all" : eventLabel(value)}
            </button>
          ))}
        </div>
        <label className="relative min-w-[14rem] flex-1 lg:max-w-sm">
          <span className="sr-only">Search audit events</span>
          <Search aria-hidden="true" className="absolute left-2.5 top-2 text-muted-foreground" size={14} />
          <input
            className="h-8 w-full rounded-full border border-border bg-background pl-8 pr-3 text-xs"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search safe summaries, IDs, or entities"
            type="search"
            value={query}
          />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="sr-only">Actor</span>
          <Select
            aria-label="Actor"
            className="!min-h-8 !rounded-full !px-3 !py-1 !text-xs !shadow-none"
            onChange={(event) => setActor(event.target.value as ActorFilter)}
            value={actor}
          >
            <option value="all">All actors</option>
            <option value="practitioner">Practitioner</option>
            <option value="fixture_reviewer">Fixture reviewer</option>
            <option value="system">System</option>
          </Select>
        </label>
        <label className="grid gap-1 text-xs">
          <span className="sr-only">Event type</span>
          <Select
            aria-label="Event type"
            className="sr-only"
            onChange={(event) => setEventType(event.target.value)}
            value={eventType}
          >
            <option value="all">All event types</option>
            {eventTypes.map((value) => (
              <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
            ))}
          </Select>
        </label>
        <p className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">
          Showing {visible.length} of {state.audit.length} canonical events
        </p>
        <p
          aria-label="Demonstration only — this explanatory browser-session record is not a forensic or tamper-evident audit log."
          className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground"
          title="Demonstration only — this explanatory browser-session record is not a forensic or tamper-evident audit log."
        >
          <span className="font-semibold text-foreground">Demonstration only</span>
          {" — "}explanatory browser-session audit log.
          <span className="sr-only">
            This explanatory browser-session record is not a forensic or tamper-evident audit log.
          </span>
        </p>
      </section>

      {state.audit.length && !visible.length ? (
        <Alert title="No audit events match these filters" tone="neutral">
          Clear or change the search, actor, or event-type filter.
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Category</th>
                <th className="p-3">Event</th>
                <th className="p-3">Related</th>
                <th className="p-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {[...visible].sort((left, right) => right.sequence - left.sequence).map((event) => (
                <tr className="border-t border-border/60" key={event.id}>
                  <td className="whitespace-nowrap p-3 font-mono text-xs">
                    {new Date(event.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">{ACTOR_LABELS[event.actor]}</td>
                  <td className="p-3">{eventLabel(event.eventType)}</td>
                  <td className="min-w-[18rem] p-3">{event.summary}</td>
                  <td className="p-3 font-mono text-xs">
                    {event.entityIds.length ? event.entityIds.join(", ") : "—"}
                  </td>
                  <td className="p-3">
                    <Chip tone={event.actor === "practitioner" ? "sage" : "mute"}>
                      Recorded
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
