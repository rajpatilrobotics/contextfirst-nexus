import type { ReactNode } from "react";
import { CaseShell } from "../../../components/shell";

export default function DemoCaseLayout({ children }: { children: ReactNode }) {
  return <CaseShell>{children}</CaseShell>;
}
