import { parseStoredConviction } from "../playbooks/conviction-parse.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { boundedString, isRecord } from "../storage/parse-guards.js";

/**
 * THE MEMBERS' CONVICTIONS WIRE (#5482 slice 6c, the EXPAND step) — the views members handed to
 * their bots, app → bots, folded into every `GET /controls` response as an additive `convictions`
 * field (the `authored-plays-wire.ts` shape: a pull, no new route or credential, no `fly*.toml`
 * change). The seeded records ship with the build (`conviction-seeds.ts`) and never ride here.
 *
 * It carries RECORDS ONLY, never a pointer: whether a bot is steered by a view is its own
 * subscription's `convictionId` on the normal path (`subscriptions-wire.ts`), and a record no
 * subscription points at steers nothing. Each record names the accounts it may steer — the bots its
 * owner held when they handed it over — and the bots resolve a pointer to it only on one of those
 * accounts (`autonomous-convictions.ts`), so one member's view can never narrow or stop another
 * member's bot, even if a pointer said so. The own-account rule is a comparison, not a convention.
 *
 * EXPAND FIRST, the order `subscriptions.v3` took: the bots read this field before the app writes
 * any pointer at a member's record. The app sends the set from that step on; a record joins it when
 * its owner hands it over (`conviction-hand-over.ts` writes the `steering` status). A bots
 * build that predates the field ignores it; an app that predates it omits it, and the bots read
 * that as "not reported" and keep what they had.
 *
 * The set is whole every time, so a view taken back simply stops appearing. Anything off parses to
 * `undefined` rather than to a partial set: a dropped record would leave its pairs running without
 * the narrowing their owner set, which is wider than they meant to trade.
 */

export const CONVICTIONS_WIRE_KIND = "convictions.v1";
/**
 * Room for every member at their 12-view cap (`MAX_CONVICTIONS_PER_MEMBER`) in a club of about
 * twenty. A set past it is refused whole, and the bots say so on every poll (`bot-controls-client.ts`)
 * rather than quietly keep steering by the last set they read.
 */
export const MAX_WIRED_CONVICTIONS = 256;
/** The bots one member owns; generous headroom. The member store reads a record past it as
 *  unreadable (`member-conviction-store.ts`), so the app never sends one. */
export const MAX_STEERED_ACCOUNTS = 16;
const MAX_ACCOUNT_ID = 64;

/** One member's view as the bots receive it: the record, and the accounts it may steer. */
export interface WiredConviction {
  readonly conviction: Conviction;
  /** Bot account ids (`persona.id`); never empty. */
  readonly accounts: readonly string[];
}

export interface ConvictionsWire {
  readonly kind: typeof CONVICTIONS_WIRE_KIND;
  /** Epoch ms the app read its store. */
  readonly at: number;
  readonly records: readonly WiredConviction[];
}

export function buildConvictionsWire(
  records: readonly WiredConviction[],
  at: number,
): ConvictionsWire {
  return { kind: CONVICTIONS_WIRE_KIND, at, records };
}

/** The accounts a record may steer: 1..MAX_STEERED_ACCOUNTS ids, or undefined. */
export function parseSteeredAccounts(raw: unknown): readonly string[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_STEERED_ACCOUNTS) {
    return undefined;
  }
  const accounts: string[] = [];
  for (const item of raw) {
    const id = boundedString(item, MAX_ACCOUNT_ID);
    if (!id) return undefined;
    accounts.push(id);
  }
  return accounts;
}

function parseWired(raw: unknown): WiredConviction | undefined {
  if (!isRecord(raw)) return undefined;
  const conviction = parseStoredConviction(raw.conviction);
  const accounts = parseSteeredAccounts(raw.accounts);
  return conviction && accounts ? { conviction, accounts } : undefined;
}

/** Bots side: the members' handed-over views in a poll body, or `undefined` for anything short of a
 *  clean, whole set. Shape only: whether a record keeps the rules is the bots' store's call. */
export function parseConvictionsWire(value: unknown): ConvictionsWire | undefined {
  if (!isRecord(value) || value.kind !== CONVICTIONS_WIRE_KIND) return undefined;
  const { at, records: raw } = value;
  if (typeof at !== "number" || !Number.isFinite(at) || at <= 0) return undefined;
  if (!Array.isArray(raw) || raw.length > MAX_WIRED_CONVICTIONS) return undefined;
  const records: WiredConviction[] = [];
  for (const item of raw) {
    const record = parseWired(item);
    if (!record) return undefined;
    records.push(record);
  }
  return { kind: CONVICTIONS_WIRE_KIND, at, records };
}
