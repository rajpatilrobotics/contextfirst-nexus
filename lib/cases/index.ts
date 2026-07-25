import { z } from "zod";
import {
  CasePurposeBriefSchema,
  type CasePurposeBrief,
} from "../contracts";

export const BROWSER_CASE_REGISTRY_STORAGE_KEY =
  "contextfirst-nexus.browser-cases.v1";

const BrowserCaseIdSchema = z.string().regex(/^CFN-CASE-[A-Z0-9-]+$/);
const DisplayReferenceSchema = z
  .string()
  .trim()
  .regex(/^REF-[A-Z0-9][A-Z0-9-]{2,39}$/);
const PersonAliasSchema = z.string().trim().min(1).max(80);
const PractitionerNameSchema = z.string().trim().min(1).max(80);
const TimestampSchema = z.string().datetime({ offset: true });

export const BrowserCaseRecordSchema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    id: BrowserCaseIdSchema,
    displayReference: DisplayReferenceSchema,
    personAlias: PersonAliasSchema,
    assignedPractitioner: PractitionerNameSchema,
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
    purposeBrief: CasePurposeBriefSchema.nullable(),
  })
  .superRefine((record, context) => {
    if (record.purposeBrief && record.purposeBrief.caseId !== record.id) {
      context.addIssue({
        code: "custom",
        message: "Purpose Brief belongs to a different case.",
        path: ["purposeBrief", "caseId"],
      });
    }
  });

export const BrowserCaseRegistrySchema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    cases: z.array(BrowserCaseRecordSchema),
  })
  .superRefine((registry, context) => {
    const ids = new Set<string>();
    const references = new Set<string>();
    registry.cases.forEach((record, index) => {
      if (ids.has(record.id)) {
        context.addIssue({
          code: "custom",
          message: "Case identifiers must be unique.",
          path: ["cases", index, "id"],
        });
      }
      if (references.has(record.displayReference)) {
        context.addIssue({
          code: "custom",
          message: "Case display references must be unique.",
          path: ["cases", index, "displayReference"],
        });
      }
      ids.add(record.id);
      references.add(record.displayReference);
    });
  });

export type BrowserCaseRecord = z.infer<typeof BrowserCaseRecordSchema>;
export type BrowserCaseRegistry = z.infer<typeof BrowserCaseRegistrySchema>;

export type BrowserStorage = Pick<Storage, "getItem" | "setItem">;

export type NewBrowserCaseInput = {
  assignedPractitioner: string;
  displayReference: string;
  personAlias: string;
};

type CreateBrowserCaseOptions = {
  idNonce?: string;
  now?: string;
};

export function createEmptyBrowserCaseRegistry(): BrowserCaseRegistry {
  return {
    schemaVersion: "1.0.0",
    cases: [],
  };
}

export function restoreBrowserCaseRegistry(serialized: string | null):
  | { ok: true; registry: BrowserCaseRegistry }
  | { ok: false; registry: BrowserCaseRegistry; reason: string } {
  if (serialized === null) {
    return { ok: true, registry: createEmptyBrowserCaseRegistry() };
  }

  try {
    const parsed = BrowserCaseRegistrySchema.safeParse(JSON.parse(serialized));
    if (!parsed.success) {
      return {
        ok: false,
        registry: createEmptyBrowserCaseRegistry(),
        reason: "Stored browser cases did not pass validation and were reset safely.",
      };
    }
    return { ok: true, registry: parsed.data };
  } catch {
    return {
      ok: false,
      registry: createEmptyBrowserCaseRegistry(),
      reason: "Stored browser cases could not be read and were reset safely.",
    };
  }
}

export function loadBrowserCaseRegistry(storage: BrowserStorage):
  ReturnType<typeof restoreBrowserCaseRegistry> {
  try {
    return restoreBrowserCaseRegistry(
      storage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
  } catch {
    return {
      ok: false,
      registry: createEmptyBrowserCaseRegistry(),
      reason: "Browser storage is unavailable. Cases cannot persist in this browser.",
    };
  }
}

export function persistBrowserCaseRegistry(
  storage: BrowserStorage,
  registry: BrowserCaseRegistry,
):
  | { ok: true }
  | { ok: false; reason: string } {
  const parsed = BrowserCaseRegistrySchema.safeParse(registry);
  if (!parsed.success) {
    return { ok: false, reason: "The browser case registry did not pass validation." };
  }
  try {
    storage.setItem(
      BROWSER_CASE_REGISTRY_STORAGE_KEY,
      JSON.stringify(parsed.data),
    );
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: "The case could not be saved in browser storage.",
    };
  }
}

