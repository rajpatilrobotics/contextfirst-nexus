import { History, UserRoundCheck } from "lucide-react";
import type { AuditEvent } from "../../lib/contracts";
import { Alert, Card } from "../../components/ui";
import { StatusMark } from "./status-mark";

const ACTOR_LABELS: Record<AuditEvent["actor"], string> = {
  practitioner: "Current practitioner",
  fixture_reviewer: "Fixture reviewer",
  system: "System",
};

function eventLabel(eventType: AuditEvent["eventType"]) {
  return eventType.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function SafeField({ label, value, code = false }: { label: string; value: string; code?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="cfn-type-label text-[var(--color-ink-muted)]">{label}</dt>
      <dd className={code ? "cfn-type-code break-all" : "break-words"}>{value}</dd>
    </div>
  );
}

export function AuditHistory({ events }: { events: AuditEvent[] }) {
  const ordered = [...events].sort((left, right) => left.sequence - right.sequence);
  return (
    <section aria-labelledby="audit-heading" className="grid min-w-0 gap-4" id="audit-history">
      <div className="flex items-start gap-3">
        <History aria-hidden="true" className="mt-1 shrink-0 text-[var(--color-brand)]" size={22} />
        <div>
          <p className="cfn-type-label text-[var(--color-brand)]">Browser-session record</p>
          <h2 className="cfn-type-heading-2" id="audit-heading">Safe Audit History</h2>
          <p className="text-[var(--color-ink-muted)]">
            An explanatory synthetic-demo record, not an immutable, forensic, tamper-evident, independently witnessed, or production-grade audit log.
          </p>
        </div>
      </div>

      {ordered.length ? (
        <ol className="grid gap-4">
          {ordered.map((event) => (
            <li key={event.id}>
              <Card className="grid gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="cfn-type-label text-[var(--color-ink-muted)]">Sequence {event.sequence}</p>
                    <h3 className="cfn-type-heading-3">{eventLabel(event.eventType)}</h3>
                  </div>
                  <StatusMark
                    label={ACTOR_LABELS[event.actor]}
                    tone={event.actor === "fixture_reviewer" ? "brand" : "neutral"}
                  />
                </div>

                <div className="flex gap-2 rounded-[var(--radius-control)] bg-[var(--color-neutral-subtle)] p-3">
                  <UserRoundCheck aria-hidden="true" className="mt-1 shrink-0" size={18} />
                  <p><span className="font-semibold">Safe action summary:</span> {event.summary}</p>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <SafeField label="Audit event" value={event.id} code />
                  <SafeField label="Time" value={event.createdAt} />
                  {event.analysisRunId ? <SafeField label="Analysis run" value={event.analysisRunId} code /> : null}
                  {event.recoveryOfRunId ? <SafeField label="Recovery of run" value={event.recoveryOfRunId} code /> : null}
                  {event.providerId ? <SafeField label="Provider registry ID" value={event.providerId} code /> : null}
                  {event.releaseConfigurationId ? <SafeField label="Release configuration" value={event.releaseConfigurationId} code /> : null}
                  {event.startCommandId ? <SafeField label="Start command link" value={event.startCommandId} code /> : null}
                  <SafeField
                    label="Affected entity IDs"
                    value={event.entityIds.length ? event.entityIds.join(", ") : "No affected entity ID recorded"}
                    code={event.entityIds.length > 0}
                  />
                </dl>
              </Card>
            </li>
          ))}
        </ol>
      ) : (
        <Alert title="No audit events in this browser session" tone="neutral">
          <p className="mt-2">
            No practitioner, fixture-reviewer, or system action is recorded. An empty history does not imply that processing or review occurred.
          </p>
        </Alert>
      )}
    </section>
  );
}
