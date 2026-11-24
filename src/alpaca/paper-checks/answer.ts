/**
 * A check's answer in words (#8256). The outcome is drawn from the attempts that ASK the question
 * (a check's instrumentation — a market buy that sets up an OCO, a read-back — never sets it), and
 * the sentence carries every answer as the broker gave it, so the README states what was seen and
 * never what the docs predicted.
 */
import type { Attempt } from "./desk.js";

export type Outcome =
  | "accepted"
  | "refused"
  | "not in window"
  | "not scriptable"
  | "error"
  /** Only in a `--dry-run`, which writes no results file — never on the record. */
  | "dry run";

export interface CheckAnswer {
  readonly outcome: Outcome;
  readonly answer: string;
  readonly attempts: readonly Attempt[];
}

/**
 * The row's outcome from the asking attempts: any refusal is `refused` (a limit exists, which is
 * what the question asks), an error with no refusal is `error`, all accepted is `accepted`.
 */
export function verdict(asking: readonly Attempt[]): Outcome {
  if (asking.length > 0 && asking.every((a) => a.result === "dry run")) return "dry run";
  if (asking.some((a) => a.result === "refused")) return "refused";
  if (asking.length === 0 || asking.some((a) => a.result === "error")) return "error";
  return "accepted";
}

/** "bracket, day: accepted, status accepted, legs held, held" — one attempt in words. */
export function said(attempt: Attempt): string {
  const parts: string[] = [attempt.result];
  if (attempt.httpStatus !== undefined && attempt.result !== "accepted") {
    parts.push(`HTTP ${attempt.httpStatus}`);
  }
  if (attempt.orderStatus) parts.push(`status ${attempt.orderStatus}`);
  if (attempt.legs?.length) {
    parts.push(`legs ${attempt.legs.map((l) => l.status ?? "unknown").join(" and ")}`);
  }
  if (attempt.fillPrice) parts.push(`filled at ${attempt.fillPrice}`);
  if (attempt.message) parts.push(`"${attempt.message}"`);
  return `${attempt.label}: ${parts.join(", ")}`;
}

export const sayAll = (attempts: readonly Attempt[]): string => attempts.map(said).join("; ");
