import {
  AlertTriangle,
  CheckCircle2,
  CircleOff,
  Clock3,
  Info,
  type LucideIcon,
  XCircle,
} from "lucide-react";

export type TrustStatusTone = "supported" | "danger" | "warning" | "neutral" | "brand";

const ICONS: Record<TrustStatusTone, LucideIcon> = {
  supported: CheckCircle2,
  danger: XCircle,
  warning: AlertTriangle,
  neutral: CircleOff,
  brand: Info,
};

export function StatusMark({
  label,
  tone,
}: {
  label: string;
  tone: TrustStatusTone;
}) {
  const Icon = ICONS[tone];
  return (
    <span className="cfn-status-token max-w-full" data-tone={tone}>
      <Icon aria-hidden="true" className="shrink-0" focusable="false" size={16} />
      <span className="break-words">{label}</span>
    </span>
  );
}

export function LoadingMark({ label }: { label: string }) {
  return (
    <span className="cfn-status-token" data-tone="brand" role="status">
      <Clock3 aria-hidden="true" size={16} />
      {label}
    </span>
  );
}