function defaultNonce() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replaceAll("-", "").toUpperCase();
  }
  return `${Date.now()}${Math.random().toString(16).slice(2)}`.toUpperCase();
}

export function createBrowserCase(
  registry: BrowserCaseRegistry,
  input: NewBrowserCaseInput,
  options: CreateBrowserCaseOptions = {},
):
  | { ok: true; registry: BrowserCaseRegistry; record: BrowserCaseRecord }
  | { ok: false; reason: string } {
  const displayReference = input.displayReference.trim().toUpperCase();
  const parsedInput = z
    .strictObject({
      assignedPractitioner: PractitionerNameSchema,
      displayReference: DisplayReferenceSchema,
      personAlias: PersonAliasSchema,
    })
    .safeParse({
      assignedPractitioner: input.assignedPractitioner,
      displayReference,
      personAlias: input.personAlias,
    });

  if (!parsedInput.success) {
    return {
      ok: false,
      reason:
        "Enter a REF- case reference, a person alias, and an assigned practitioner.",
    };
  }
  if (
    registry.cases.some(
      (record) => record.displayReference === parsedInput.data.displayReference,
    )
  ) {
    return {
      ok: false,
      reason: "That case reference already exists in this browser.",
    };
  }

  const nonce = (options.idNonce ?? defaultNonce())
    .replace(/[^A-Za-z0-9-]/g, "")
    .toUpperCase();
  const now = options.now ?? new Date().toISOString();
  const record = BrowserCaseRecordSchema.safeParse({
    schemaVersion: "1.0.0",
    id: `CFN-CASE-${nonce}`,
    displayReference: parsedInput.data.displayReference,
    personAlias: parsedInput.data.personAlias,
    assignedPractitioner: parsedInput.data.assignedPractitioner,
    createdAt: now,
    updatedAt: now,
    purposeBrief: null,
  });
  if (!record.success || registry.cases.some((item) => item.id === record.data.id)) {
    return {
      ok: false,
      reason: "A unique case identifier could not be created. Try again.",
    };
  }

  const nextRegistry = BrowserCaseRegistrySchema.safeParse({
    ...registry,
    cases: [record.data, ...registry.cases],
  });
  if (!nextRegistry.success) {
    return { ok: false, reason: "The new case did not pass validation." };
  }
  return { ok: true, registry: nextRegistry.data, record: record.data };
}

export function saveBrowserCasePurpose(
  registry: BrowserCaseRegistry,
  caseId: string,
  purposeBrief: CasePurposeBrief,
):
  | { ok: true; registry: BrowserCaseRegistry; record: BrowserCaseRecord }
  | { ok: false; reason: string } {
  const index = registry.cases.findIndex((record) => record.id === caseId);
  if (index < 0) {
    return { ok: false, reason: "This browser-local case no longer exists." };
  }
  if (purposeBrief.caseId !== caseId) {
    return { ok: false, reason: "The Purpose Brief belongs to another case." };
  }

  const cases = [...registry.cases];
  cases[index] = {
    ...cases[index],
    purposeBrief,
    updatedAt: purposeBrief.updatedAt,
  };
  const nextRegistry = BrowserCaseRegistrySchema.safeParse({
    ...registry,
    cases,
  });
  if (!nextRegistry.success) {
    return { ok: false, reason: "The Purpose Brief did not pass case validation." };
  }
  return {
    ok: true,
    registry: nextRegistry.data,
    record: nextRegistry.data.cases[index],
  };
}

export function findBrowserCase(
  registry: BrowserCaseRegistry,
  caseId: string,
) {
  return registry.cases.find((record) => record.id === caseId) ?? null;
}
