import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TableHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const controlClass =
  "cfn-control-target rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-ink)] shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export function Button({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <button
      className={joinClassNames(
        "cfn-control-target inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "border-[var(--color-brand)] bg-[var(--color-brand)] text-white hover:-translate-y-px hover:bg-[var(--color-brand-hover)] hover:shadow-md",
        variant === "secondary" &&
          "border-[var(--color-control-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]",
        variant === "danger" &&
          "border-[var(--color-danger)] bg-[var(--color-danger-subtle)] text-[var(--color-danger)]",
        className,
      )}
      type={props.type ?? "button"}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={joinClassNames("cfn-type-label block", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={joinClassNames(controlClass, "w-full", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={joinClassNames(controlClass, "min-h-28 w-full resize-y", className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={joinClassNames(controlClass, "w-full", className)} {...props} />;
}

export function Checkbox({
  label,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; id: string }) {
  return (
    <label className="inline-flex min-h-11 items-center gap-3">
      <input
        aria-describedby={props["aria-describedby"]}
        className="h-5 w-5 rounded border-[var(--color-control-border)]"
        id={id}
        type="checkbox"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function RadioGroup({
  legend,
  name,
  options,
}: {
  legend: string;
  name: string;
  options: Array<{ label: string; value: string; disabled?: boolean }>;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="cfn-type-label">{legend}</legend>
      {options.map((option) => (
        <label className="inline-flex min-h-11 items-center gap-3" key={option.value}>
          <input disabled={option.disabled} name={name} type="radio" value={option.value} />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p className="cfn-type-body-small text-[var(--color-danger)]" id={id} role="alert">
      {children}
    </p>
  );
}

export function Alert({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "warning" | "danger";
}) {
  return (
    <section
      aria-label={title}
      className={joinClassNames(
        "rounded-[var(--radius-card)] border px-4 py-3",
        tone === "neutral" && "border-[var(--color-border)] bg-[var(--color-neutral-subtle)]",
        tone === "warning" && "border-[var(--color-warning)] bg-[var(--color-warning-subtle)]",
        tone === "danger" && "border-[var(--color-danger)] bg-[var(--color-danger-subtle)]",
      )}
    >
      <h3 className="cfn-type-label">{title}</h3>
      <div>{children}</div>
    </section>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={joinClassNames("cfn-surface p-4 shadow-[0_1px_2px_rgb(22_37_29_/_5%)]", className)}>{children}</section>;
}

export function Dialog({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby="cfn-dialog-title"
      className="rounded-[var(--radius-dialog)] border border-[var(--color-control-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-elevated)]"
      role="dialog"
    >
      <h2 className="cfn-type-heading-3" id="cfn-dialog-title">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside
      aria-labelledby="cfn-sheet-title"
      className="w-full max-w-[400px] rounded-[var(--radius-dialog)] border border-[var(--color-control-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-elevated)]"
    >
      <h2 className="cfn-type-heading-3" id="cfn-sheet-title">
        {title}
      </h2>
      {children}
    </aside>
  );
}

export function Progress({
  label,
  value,
  max = 100,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  return (
    <div>
      <div className="cfn-type-label">{label}</div>
      <progress aria-label={label} className="h-3 w-full" max={max} value={value} />
    </div>
  );
}

export function Separator() {
  return <hr className="border-[var(--color-border)]" />;
}

export function Skeleton({ label }: { label: string }) {
  return (
    <div
      aria-label={label}
      className="min-h-11 rounded-[var(--radius-control)] bg-[var(--color-surface-subtle)]"
      role="status"
    />
  );
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="cfn-table-reflow">
      <table className={joinClassNames("w-full border-collapse", className)} {...props} />
    </div>
  );
}

export function Tabs({
  tabs,
}: {
  tabs: Array<{ id: string; label: string; selected?: boolean }>;
}) {
  return (
    <div aria-label="Tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          aria-selected={tab.selected ?? false}
          className="cfn-control-target rounded-[var(--radius-control)] px-3 py-2"
          id={`${tab.id}-tab`}
          key={tab.id}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Tooltip({ children, note }: { children: ReactNode; note: string }) {
  return (
    <span>
      {children}
      <span className="sr-only"> Supplemental information: {note}</span>
    </span>
  );
}
