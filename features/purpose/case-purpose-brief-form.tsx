"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CasePurposeBriefSchema,
  RequiredExcludedDecisions,
  type CasePurposeBrief,
  type ExcludedDecision,
  type ProviderOptionProjection,
} from "../../lib/contracts";
import {
  Alert,
  Button,
  Checkbox,
  FieldError,
  Input,
  Label,
  Select,
  Textarea,
} from "../../components/ui";
import { AnalysisDisclosurePanel } from "../analysis/provider-selection";

type FormErrors = Record<string, string>;

export type CasePurposeBriefFormProps = {
  analysisOption: ProviderOptionProjection | null;
  initialBrief?: CasePurposeBrief | null;
  disabled?: boolean;
  onSave: (brief: CasePurposeBrief) => Promise<string | null> | string | null;
};

const excludedDecisionLabels: Record<ExcludedDecision, string> = {
  victim_or_trafficking_status: "Victim or trafficking status",
  credibility: "Credibility",
  guilt_or_innocence: "Guilt or innocence",
  legal_eligibility: "Legal eligibility",
  non_punishment_eligibility: "Non-punishment eligibility",
  case_priority: "Case priority",
  prosecution_sentence_or_outcome: "Prosecution, sentence, or case outcome",
};

function initialExcluded(brief?: CasePurposeBrief | null) {
  return new Set<ExcludedDecision>(brief?.excludedDecisions ?? []);
}

