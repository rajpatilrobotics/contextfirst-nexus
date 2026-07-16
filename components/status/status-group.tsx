import type {
  CaseStatus,
  EvidenceNature,
  ItemOrigin,
  ReviewStatus,
  StageStatus,
  SupportStatus,
} from "../../lib/contracts";
import {
  caseStatusPresentation,
  evidenceNaturePresentation,
  itemOriginPresentation,
  navigationProgressPresentation,
  reviewStatusPresentation,
  supportStatusPresentation,
} from "../../lib/presentation";
import { StatusToken } from "./status-token";

export function EvidenceNatureStatus({ value }: { value: EvidenceNature }) {
  return <StatusToken label="Evidence nature" presentation={evidenceNaturePresentation[value]} />;
}

export function ItemOriginStatus({ value }: { value: ItemOrigin }) {
  return <StatusToken label="Item origin" presentation={itemOriginPresentation[value]} />;
}

export function SupportStatusBadge({ value }: { value: SupportStatus }) {
  return <StatusToken label="Support status" presentation={supportStatusPresentation[value]} />;
}

export function ReviewStatusBadge({ value }: { value: ReviewStatus }) {
  return <StatusToken label="Review status" presentation={reviewStatusPresentation[value]} />;
}

export function CaseStatusBadge({ value }: { value: CaseStatus }) {
  return <StatusToken label="Case status" presentation={caseStatusPresentation[value]} />;
}

export function NavigationProgressStatus({ value }: { value: StageStatus }) {
  return <StatusToken label="Navigation progress" presentation={navigationProgressPresentation[value]} />;
}

export function StatusMatrix({
  evidenceNature,
  itemOrigin,
  supportStatus,
  reviewStatus,
  caseStatus,
}: {
  evidenceNature: EvidenceNature;
  itemOrigin: ItemOrigin;
  supportStatus: SupportStatus;
  reviewStatus: ReviewStatus;
  caseStatus: CaseStatus;
}) {
  return (
    <dl aria-label="Separate status systems" className="grid gap-3">
      <div>
        <dt className="cfn-type-label">Evidence nature</dt>
        <dd>
          <EvidenceNatureStatus value={evidenceNature} />
        </dd>
      </div>
      <div>
        <dt className="cfn-type-label">Item origin</dt>
        <dd>
          <ItemOriginStatus value={itemOrigin} />
        </dd>
      </div>
      <div>
        <dt className="cfn-type-label">Support status</dt>
        <dd>
          <SupportStatusBadge value={supportStatus} />
        </dd>
      </div>
      <div>
        <dt className="cfn-type-label">Review status</dt>
        <dd>
          <ReviewStatusBadge value={reviewStatus} />
        </dd>
      </div>
      <div>
        <dt className="cfn-type-label">Case status</dt>
        <dd>
          <CaseStatusBadge value={caseStatus} />
        </dd>
      </div>
    </dl>
  );
}
