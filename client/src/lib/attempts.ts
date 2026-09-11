import { api, ApiError } from "./apiClient";
import { queueAttempt } from "./offlineQueue";
import type { AttemptInput, AttemptResult } from "./types";

export interface SubmitOutcome {
  queued: boolean;
  result: AttemptResult | null;
}

export function newClientAttemptId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function submitAttempt(input: AttemptInput): Promise<SubmitOutcome> {
  try {
    const result = await api.post<AttemptResult>("/practice/attempt", input);
    return { queued: false, result };
  } catch (err) {
    if (err instanceof ApiError && err.status === 0) {
      await queueAttempt(input);
      return { queued: true, result: null };
    }
    throw err;
  }
}
