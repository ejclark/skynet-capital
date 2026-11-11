/**
 * A MEMBER'S TARGET SPLIT, CLIENT SIDE (#4607 slice 1) — read and written against the server
 * (`src/server/target-split-api-routes.ts`), never `prefs.ts`: a target is book data and must be
 * the same on every device the member signs in from.
 *
 *   GET  /api/target-split        → { wired, target: TargetSplit | null }
 *   POST /api/target-split/save   → { ok, target?, error? }
 *   POST /api/target-split/clear  → { ok, error? }
 *
 * No account or member id in any request: identity comes from the session alone.
 */

import type { TargetSplit, TargetSplitInput } from "../../../src/observatory/target-split";
import { postJson } from "./post";

export interface TargetSplitRead {
  /** False when this deployment has no store: the section says so instead of offering a form. */
  readonly wired: boolean;
  readonly target: TargetSplit | null;
}

export interface TargetSplitWriteResult {
  readonly ok: boolean;
  readonly target?: TargetSplit;
  readonly error?: string;
}

export const targetSplitKey = ["target-split"] as const;

export async function fetchTargetSplit(): Promise<TargetSplitRead> {
  const res = await fetch("/api/target-split", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`target-split ${res.status}`);
  return (await res.json()) as TargetSplitRead;
}

export const saveTargetSplitRequest = (input: TargetSplitInput): Promise<TargetSplitWriteResult> =>
  postJson("/api/target-split/save", input);

export const clearTargetSplitRequest = (): Promise<TargetSplitWriteResult> =>
  postJson("/api/target-split/clear", {});
