import { CaseStateSchema, type CaseState } from "../contracts";

const DATABASE_NAME = "contextfirst-nexus.browser-analysis.v1";
const STORE_NAME = "analysis-snapshots";
const DATABASE_VERSION = 1;

export type BrowserCaseAnalysisStore = {
  load(caseId: string): Promise<CaseState | null>;
  save(caseId: string, state: CaseState): Promise<void>;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.addEventListener("upgradeneeded", () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "caseId" });
      }
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () =>
      reject(request.error ?? new Error("indexeddb_open_failed")),
    );
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () =>
      reject(request.error ?? new Error("indexeddb_request_failed")),
    );
  });
}

function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("abort", () =>
      reject(transaction.error ?? new Error("indexeddb_transaction_aborted")),
    );
    transaction.addEventListener("error", () =>
      reject(transaction.error ?? new Error("indexeddb_transaction_failed")),
    );
  });
}

export const browserCaseAnalysisStore: BrowserCaseAnalysisStore = {
  async load(caseId) {
    if (typeof indexedDB === "undefined") return null;
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const stored = await requestResult<{ caseId: string; state: unknown } | undefined>(
        transaction.objectStore(STORE_NAME).get(caseId),
      );
      if (!stored) return null;
      const parsed = CaseStateSchema.safeParse(stored.state);
      return parsed.success && parsed.data.caseId === caseId
        ? parsed.data
        : null;
    } finally {
      database.close();
    }
  },

  async save(caseId, state) {
    if (typeof indexedDB === "undefined") {
      throw new Error("indexeddb_unavailable");
    }
    const parsed = CaseStateSchema.parse(state);
    if (parsed.caseId !== caseId) {
      throw new Error("analysis_case_mismatch");
    }
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({ caseId, state: parsed });
      await transactionComplete(transaction);
    } finally {
      database.close();
    }
  },
};
