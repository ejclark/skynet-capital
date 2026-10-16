import {
  PLAYBOOK_MODES,
  type PlaybookMode,
  type PlaybookSubscription,
  type SubscriptionConviction,
} from "../domain/types.js";
import { boundedString, isRecord } from "../storage/parse-guards.js";

/**
 * PLAYBOOK SUBSCRIPTIONS — the durable state behind an account's Playbook Store.
 *
 * Keyed by `accountId`, one array of subscriptions per account — subscribing is always against
 * your OWN account's capital (one mechanism for every account kind; for now only bot accounts may
 * subscribe, refused at the Store API — #4610), so there is no cross-account lookup here at all. Mirrors `src/autonomous/bot-controls.ts`'s split of types+parser from the
 * store that persists them (`src/server/subscription-store.ts`).
 *
 * A record keeps every field this build does not know (#4772): an older build reading a file a
 * newer one wrote must write those fields back unchanged, so they ride on the parsed record. They
 * are never read here, and `subscriptionsVersion` names its fields explicitly, so they never change
 * what a bot trades. What the file holds beyond the accounts — a record that would not parse, the
 * strategy allocations — is `subscriptions-file.ts`'s.
 */
export type SubscriptionsState = Readonly<Record<string, readonly PlaybookSubscription[]>>;

export const EMPTY_SUBSCRIPTIONS: SubscriptionsState = {};

/** A top-level key starting with this is a file-level record (`$allocations`), never an account. */
export const RESERVED_KEY_PREFIX = "$";

/** Every field this build reads off a record. Anything else is a newer build's, carried as is. */
const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  "accountId",
  "playbookId",
  "mode",
  "capitalAllocated",
  "enabled",
  "createdAt",
  "updatedAt",
  "symbols",
  "compoundAllocation",
  "conviction",
]);

/** The fields a subscribe sets; a re-subscribe carries everything else forward from the record it
 *  replaces — a conviction (unless the subscribe states its own) and any newer build's field. */
const SET_BY_SUBSCRIBE: ReadonlySet<string> = new Set([
  "accountId",
  "playbookId",
  "mode",
  "capitalAllocated",
  "enabled",
  "createdAt",
  "updatedAt",
  "symbols",
  "compoundAllocation",
]);

const pick = (record: object, keep: (key: string) => boolean): Record<string, unknown> =>
  Object.fromEntries(Object.entries(record).filter(([key]) => keep(key)));

/** What a re-subscribe keeps from the record it replaces (#4772). */
export function carriedOnResubscribe(prior: PlaybookSubscription): Record<string, unknown> {
  return pick(prior, (key) => !SET_BY_SUBSCRIBE.has(key));
}

/** A malformed `symbols` (not an array, or one with a non-string/empty entry) drops the WHOLE
 *  filter back to "unrestricted" rather than the subscription — the safe default, since an
 *  accidentally-empty filter would silently block every buy under it. */
function parseSymbols(raw: unknown): readonly string[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const symbols = raw.filter((s): s is string => typeof s === "string" && s.length > 0);
  return symbols.length === raw.length ? symbols : undefined;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar day — `2027-02-30` is shaped right and is not one. */
export function isCalendarDay(value: unknown): value is string {
  if (typeof value !== "string" || !DAY.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

/** A malformed conviction (blank, over `boundedString`'s cap, or no real check day) drops the
 *  conviction, never the subscription — the same posture as a malformed `symbols`, and the bots
 *  keep trading a pair with none on record (criterion 11). A sub-field a newer build added rides
 *  along unchanged, as a record's own unknown fields do (#4772). */
function parseConviction(raw: unknown): SubscriptionConviction | undefined {
  if (!isRecord(raw)) return undefined;
  const reason = boundedString(raw.reason);
  const { checkOn } = raw;
  if (reason === undefined || reason.trim().length === 0) return undefined;
  if (!isCalendarDay(checkOn)) return undefined;
  return { ...raw, reason, checkOn };
}

/** Parse one record, or null when this build cannot read it (`subscriptions-file.ts` keeps it). */
export function parseSubscription(raw: unknown, accountId: string): PlaybookSubscription | null {
  if (!isRecord(raw)) return null;
  const {
    playbookId,
    mode,
    capitalAllocated,
    enabled,
    createdAt,
    updatedAt,
    symbols,
    compoundAllocation,
    conviction,
  } = raw;
  if (typeof playbookId !== "string" || playbookId.length === 0) return null;
  if (typeof mode !== "string" || !PLAYBOOK_MODES.includes(mode as PlaybookMode)) return null;
  // Absent is a real value — "uncapped" (`PlaybookSubscription.capitalAllocated`'s doc). Present
  // but not a finite number is still malformed, never silently read as uncapped.
  if (
    capitalAllocated !== undefined &&
    (typeof capitalAllocated !== "number" || !Number.isFinite(capitalAllocated))
  ) {
    return null;
  }
  if (typeof enabled !== "boolean") return null;
  if (typeof createdAt !== "string" || typeof updatedAt !== "string") return null;
  const parsedSymbols = parseSymbols(symbols);
  const parsedConviction = parseConviction(conviction);
  return {
    ...pick(raw, (key) => !KNOWN_FIELDS.has(key)),
    accountId,
    playbookId,
    mode: mode as PlaybookMode,
    ...(capitalAllocated !== undefined ? { capitalAllocated } : {}),
    enabled,
    createdAt,
    updatedAt,
    ...(parsedSymbols ? { symbols: parsedSymbols } : {}),
    ...(compoundAllocation === true ? { compoundAllocation: true } : {}),
    ...(parsedConviction ? { conviction: parsedConviction } : {}),
  };
}

/**
 * Total, defensive parse — a torn file, an old schema, or a hostile body can only ever produce
 * `null` (caller falls back to `EMPTY_SUBSCRIPTIONS`), never a throw. Individual malformed
 * subscriptions inside an otherwise-valid file are dropped from the state (the store writes them
 * back unchanged — `subscriptions-file.ts`), not fatal to the whole state.
 */
export function parseSubscriptionsState(raw: unknown): SubscriptionsState | null {
  if (!isRecord(raw)) return null;
  const state: Record<string, readonly PlaybookSubscription[]> = {};
  for (const [accountId, value] of Object.entries(raw)) {
    if (accountId.startsWith(RESERVED_KEY_PREFIX) || !Array.isArray(value)) continue;
    const subs = value
      .map((entry) => parseSubscription(entry, accountId))
      .filter((s): s is PlaybookSubscription => s !== null);
    if (subs.length > 0) state[accountId] = subs;
  }
  return state;
}