export function CasePurposeBriefForm({
  analysisOption,
  initialBrief = null,
  disabled = false,
  onSave,
}: CasePurposeBriefFormProps) {
  const [practitionerRole, setPractitionerRole] = useState(initialBrief?.practitionerRole ?? "");
  const [organizationType, setOrganizationType] = useState(initialBrief?.organizationType ?? "");
  const [statedPurpose, setStatedPurpose] = useState(initialBrief?.statedPurpose ?? "");
  const [intendedRecipient, setIntendedRecipient] = useState(initialBrief?.intendedRecipient ?? "");
  const [intendedRecipientCategory, setIntendedRecipientCategory] = useState(
    initialBrief?.intendedRecipientCategory ?? "",
  );
  const [jurisdictionCode, setJurisdictionCode] = useState(initialBrief?.jurisdictionCode ?? "");
  const [translationStatus, setTranslationStatus] = useState(initialBrief?.translationStatus ?? "");
  const [requestedExport, setRequestedExport] = useState(initialBrief?.requestedExport ?? "");
  const [excludedDecisions, setExcludedDecisions] = useState(() => initialExcluded(initialBrief));
  const [authorityAttested, setAuthorityAttested] = useState(initialBrief?.authorityAttested ?? false);
  const [authorityNotVerified, setAuthorityNotVerified] = useState(
    initialBrief?.authority.authorityNotVerifiedAcknowledged ?? false,
  );
  const [syntheticAttested, setSyntheticAttested] = useState(
    initialBrief?.authority.syntheticOrHarmlessDataAttested ?? false,
  );
  const [syntheticAcknowledged, setSyntheticAcknowledged] = useState(
    initialBrief?.syntheticDataAcknowledged ?? false,
  );
  const [prohibitedAcknowledged, setProhibitedAcknowledged] = useState(
    initialBrief?.prohibitedDecisionsAcknowledged ?? false,
  );
  const [cooperationAcknowledged, setCooperationAcknowledged] = useState(
    initialBrief?.cooperationNeutralityAcknowledged ?? false,
  );
  const [analysisAcknowledged, setAnalysisAcknowledged] = useState(() => {
    const selection = initialBrief?.providerSelection;
    if (!selection || !analysisOption) return false;
    return selection.providerId === analysisOption.providerId
      && selection.releaseConfigurationId === analysisOption.releaseConfigurationId
      && selection.serviceTier === analysisOption.serviceTier
      && selection.disclosureAcknowledgement.disclosureVersion
        === analysisOption.disclosure.disclosureVersion;
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Object.keys(errors).length > 0) errorSummaryRef.current?.focus();
  }, [errors]);

  function toggleExcluded(decision: ExcludedDecision, checked: boolean) {
    setExcludedDecisions((current) => {
      const next = new Set(current);
      if (checked) next.add(decision);
      else next.delete(decision);
      return next;
    });
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!practitionerRole) next.practitionerRole = "Choose the practitioner role.";
    if (!organizationType) next.organizationType = "Choose the organization type.";
    if (!statedPurpose.trim()) next.statedPurpose = "Enter the authorized case-preparation purpose.";
    if (!intendedRecipient.trim()) next.intendedRecipient = "Enter the intended recipient or handoff.";
    if (!intendedRecipientCategory) next.intendedRecipientCategory = "Choose the recipient category.";
    if (!jurisdictionCode) next.jurisdictionCode = "Choose the fictional jurisdiction for later verification.";
    if (!translationStatus) next.translationStatus = "Choose the translation status.";
    if (!requestedExport) next.requestedExport = "Choose one requested handoff kind.";
    if (RequiredExcludedDecisions.some((decision) => !excludedDecisions.has(decision))) {
      next.excludedDecisions = "Confirm every decision that remains outside system support.";
    }
    if (!authorityAttested) next.authorityAttested = "Confirm the fictional demo-data authority basis.";
    if (!authorityNotVerified) next.authorityNotVerified = "Acknowledge that the system cannot verify authority.";
    if (!syntheticAttested) next.syntheticAttested = "Attest that this is the bundled fictional demo packet.";
    if (!syntheticAcknowledged) next.syntheticAcknowledged = "Acknowledge the demo-only data boundary.";
    if (!prohibitedAcknowledged) next.prohibitedAcknowledged = "Acknowledge the prohibited-decision boundary.";
    if (!cooperationAcknowledged) next.cooperationAcknowledged = "Confirm cooperation neutrality.";
    if (!analysisOption) next.analysisService = "Analysis service unavailable";
    if (analysisOption && !analysisAcknowledged) {
      next.analysisAcknowledgement = "Acknowledge how this prepared local analysis works.";
    }
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const selected = analysisOption;
    if (!selected || !analysisAcknowledged) {
      setErrors({ form: "Analysis service unavailable" });
      return;
    }

    const now = new Date().toISOString();
    const acknowledgement = {
      id: `ACK-${selected.releaseConfigurationId.toUpperCase()}-${Date.now()}`,
      schemaVersion: "1.0.0" as const,
      disclosureVersion: selected.disclosure.disclosureVersion,
      providerId: selected.providerId,
      releaseConfigurationId: selected.releaseConfigurationId,
      serviceTier: selected.serviceTier,
      dataFlowAcknowledged: true as const,
      retentionAndTrainingUseAcknowledged: true as const,
      serviceTierAcknowledged: true as const,
      acknowledgedAt: now,
    };
    const candidate = {
      id: initialBrief?.id ?? "PURPOSE-CFN-DEMO-001",
      schemaVersion: "1.0.0" as const,
      caseId: "CFN-DEMO-001",
      revision: (initialBrief?.revision ?? 0) + 1,
      status: "complete" as const,
      practitionerRole,
      organizationType,
      supportedWorkflow: "case_preparation_handoff" as const,
      statedPurpose: statedPurpose.trim(),
      excludedDecisions: RequiredExcludedDecisions.filter((decision) => excludedDecisions.has(decision)),
      authority: {
        basis: "not_applicable_synthetic_fixture" as const,
        status: "active" as const,
        consentStatus: "not_applicable_synthetic_fixture" as const,
        authorityNotVerifiedAcknowledged: true as const,
        syntheticOrHarmlessDataAttested: true as const,
      },
      jurisdictionCode,
      sourceLanguage: "en" as const,
      translationStatus,
      intendedRecipient: intendedRecipient.trim(),
      intendedRecipientCategory,
      requestedExport,
      prohibitedDecisionsAcknowledged: true as const,
      syntheticDataAcknowledged: true as const,
      providerSelection: {
        providerId: selected.providerId,
        releaseConfigurationId: selected.releaseConfigurationId,
        serviceTier: selected.serviceTier,
        disclosureAcknowledgement: acknowledgement,
      },
      cooperationNeutralityAcknowledged: true as const,
      authorityAttested: true as const,
      createdAt: initialBrief?.createdAt ?? now,
      updatedAt: now,
    };
    const parsed = CasePurposeBriefSchema.safeParse(candidate);
    if (!parsed.success) {
      setErrors({ form: "The purpose brief did not pass the canonical contract. Review every field." });
      return;
    }
    const failure = await onSave(parsed.data);
    if (failure) {
      setErrors({ form: failure });
      return;
    }
    setErrors({});
    setSaveMessage("Case Purpose Brief saved. Saving does not start analysis.");
  }

  function focusField(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    document.getElementById(id)?.focus();
  }

  const errorTargets: Record<string, string> = {
    practitionerRole: "practitioner-role",
    organizationType: "organization-type",
    statedPurpose: "stated-purpose",
    intendedRecipient: "intended-recipient",
    intendedRecipientCategory: "intended-recipient-category",
    jurisdictionCode: "jurisdiction-code",
    translationStatus: "translation-status",
    requestedExport: "requested-export",
    excludedDecisions: "excluded-decisions",
    authorityAttested: "authority-attested",
    authorityNotVerified: "authority-not-verified",
    syntheticAttested: "synthetic-attested",
    syntheticAcknowledged: "synthetic-acknowledged",
    prohibitedAcknowledged: "prohibited-acknowledged",
    cooperationAcknowledged: "cooperation-acknowledged",
    analysisService: "purpose-form",
    analysisAcknowledgement: "analysis-disclosure-acknowledgement",
    form: "purpose-form",
  };

  return (
    <form className="grid gap-6" id="purpose-form" noValidate onSubmit={handleSubmit} tabIndex={-1}>
      {Object.keys(errors).length > 0 ? (
        <div
          aria-labelledby="purpose-error-summary-heading"
          className="rounded-[var(--radius-card)] border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] p-4"
          ref={errorSummaryRef}
          role="alert"
          tabIndex={-1}
        >
          <h3 className="cfn-type-heading-3" id="purpose-error-summary-heading">Review the Purpose Brief</h3>
          <ul className="list-disc pl-5">
            {Object.entries(errors).map(([key, message]) => (
              <li key={key}>
                <a href={`#${errorTargets[key]}`} onClick={(event) => focusField(event, errorTargets[key])}>
                  {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Alert title="Authority and prototype boundary" tone="warning">
        <p>
          This role chooser is not authentication. The system records your attestation but cannot verify
          your authority. Only bundled fictional adult fixture CFN-DEMO-001 is permitted.
        </p>
      </Alert>

      <fieldset className="grid gap-4">
        <legend className="cfn-type-heading-3">Practitioner and workflow</legend>
        <div>
          <Label htmlFor="practitioner-role">Practitioner role</Label>
          <Select id="practitioner-role" value={practitionerRole} onChange={(event) => setPractitionerRole(event.currentTarget.value as CasePurposeBrief["practitionerRole"] | "")}>
            <option value="">Choose role</option>
            <option value="legal_aid">Legal aid</option><option value="defence">Defence</option>
            <option value="public_defender">Public defender</option><option value="court_navigation">Court navigation</option>
            <option value="ngo_legal">NGO legal</option><option value="demo_evaluator">Demo evaluator</option>
          </Select>
          {errors.practitionerRole ? <FieldError id="practitioner-role-error">{errors.practitionerRole}</FieldError> : null}
        </div>
        <div>
          <Label htmlFor="organization-type">Organization type</Label>
          <Select id="organization-type" value={organizationType} onChange={(event) => setOrganizationType(event.currentTarget.value as CasePurposeBrief["organizationType"] | "")}>
            <option value="">Choose organization</option>
            <option value="legal_aid">Legal aid</option><option value="public_defender">Public defender</option>
            <option value="court_service">Court service</option><option value="ngo">NGO</option>
            <option value="law_office">Law office</option><option value="research_or_evaluation">Research or evaluation</option>
            <option value="other_authorized">Other authorized</option>
          </Select>
          {errors.organizationType ? <FieldError id="organization-type-error">{errors.organizationType}</FieldError> : null}
        </div>
        <div>
          <Label htmlFor="stated-purpose">Authorized purpose</Label>
          <Textarea id="stated-purpose" maxLength={500} value={statedPurpose} onChange={(event) => setStatedPurpose(event.currentTarget.value)} />
          {errors.statedPurpose ? <FieldError id="stated-purpose-error">{errors.statedPurpose}</FieldError> : null}
        </div>
        <p><strong>Supported workflow:</strong> Case preparation handoff.</p>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="cfn-type-heading-3">Handoff context</legend>
        <div><Label htmlFor="intended-recipient">Intended recipient or handoff</Label><Input id="intended-recipient" maxLength={500} value={intendedRecipient} onChange={(event) => setIntendedRecipient(event.currentTarget.value)} />{errors.intendedRecipient ? <FieldError id="intended-recipient-error">{errors.intendedRecipient}</FieldError> : null}</div>
        <div><Label htmlFor="intended-recipient-category">Recipient category</Label><Select id="intended-recipient-category" value={intendedRecipientCategory} onChange={(event) => setIntendedRecipientCategory(event.currentTarget.value as CasePurposeBrief["intendedRecipientCategory"] | "")}><option value="">Choose category</option><option value="legal_aid_team">Legal aid team</option><option value="public_defender">Public defender</option><option value="court_navigation">Court navigation</option><option value="ngo_caseworker">NGO caseworker</option><option value="policy_or_research_summary">Policy or research summary</option></Select>{errors.intendedRecipientCategory ? <FieldError id="intended-recipient-category-error">{errors.intendedRecipientCategory}</FieldError> : null}</div>
        <div><Label htmlFor="jurisdiction-code">Fictional jurisdiction</Label><Select id="jurisdiction-code" value={jurisdictionCode} onChange={(event) => setJurisdictionCode(event.currentTarget.value as CasePurposeBrief["jurisdictionCode"] | "")}><option value="">Choose jurisdiction</option><option value="J-01">J-01</option><option value="J-02">J-02</option><option value="unspecified">Unspecified</option></Select>{errors.jurisdictionCode ? <FieldError id="jurisdiction-code-error">{errors.jurisdictionCode}</FieldError> : null}</div>
        <div><Label htmlFor="translation-status">Translation status</Label><Select id="translation-status" value={translationStatus} onChange={(event) => setTranslationStatus(event.currentTarget.value as CasePurposeBrief["translationStatus"] | "")}><option value="">Choose status</option><option value="original_language">Original language</option><option value="translated_unverified">Translated, unverified</option><option value="unknown">Unknown</option></Select>{errors.translationStatus ? <FieldError id="translation-status-error">{errors.translationStatus}</FieldError> : null}</div>
        <p><strong>Source language:</strong> English.</p>
        <div><Label htmlFor="requested-export">Requested handoff</Label><Select id="requested-export" value={requestedExport} onChange={(event) => setRequestedExport(event.currentTarget.value as CasePurposeBrief["requestedExport"] | "")}><option value="">Choose one handoff</option><option value="full_practitioner_handoff">Full practitioner handoff</option><option value="minimum_necessary_safe_share">Minimum-necessary safe share</option></Select>{errors.requestedExport ? <FieldError id="requested-export-error">{errors.requestedExport}</FieldError> : null}</div>
      </fieldset>

      <fieldset className="grid gap-2" id="excluded-decisions" tabIndex={-1}>
        <legend className="cfn-type-heading-3">Decisions explicitly excluded from system support</legend>
        {RequiredExcludedDecisions.map((decision) => <Checkbox checked={excludedDecisions.has(decision)} id={`excluded-${decision}`} key={decision} label={excludedDecisionLabels[decision]} onChange={(event) => toggleExcluded(decision, event.currentTarget.checked)} />)}
        {errors.excludedDecisions ? <FieldError id="excluded-decisions-error">{errors.excludedDecisions}</FieldError> : null}
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="cfn-type-heading-3">Authority and safety acknowledgements</legend>
        <p>Authority basis and consent status: Not applicable to this fictional demo packet.</p>
        <Checkbox checked={authorityAttested} id="authority-attested" label="I attest that I am using this fictional demo packet for the stated authorized workflow." onChange={(event) => setAuthorityAttested(event.currentTarget.checked)} />
        {errors.authorityAttested ? <FieldError id="authority-attested-error">{errors.authorityAttested}</FieldError> : null}
        <Checkbox checked={authorityNotVerified} id="authority-not-verified" label="I understand that the system cannot verify my authority." onChange={(event) => setAuthorityNotVerified(event.currentTarget.checked)} />
        {errors.authorityNotVerified ? <FieldError id="authority-not-verified-error">{errors.authorityNotVerified}</FieldError> : null}
        <Checkbox checked={syntheticAttested} id="synthetic-attested" label="I attest that the material is the bundled fictional demo packet, not real or private case data." onChange={(event) => setSyntheticAttested(event.currentTarget.checked)} />
        {errors.syntheticAttested ? <FieldError id="synthetic-attested-error">{errors.syntheticAttested}</FieldError> : null}
        <Checkbox checked={syntheticAcknowledged} id="synthetic-acknowledged" label="I acknowledge the demo-only data boundary." onChange={(event) => setSyntheticAcknowledged(event.currentTarget.checked)} />
        {errors.syntheticAcknowledged ? <FieldError id="synthetic-acknowledged-error">{errors.syntheticAcknowledged}</FieldError> : null}
        <Checkbox checked={prohibitedAcknowledged} id="prohibited-acknowledged" label="I acknowledge that the system does not make the excluded consequential decisions." onChange={(event) => setProhibitedAcknowledged(event.currentTarget.checked)} />
        {errors.prohibitedAcknowledged ? <FieldError id="prohibited-acknowledged-error">{errors.prohibitedAcknowledged}</FieldError> : null}
        <Checkbox checked={cooperationAcknowledged} id="cooperation-acknowledged" label="I confirm that cooperation with authorities is not a condition of analysis." onChange={(event) => setCooperationAcknowledged(event.currentTarget.checked)} />
        {errors.cooperationAcknowledged ? <FieldError id="cooperation-acknowledged-error">{errors.cooperationAcknowledged}</FieldError> : null}
      </fieldset>

      {analysisOption ? (
        <AnalysisDisclosurePanel
          acknowledged={analysisAcknowledged}
          disabled={disabled}
          error={errors.analysisAcknowledgement}
          onAcknowledgementChange={setAnalysisAcknowledged}
        />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button disabled={disabled} type="submit" variant="primary">Save Case Purpose Brief</Button>
      </div>
      {saveMessage ? <p role="status" className="text-[var(--color-supported)]">{saveMessage}</p> : null}
    </form>
  );
}
