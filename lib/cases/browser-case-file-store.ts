const DATABASE_NAME = "contextfirst-nexus.browser-files.v1";
const STORE_NAME = "case-packets";
const DATABASE_VERSION = 1;

export type BrowserCaseFileStore = {
  load(caseId: string): Promise<readonly File[]>;
  save(caseId: string, files: readonly File[]): Promise<void>;
};

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () =>
      reject(request.error ?? new Error("indexeddb_request_failed")),
    );
  });
}

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

async function transactionComplete(transaction: IDBTransaction) {
  await new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("abort", () =>
      reject(transaction.error ?? new Error("indexeddb_transaction_aborted")),
    );
    transaction.addEventListener("error", () =>
      reject(transaction.error ?? new Error("indexeddb_transaction_failed")),
    );
  });
}

export const browserCaseFileStore: BrowserCaseFileStore = {
  async load(caseId) {
    if (typeof indexedDB === "undefined") return [];
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const stored = await requestResult<{
        caseId: string;
        files: File[];
      } | undefined>(transaction.objectStore(STORE_NAME).get(caseId));
      return stored?.files ?? [];
    } finally {
      database.close();
    }
  },

  async save(caseId, files) {
    if (typeof indexedDB === "undefined") {
      throw new Error("indexeddb_unavailable");
    }
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({
        caseId,
        files: Array.from(files),
      });
      await transactionComplete(transaction);
    } finally {
      database.close();
    }
  },
};
