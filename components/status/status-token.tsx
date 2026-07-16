import {
  AlertTriangle,
  Ban,
  Check,
  CircleDot,
  Clock,
  FileCheck,
  FileQuestion,
  Link2Off,
  LinkIcon,
  MinusCircle,
  PenLine,
  Quote,
  RefreshCcw,
  Scissors,
  Sparkles,
  UserPen,
  X,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { StatusPresentation } from "../../lib/presentation";

const icons = {
  "alert-triangle": AlertTriangle,
  ban: Ban,
  check: Check,
  "circle-dot": CircleDot,
  clock: Clock,
  "file-check": FileCheck,
  "file-question": FileQuestion,
  "link-check": LinkIcon,
  "link-off": Link2Off,
  "minus-circle": MinusCircle,
  pen: PenLine,
  quote: Quote,
  refresh: RefreshCcw,
  scissors: Scissors,
  sparkle: Sparkles,
  "user-pen": UserPen,
  x: X,
} satisfies Record<StatusPresentation["icon"], ComponentType<SVGProps<SVGSVGElement>>>;

export function StatusToken({
  label,
  presentation,
}: {
  label: string;
  presentation: StatusPresentation;
}) {
  const Icon = icons[presentation.icon];

  return (
    <span
      aria-label={`${label}: ${presentation.label}. ${presentation.description}`}
      className="cfn-status-token"
      data-pattern={presentation.pattern}
      data-tone={presentation.tone}
      title={presentation.description}
    >
      <Icon aria-hidden="true" focusable="false" size={16} strokeWidth={2.2} />
      <span>{presentation.label}</span>
    </span>
  );
}
