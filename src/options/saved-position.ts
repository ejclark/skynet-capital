import { isRecord } from "../storage/parse-guards.js";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";
import { cleanStake } from "./guidance-stake-parse.js";
import type { GuidanceStake } from "./position-guidance-types.js";

/**
 * A POSITION A MEMBER TYPED IN (#3968) — a real-money holding Skynet isn't connected to, saved so
 * guidance on it persists across devices instead of living only in this browser's storage (the
 * single, unnamed, per-symbol stake `app/src/live/guidance.ts` already keeps). Many can exist per
 * member, each named, each independently a stock position and/or an option leg via its `stake`
 * (the exact shape `positionGuidance()` already consumes — no second "what a position is" idea).
 *
 * Keyed by `opaqueMemberId(email)` (`src/server/feedback-issue.ts`), not a linked paper-desk id: a
 * member may hold zero or several desks, and this has nothing to do with any of them.
 */
export interface SavedPosition {
  /** Opaque, stable, member-scoped — never a desk id. */
  readonly id: string;
  readonly symbol: string;
  /** What the member called it ("my Fidelity CRWV calls") — required so a list of several reads. */
  readonly name: string;
  readonly stake: GuidanceStake;
  /** ISO-8601. */
  readonly createdAt: string;
  /** ISO-8601. */
  readonly updatedAt: string;
}

export type SavedPositionsState = Readonly<Record<string, readonly SavedPosition[]>>;

export const EMPTY_SAVED_POSITIONS: SavedPositionsState = {};

const MAX_NAME = 60;
const MAX_ID = 40;

function parseSavedPosition(raw: unknown): SavedPosition | null {
  if (!isRecord(raw)) return null;
  const r = raw;
  const id = typeof r.id === "string" && r.id.length > 0 && r.id.length <= MAX_ID ? r.id : null;
  const symbol =
    typeof r.symbol === "string" && UNDERLYING_PATTERN.test(r.symbol) ? r.symbol : null;
  const name =
    typeof r.name === "string" && r.name.trim().length > 0 && r.name.length <= MAX_NAME
      ? r.name.trim()
      : null;
  const createdAt = typeof r.createdAt === "string" ? r.createdAt : null;
  const updatedAt = typeof r.updatedAt === "string" ? r.updatedAt : null;
  if (!(id && symbol && name && createdAt && updatedAt)) return null;
  return { id, symbol, name, stake: cleanStake(r.stake), createdAt, updatedAt };
}

/**
 * Total, defensive parse — a torn file, an old schema, or a hostile body can only ever produce
 * `null` (caller falls back to `EMPTY_SAVED_POSITIONS`), never a throw. One malformed position
 * inside an otherwise-valid file is dropped, not fatal to the whole state (mirrors
 * `subscription-state.ts`'s `parseSubscriptionsState`).
 */
export function parseSavedPositionsState(raw: unknown): SavedPositionsState | null {
  if (!isRecord(raw)) return null;
  const state: Record<string, readonly SavedPosition[]> = {};
  for (const [accountKey, value] of Object.entries(raw)) {
    if (!Array.isArray(value)) continue;
    const positions = value.map(parseSavedPosition).filter((p): p is SavedPosition => p !== null);
    if (positions.length > 0) state[accountKey] = positions;
  }
  return state;
}
