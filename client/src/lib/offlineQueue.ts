import { openDB, type IDBPDatabase } from "idb";
import type { AttemptInput } from "./types";
import { api, ApiError } from "./apiClient";

// Section 34: if the backend is unreachable when a practice result is
// submitted, the record is queued in IndexedDB and retried once
// connectivity returns. The clientAttemptId doubles as the idempotency key
// (section 106) so a retried submission can never duplicate a record.

const DB_NAME = "gospel-drum-coach-offline";
const STORE = "pending-attempts";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "clientAttemptId" });
        }
      },
    });
  }
  return dbPromise;
}

export async function queueAttempt(attempt: AttemptInput): Promise<void> {
  const db = await getDb();
  await db.put(STORE, attempt);
}

export async function getQueuedAttempts(): Promise<AttemptInput[]> {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function removeQueuedAttempt(clientAttemptId: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, clientAttemptId);
}

export async function queuedCount(): Promise<number> {
  const db = await getDb();
  return db.count(STORE);
}

/** Best-effort flush of anything queued while offline. Never throws. */
export async function syncQueuedAttempts(): Promise<{ synced: number; remaining: number }> {
  const pending = await getQueuedAttempts();
  let synced = 0;

  for (const attempt of pending) {
    try {
      await api.post("/practice/attempt", attempt);
      await removeQueuedAttempt(attempt.clientAttemptId);
      synced += 1;
    } catch (err) {
      // A 4xx (e.g. exercise now locked, validation) will never succeed on
      // retry — drop it rather than retry forever. Network errors are left
      // queued for the next sync attempt.
      if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 0) {
        await removeQueuedAttempt(attempt.clientAttemptId);
      }
    }
  }

  const remaining = await queuedCount();
  return { synced, remaining };
}
