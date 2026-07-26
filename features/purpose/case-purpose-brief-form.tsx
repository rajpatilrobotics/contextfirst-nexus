"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Ban, CheckCircle2, ShieldCheck } from "lucide-react";
import {
  CasePurposeBriefSchema,
  RequiredExcludedDecisions,
  type CasePurposeBrief,
  type ExcludedDecision,
  type ProviderOptionProjection,
  type SourceMaterialClassification,
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
import {
  Chip,
  DemoOnlyNotice,
} from "../../components/lovable/nexus-ui";

type FormErrors = Record<string, string>;

export type CasePurposeBriefFormProps = {
  analysisOption: ProviderOptionProjection | null;
  caseId?: string;
  initialBrief?: CasePurposeBrief | null;
  disabled?: boolean;
  onSave: (brief: CasePurposeBrief) => Promise<string | null> | string | null;
  purposeBriefId?: string;
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
  caseId = "CFN-DEMO-001",
  initialBrief = null,
  disabled = false,
  onSave,
  purposeBriefId = "PURPOSE-CFN-DEMO-001",
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
  const [sourceMaterialClassification, setSourceMaterialClassification] = useState<
    SourceMaterialClassification | ""
  >(
    initialBrief?.sourceMaterialClassification ??
      (caseId === "CFN-DEMO-001" ? "bundled_synthetic_fixture" : ""),
  );
  const [excludedDecisions, setExcludedDecisions] = useState(() => initialExcluded(initialBrief));
  const [authorityAttested, setAuthorityAttested] = useState(initialBrief?.authorityAttested ?? false);
  const [authorityNotVerified, setAuthorityNotVerified] = useState(
    initialBrief?.authority.authorityNotVerifiedAcknowledged ?? false,
  );
  const [syntheticAttested, setSyntheticAttested] = useState(
    initialBrief?.authority.sourceMaterialAttested ?? false,
  );
  const [syntheticAcknowledged, setSyntheticAcknowledged] = useState(
    initialBrief?.sourceMaterialBoundaryAcknowledged ?? false,
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
    if (!sourceMaterialClassification) {
      next.sourceMaterialClassification = "Classify the packet as synthetic test material or authorized public material.";
    }
    if (RequiredExcludedDecisions.some((decision) => !excludedDecisions.has(decision))) {
      next.excludedDecisions = "Confirm every decision that remains outside system support.";
    }
    if (!authorityAttested) next.authorityAttested = "Confirm your authority to use the selected source material.";
    if (!authorityNotVerified) next.authorityNotVerified = "Acknowledge that the system cannot verify authority.";
    if (!syntheticAttested) next.syntheticAttested = "Attest that the packet matches the selected source-material classification.";
    if (!syntheticAcknowledged) next.syntheticAcknowledged = "Acknowledge that private or confidential case material is unavailable in this demonstration.";
    if (!prohibitedAcknowledged) next.prohibitedAcknowledged = "Acknowledge the prohibited-decision boundary.";
    if (!cooperationAcknowledged) next.cooperationAcknowledged = "Confirm cooperation neutrality.";
    if (!analysisOption) next.analysisService = "Analysis service unavailable";
    if (analysisOption && !analysisAcknowledged) {
      next.analysisAcknowledgement = "Acknowledge how local analysis works.";
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

    if (!sourceMaterialClassification) {
      setErrors({ sourceMaterialClassification: "Classify the packet before saving." });
      return;
    }
    const now = new Date().toISOString();
    const authorityByClassification = {
      bundled_synthetic_fixture: {
        basis: "not_applicable_synthetic_fixture",
        consentStatus: "not_applicable_synthetic_fixture",
      },
      user_attested_synthetic: {
        basis: "user_attested_synthetic_material",
        consentStatus: "not_applicable_synthetic_material",
      },
      user_attested_authorized_public: {
        basis: "user_attested_authorized_public_material",
        consentStatus: "not_applicable_authorized_public_material",
      },
    } as const;
    const purposeAuthority = authorityByClassification[sourceMaterialClassification];
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
      id: initialBrief?.id ?? purposeBriefId,
      schemaVersion: "1.0.0" as const,
      caseId,
      revision: (initialBrief?.revision ?? 0) + 1,
      status: "complete" as const,
      practitionerRole,
      organizationType,
      supportedWorkflow: "case_preparation_handoff" as const,
      statedPurpose: statedPurpose.trim(),
      excludedDecisions: RequiredExcludedDecisions.filter((decision) => excludedDecisions.has(decision)),
      sourceMaterialClassification,
      authority: {
        basis: purposeAuthority.basis,
        status: "active" as const,
        consentStatus: purposeAuthority.consentStatus,
        authorityNotVerifiedAcknowledged: true as const,
        sourceMaterialAttested: true as const,
      },
      jurisdictionCode,
      sourceLanguage: "en" as const,
      translationStatus,
      intendedRecipient: intendedRecipient.trim(),
      intendedRecipientCategory,
      requestedExport,
      prohibitedDecisionsAcknowledged: true as const,
      sourceMaterialBoundaryAcknowledged: true as const,
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
    sourceMaterialClassification: "source-material-classification",
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
    <form className="space-y-6" id="purpose-form" noValidate onSubmit={handleSubmit} tabIndex={-1}>
      {Object.keys(errors).length > 0 ? (
        <div
          aria-labelledby="purpose-error-summary-heading"
          className="rounded-[var(--radius-card)] border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] p-4"
          ref={errorSummaryRef}
          role="alert"
          tabIndex={-1}
        >
          <h3 className="font-serif text-lg leading-tight" id="purpose-error-summary-heading">Review the Purpose Brief</h3>
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <fieldset className="rounded-xl border border-border bg-card p-5">
            <legend className="px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Practitioner &amp; recipient
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1 text-sm">
                <Label className="!text-xs !font-normal text-muted-foreground" htmlFor="practitioner-role">Practitioner role</Label>
                <Select className="!min-h-0 !rounded-md !px-2.5 !py-1.5 !text-[13px] !shadow-none" id="practitioner-role" value={practitionerRole} onChange={(event) => setPractitionerRole(event.currentTarget.value as CasePurposeBrief["practitionerRole"] | "")}>
                  <option value="">Choose role</option>
                  <option value="legal_aid">Legal aid</option><option value="defence">Defence</option>
                  <option value="public_defender">Public defender</option><option value="court_navigation">Court navigation</option>
                  <option value="ngo_legal">NGO legal</option><option value="demo_evaluator">Demo evaluator</option>
                </Select>
                {errors.practitionerRole ? <FieldError id="practitioner-role-error">{errors.practitionerRole}</FieldError> : null}
              </div>
              <div className="grid gap-1 text-sm">
                <Label className="!text-xs !font-normal text-muted-foreground" htmlFor="organization-type">Organization type</Label>
                <Select className="!min-h-0 !rounded-md !px-2.5 !py-1.5 !text-[13px] !shadow-none" id="organization-type" value={organizationType} onChange={(event) => setOrganizationType(event.currentTarget.value as CasePurposeBrief["organizationType"] | "")}>
                  <option value="">Choose organization</option>
                  <option value="legal_aid">Legal aid</option><option value="public_defender">Public defender</option>
                  <option value="court_service">Court service</option><option value="ngo">NGO</option>
                  <option value="law_office">Law office</option><option value="research_or_evaluation">Research or evaluation</option>
                  <option value="other_authorized">Other authorized</option>
                </Select>
                {errors.organizationType ? <FieldError id="organization-type-error">{errors.organizationType}</FieldError> : null}
              </div>
              <div className="grid gap-1 text-sm">
                <Label className="!text-xs !font-normal text-muted-foreground" htmlFor="stated-purpose">Authorized purpose</Label>
                <Textarea className="!min-h-[50px] !rounded-md !px-2.5 !py-1.5 !text-[13px] !shadow-none" id="stated-purpose" maxLength={500} rows={2} value={statedPurpose} onChange={(event) => setStatedPurpose(event.currentTarget.value)} />
                {errors.statedPurpose ? <FieldError id="stated-purpose-error">{errors.statedPurpose}</FieldError> : null}
              </div>
              <div className="grid gap-1 text-sm">
                <Label className="!text-xs !font-normal text-muted-foreground" htmlFor="supported-workflow">Supported workflow</Label>
                <Select
                  aria-readonly="true"
                  className="!min-h-0 !rounded-md !px-2.5 !py-1.5 !text-[13px] !shadow-none"
                  defaultValue="case_preparation_handoff"
                  id="supported-workflow"
                >
                  <option value="case_preparation_handoff">Case preparation &amp; handoff</option>
                </Select>
              </div>
              <div className="grid gap-1 text-sm sm:col-span-2">
                <Label className="!text-xs !font-normal text-muted-foreground" htmlFor="source-material-classification">
                  Source material classification
                </Label>
                <Select
                  className="!min-h-0 !rounded-md !px-2.5 !py-1.5 !text-[13px] !shadow-none"
                  id="source-material-classification"
                  value={sourceMaterialClassification}
                  onChange={(event) => {
                    setSourceMaterialClassification(
                      event.currentTarget.value as SourceMaterialClassification | "",
                    );
                    setAuthorityAttested(false);
                    setSyntheticAttested(false);
                    setSyntheticAcknowledged(false);
                  }}
                >
                  <option value="">Choose source material</option>
                  {caseId === "CFN-DEMO-001" ? (
                    <option value="bundled_synthetic_fixture">Bundled synthetic demonstration</option>
                  ) : null}
                  <option value="user_attested_synthetic">Synthetic or hackathon test material</option>
                  <option value="user_attested_authorized_public">Authorized public material</option>
                </Select>
                <p className="text-[11px] leading-4 text-muted-foreground">
                  This is a practitioner attestation, not an authenticity or authority verification.
                </p>
                {errors.sourceMaterialClassification ? (
                  <FieldError id="source-material-classification-error">
                    {errors.sourceMaterialClassification}
                  </FieldError>
                ) : null}
              </div>
              <div className="grid gap-1 text-sm">
                <Label className="!text-xs !font-normal text-muted-foreground" htmlFor="intended-recipient">Intended recipient</Label>
                <Input aria-label="Intended recipient or handoff" className="!min-h-0 !rounded-md !px-2.5 !py-1.5 !text-[13px] !shadow-none" id="intended-recipient" maxLength={500} value={intendedRecipient} onChange={(event) => setIntendedRecipient(event.currentTarget.value)} />
                {errors.intendedRecipient ? <FieldError id="intended-recipient-error">{errors.intendedRecipient}</FieldError> : null}
              </div>
              <div className="grid gap-1 text-sm">
                <Label className="!text-xs !font-normal text-muted-foreground" htmlFor="intended-recipient-category">Recipient category</Label>
                <Select className="!min-h-0 !rounded-md !px-2.5 !py-1.5 !text-[13px] !shadow-none" id="intended-recipient-category" value={intendedRecipientCategory} onChange={(event) => setIntendedRecipientCategory(event.currentTarget.value as CasePurposeBrief["intendedRecipientCategory"] | "")}>
                  <option value="">Choose category</option><option value="legal_aid_team">Legal aid team</option>
                  <option value="public_defender">Public defender</option><option value="court_navigation">Court navigation</option>
                  <option value="ngo_caseworker">NGO caseworker</option><option value="policy_or_research_summary">Policy or research summary</option>
                </Select>
                {errors.intendedRecipientCategory ? <FieldError id="intended-recipient-category-error">{errors.intendedRecipientCategory}</FieldError> : null}
              </div>
              <div className="grid gap-1 text-sm">
                <Label className="!text-xs !font-normal text-muted-foreground" htmlFor="jurisdiction-code">Jurisdiction (verify locally)</Label>
                <Select aria-label="Fictional jurisdiction" className="!min-h-0 !rounded-md !px-2.5 !py-1.5 !text-[13px] !shadow-none" id="jurisdiction-code" value={jurisdictionCode} onChange={(event) => setJurisdictionCode(event.currentTarget.value as CasePurposeBrief["jurisdictionCode"] | "")}>
                  <option value="">Choose jurisdiction</option><option value="J-01">J-01</option>
                  <option value="J-02">J-02</option><option value="unspecified">Unspecified</option>
                </Select>
                {errors.jurisdictionCode ? <FieldError id="jurisdiction-code-error">{errors.jurisdictionCode}</FieldError> : null}
              </div>
              <div className="grid gap-1 text-sm">
                <Label className="!text-xs !font-normal text-muted-foreground" htmlFor="source-language">Source language</Label>
                <Input
                  className="!min-h-0 !rounded-md !px-2.5 !py-1.5 !text-[13px] !shadow-none"
                  id="source-language"
                  readOnly
                  value="English"
                />
              </div>
              <div className="grid gap-1 text-sm">
                <Label className="!text-xs !font-normal text-muted-foreground" htmlFor="translation-status">Translation status</Label>
                <Select className="!min-h-0 !rounded-md !px-2.5 !py-1.5 !text-[13px] !shadow-none" id="translation-status" value={translationStatus} onChange={(event) => setTranslationStatus(event.currentTarget.value as CasePurposeBrief["translationStatus"] | "")}>
                  <option value="">Choose status</option><option value="original_language">Original language</option>
                  <option value="translated_unverified">Translated, unverified</option><option value="unknown">Unknown</option>
                </Select>
                {errors.translationStatus ? <FieldError id="translation-status-error">{errors.translationStatus}</FieldError> : null}
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-border bg-card p-5">
            <legend className="px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Handoff type
            </legend>
            <div className="sr-only">
              <Label htmlFor="requested-export">Requested handoff</Label>
              <Select id="requested-export" value={requestedExport} onChange={(event) => setRequestedExport(event.currentTarget.value as CasePurposeBrief["requestedExport"] | "")}>
                <option value="">Choose one handoff</option>
                <option value="full_practitioner_handoff">Full practitioner handoff</option>
                <option value="minimum_necessary_safe_share">Minimum-necessary safe share</option>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                aria-pressed={requestedExport === "full_practitioner_handoff"}
                className={`cursor-pointer rounded-lg border p-4 text-left ${
                  requestedExport === "full_practitioner_handoff"
                    ? "border-[color:var(--amber)] bg-[color-mix(in_oklab,var(--amber)_10%,transparent)]"
                    : "border-border hover:bg-muted/50"
                }`}
                onClick={() => setRequestedExport("full_practitioner_handoff")}
                type="button"
              >
                <p className="font-serif text-lg">Full Practitioner Handoff</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  All source-linked observations, limitations, and reviewed notes for a designated practitioner.
                </p>
              </button>
              <button
                aria-pressed={requestedExport === "minimum_necessary_safe_share"}
                className={`cursor-pointer rounded-lg border p-4 text-left ${
                  requestedExport === "minimum_necessary_safe_share"
                    ? "border-[color:var(--amber)] bg-[color-mix(in_oklab,var(--amber)_10%,transparent)]"
                    : "border-border hover:bg-muted/50"
                }`}
                onClick={() => setRequestedExport("minimum_necessary_safe_share")}
                type="button"
              >
                <p className="font-serif text-lg">Minimum-Necessary Safe Share</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Only the fields required by the named recipient and declared purpose.
                </p>
              </button>
            </div>
            {errors.requestedExport ? <FieldError id="requested-export-error">{errors.requestedExport}</FieldError> : null}
          </fieldset>

          <fieldset className="rounded-xl border border-border bg-card p-5">
            <legend className="px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Required acknowledgements
            </legend>
            <ul className="space-y-2">
              <li className="rounded-md border border-border/70 bg-background px-3 py-1 text-sm">
                <Checkbox checked={authorityAttested} id="authority-attested" label="I attest that I am authorized to use the selected source material for this stated workflow." onChange={(event) => setAuthorityAttested(event.currentTarget.checked)} />
                {errors.authorityAttested ? <FieldError id="authority-attested-error">{errors.authorityAttested}</FieldError> : null}
              </li>
              <li className="rounded-md border border-border/70 bg-background px-3 py-1 text-sm">
                <Checkbox checked={authorityNotVerified} id="authority-not-verified" label="I understand that the system cannot verify my authority." onChange={(event) => setAuthorityNotVerified(event.currentTarget.checked)} />
                {errors.authorityNotVerified ? <FieldError id="authority-not-verified-error">{errors.authorityNotVerified}</FieldError> : null}
              </li>
              <li className="rounded-md border border-border/70 bg-background px-3 py-1 text-sm">
                <Checkbox checked={syntheticAttested} id="synthetic-attested" label="I attest that every selected PDF matches the source-material classification above." onChange={(event) => setSyntheticAttested(event.currentTarget.checked)} />
                {errors.syntheticAttested ? <FieldError id="synthetic-attested-error">{errors.syntheticAttested}</FieldError> : null}
              </li>
              <li className="rounded-md border border-border/70 bg-background px-3 py-1 text-sm">
                <Checkbox checked={syntheticAcknowledged} id="synthetic-acknowledged" label="I acknowledge that private or confidential case material is unavailable in this demonstration." onChange={(event) => setSyntheticAcknowledged(event.currentTarget.checked)} />
                {errors.syntheticAcknowledged ? <FieldError id="synthetic-acknowledged-error">{errors.syntheticAcknowledged}</FieldError> : null}
              </li>
              <li className="rounded-md border border-border/70 bg-background px-3 py-1 text-sm">
                <Checkbox checked={prohibitedAcknowledged} id="prohibited-acknowledged" label="I acknowledge that the system does not make the excluded consequential decisions." onChange={(event) => setProhibitedAcknowledged(event.currentTarget.checked)} />
                {errors.prohibitedAcknowledged ? <FieldError id="prohibited-acknowledged-error">{errors.prohibitedAcknowledged}</FieldError> : null}
              </li>
              <li className="rounded-md border border-border/70 bg-background px-3 py-1 text-sm">
                <Checkbox checked={cooperationAcknowledged} id="cooperation-acknowledged" label="I confirm that cooperation with authorities is not a condition of analysis." onChange={(event) => setCooperationAcknowledged(event.currentTarget.checked)} />
                {errors.cooperationAcknowledged ? <FieldError id="cooperation-acknowledged-error">{errors.cooperationAcknowledged}</FieldError> : null}
              </li>
              {analysisOption ? (
                <li className="rounded-md border border-border/70 bg-background px-3 py-1 text-sm">
                  <Checkbox
                    aria-describedby={errors.analysisAcknowledgement ? "analysis-disclosure-error" : undefined}
                    checked={analysisAcknowledged}
                    disabled={disabled}
                    id="analysis-disclosure-acknowledgement"
                    label="I understand that analysis uses prepared demo replay or browser-local source extraction, is not live AI, and has no provider transmission."
                    onChange={(event) => setAnalysisAcknowledged(event.currentTarget.checked)}
                  />
                  {errors.analysisAcknowledgement ? (
                    <FieldError id="analysis-disclosure-error">
                      {errors.analysisAcknowledgement}
                    </FieldError>
                  ) : null}
                </li>
              ) : null}
            </ul>
          </fieldset>

          <fieldset
            className="rounded-xl border border-border bg-muted/30 p-5"
            id="excluded-decisions"
            tabIndex={-1}
          >
            <legend className="px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Prohibited determinations
            </legend>
            <p className="mb-2 text-xs text-muted-foreground">
              Confirm every consequential decision that remains outside system support.
            </p>
            <div className="grid gap-1.5 text-sm sm:grid-cols-2">
              {RequiredExcludedDecisions.map((decision) => (
                <div className="flex items-start gap-2" key={decision}>
                  <Checkbox
                    checked={excludedDecisions.has(decision)}
                    id={`excluded-${decision}`}
                    label={(
                      <>
                        <Ban aria-hidden="true" className="shrink-0 text-[color:var(--rust)]" size={15} />
                        <span>{excludedDecisionLabels[decision]}</span>
                      </>
                    )}
                    onChange={(event) => toggleExcluded(decision, event.currentTarget.checked)}
                  />
                </div>
              ))}
            </div>
            {errors.excludedDecisions ? <FieldError id="excluded-decisions-error">{errors.excludedDecisions}</FieldError> : null}
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              aria-label="Save Case Purpose Brief"
              className="shrink-0"
              disabled={disabled}
              type="submit"
              variant="primary"
            >
              Record purpose &amp; continue
            </Button>
            {!saveMessage ? (
              <span className="text-xs text-muted-foreground">
                Complete all acknowledgements and choose a handoff type to enable.
              </span>
            ) : null}
            {saveMessage ? (
              <Chip tone="sage" icon={<CheckCircle2 className="h-3 w-3" />}>
                Ready to proceed
              </Chip>
            ) : null}
          </div>
          {saveMessage ? <p role="status" className="text-[var(--color-supported)]">{saveMessage}</p> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Alert title="Authority and prototype boundary" tone="warning">
              <p className="text-xs leading-5">
                This role chooser is not authentication. The system records your attestation but
                cannot verify your authority, authenticity, or public-source status. Use only
                synthetic test material or material you are authorized to use publicly. Private or
                confidential case material is unavailable in this demonstration. PDF text is
                extracted in this browser; any later provider transmission remains separately
                disclosed and consent-gated.
              </p>
            </Alert>

            <section
              aria-label="Human review boundary"
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="text-[var(--color-supported)]" size={18} />
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
                  Human review boundary
                </h3>
              </div>
              <p className="mt-2 text-sm leading-5 text-[var(--color-ink-muted)]">
                Saving records purpose and boundaries only. It does not start analysis or turn suggestions
                into practitioner findings.
              </p>
            </section>
          </div>
        </div>

        <aside className="space-y-3">
          <DemoOnlyNotice>
            the primary action is enabled by local state only.
          </DemoOnlyNotice>

          {analysisOption ? (
            <fieldset
              aria-describedby={errors.analysisAcknowledgement ? "analysis-disclosure-error" : undefined}
              className="rounded-xl border border-border bg-card p-4 text-xs"
            >
              <legend className="sr-only">How analysis works</legend>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground">
                Analysis-service disclosure
              </div>
              <p className="mt-2 text-muted-foreground">
                Any machine-assisted suggestion is labelled “Synthetic AI suggestion — not verified”.
                A suggestion never becomes a finding without an explicit practitioner decision.
              </p>
            </fieldset>
          ) : null}
        </aside>
      </div>
    </form>
  );
}
