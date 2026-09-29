/**
 * SAVED POSITIONS, CLIENT SIDE (#3968 slice 2) — a member's own typed-in positions, persisted on
 * the server (`src/server/saved-positions-store.ts`) instead of the single, unnamed, per-symbol
 * stake `app/src/live/guidance.ts` keeps in this browser alone. The server's `SavedPosition` shape
 * is reused verbatim here (not a second "view" type) — it already carries nothing but the member's
 * own data, the same posture `GuidanceStake` and `GuidanceMarket` already take between client and
 * server.
 *
 * Route contract (`src/server/saved-positions-api-routes.ts`, slice 1b):
 *   GET  /api/saved-positions                        → { positions: SavedPosition[] }
 *   POST /api/saved-positions/save                   → { ok, position? , error? }
 *   POST /api/saved-positions/update                  → { ok, error? }
 *   POST /api/saved-positions/delete                  → { ok, error? }
 * No `id`/account param on GET or in any body: identity comes from the session alone, exactly like
 * `/api/companion` — a saved position is never keyed by, or visible to, anyone but its owner.
 */

import type { GuidanceStake } from "../../../src/options/position-guidance-types";
import type { SavedPosition } from "../../../src/options/saved-position";
import { postJson } from "./post";

export interface SavedPositionWriteResult {
  readonly ok: boolean;
  readonly error?: string;
}

export interface SavePositionResult extends SavedPositionWriteResult {
  readonly position?: SavedPosition;
}

export async function fetchSavedPositions(): Promise<readonly SavedPosition[]> {
  const res = await fetch("/api/saved-positions", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`saved-positions ${res.status}`);
  const body = (await res.json()) as { readonly positions: readonly SavedPosition[] };
  return body.positions;
}

export const savedPositionsKey = ["saved-positions"] as const;

export const savePositionRequest = (input: {
  readonly symbol: string;
  readonly name: string;
  readonly stake: GuidanceStake;
}): Promise<SavePositionResult> => postJson("/api/saved-positions/save", input);

export const updatePositionRequest = (input: {
  readonly id: string;
  readonly name?: string;
  readonly stake?: GuidanceStake;
}): Promise<SavedPositionWriteResult> => postJson("/api/saved-positions/update", input);

export const deletePositionRequest = (id: string): Promise<SavedPositionWriteResult> =>
  postJson("/api/saved-positions/delete", { id });
