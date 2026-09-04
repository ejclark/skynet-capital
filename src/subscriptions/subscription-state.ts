import { PLAYBOOK_MODES, type PlaybookMode, type PlaybookSubscription } from "../domain/types.js";
import { isRecord } from "../storage/parse-guards.js";

/**
 * PLAYBOOK SUBSCRIPTIONS — the durable state behind an account's Playbook Store.
 *
 * Keyed by `accountId`, one array of subscriptions per account — subscribing is always against
 * your OWN account's capital (bot or human, same mechanism), so there is no cross-account
 * lookup here at all. Mirrors `src/autonomous/bot-controls.ts`'s split of types+parser from the
 * store that persists them (`src/server/subscription-store.ts`).
 */
export type SubscriptionsState = Readonly<Record<string, readonly PlaybookSubscription[]>>;

export const EMPTY_SUBSCRIPTIONS: SubscriptionsState = {};

function parseSubscription(raw: unknown, accountId: string): PlaybookSubscription | null {
  if (!isRecord(raw)) return null;
  const { playbookId, mode, capitalAllocated, enabled, createdAt, updatedAt } = raw;
  if (typeof playbookId !== "string" || playbookId.length === 0) return null;
  if (typeof mode !== "string" || !PLAYBOOK_MODES.includes(mode as PlaybookMode)) return null;
  if (typeof capitalAllocated !== "number" || !Number.isFinite(capitalAllocated)) return null;
  if (typeof enabled !== "boolean") return null;
  if (typeof createdAt !== "string" || typeof updatedAt !== "string") return null;
  return {
    accountId,
    playbookId,
    mode: mode as PlaybookMode,
    capitalAllocated,
    enabled,
    createdAt,
    updatedAt,
  };
}

/**
 * Total, defensive parse — a torn file, an old schema, or a hostile body can only ever produce
 * `null` (caller falls back to `EMPTY_SUBSCRIPTIONS`), never a throw. Individual malformed
 * subscriptions inside an otherwise-valid file are dropped, not fatal to the whole state.
 */
export function parseSubscriptionsState(raw: unknown): SubscriptionsState | null {
  if (!isRecord(raw)) return null;
  const state: Record<string, readonly PlaybookSubscription[]> = {};
  for (const [accountId, value] of Object.entries(raw)) {
    if (!Array.isArray(value)) continue;
    const subs = value
      .map((entry) => parseSubscription(entry, accountId))
      .filter((s): s is PlaybookSubscription => s !== null);
    if (subs.length > 0) state[accountId] = subs;
  }
  return state;
}
