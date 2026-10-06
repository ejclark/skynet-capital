import { boundedString, isRecord } from "../storage/parse-guards.js";
import {
  LIFECYCLE_TYPES,
  type NormalizedLifecycleActivity,
  type OptionLifecycleType,
} from "../trading/option-lifecycle.js";
import type { SequencedLifecycle } from "./decision-option-ledger.js";
import { MAX_PERSONA_ID_LENGTH } from "./decision-wire-parts.js";

/**
 * The broker's option expiry and assignment reports crossing the bots→app bridge (#4650) — an
 * additive `lifecycle` field on the decision batch envelope (`decision-wire.ts`), the shape
 * `settlements` set (`decision-wire-settlements.ts`). No order ever fills for an expiry or an
 * assignment, so without these the dashboard's copy holds a sold put open forever: no round trip,
 * and its closed count and expectancy short by every one.
 *
 * Grouped by persona, because a report belongs to one bot's account and the store keys it by
 * `(persona, activity id)`; so a group may ride any persona's envelope, as a settlement may. A
 * dashboard that predates the field reads only `kind`, `personaId` and `records`: it ignores the
 * field and keeps a batch's records, and refuses a batch carrying reports alone (no records), which
 * is the only way the bots send them. Pure and total in the house style: a malformed report is
 * dropped alone, a malformed group with it, never the batch.
 */

/** Bounded per batch, across every group — the bots send pages of exactly this many. */
export const MAX_LIFECYCLE_PER_BATCH = 100;
/** An Alpaca activity id is a timestamp and a uuid; generous headroom over that. */
const MAX_ACTIVITY_ID_LENGTH = 128;
/** An OCC contract symbol, or (an `OPTRD`) the ticker it settled in. */
const MAX_REPORT_SYMBOL_LENGTH = 32;
const MAX_STAMP_LENGTH = 64;

/** One persona's reports, as the wire carries them and `DecisionDb.recordOptionLifecycle` takes
 *  them. */
export interface LifecycleReports {
  readonly personaId: string;
  readonly activities: readonly NormalizedLifecycleActivity[];
}

/** A page of the bots' stored reports, grouped by persona in the order each first appears. The
 *  store keeps no price or side (nothing scores them), so the wire carries neither. */
export function reportsByPersona(page: readonly SequencedLifecycle[]): LifecycleReports[] {
  const groups = new Map<string, NormalizedLifecycleActivity[]>();
  for (const { personaId, activity } of page) {
    groups.set(personaId, [...(groups.get(personaId) ?? []), activity]);
  }
  return [...groups].map(([personaId, activities]) => ({ personaId, activities }));
}

/** One report, or undefined when any field it is stored or scored by is missing or malformed. */
export function parseLifecycleReport(value: unknown): NormalizedLifecycleActivity | undefined {
  if (!isRecord(value)) return undefined;
  const id = boundedString(value.id, MAX_ACTIVITY_ID_LENGTH);
  const type =
    typeof value.type === "string" && LIFECYCLE_TYPES.has(value.type)
      ? (value.type as OptionLifecycleType)
      : undefined;
  const symbol = boundedString(value.symbol, MAX_REPORT_SYMBOL_LENGTH);
  const at = boundedString(value.at, MAX_STAMP_LENGTH);
  const { quantity } = value;
  if (!(id && type && symbol && at && Number.isFinite(Date.parse(at)))) return undefined;
  if (!(typeof quantity === "number" && Number.isFinite(quantity) && quantity > 0)) {
    return undefined;
  }
  return { id, type, symbol, quantity, at };
}

/** The envelope's `lifecycle`, each report parsed alone — absent or not a list reads as none. At
 *  most `MAX_LIFECYCLE_PER_BATCH` reports are read, however they are grouped. */
export function parseLifecycle(value: unknown): readonly LifecycleReports[] {
  if (!Array.isArray(value)) return [];
  let budget = MAX_LIFECYCLE_PER_BATCH;
  const out: LifecycleReports[] = [];
  for (const group of value.slice(0, MAX_LIFECYCLE_PER_BATCH)) {
    if (budget === 0) break;
    if (!(isRecord(group) && Array.isArray(group.activities))) continue;
    const taken = group.activities.slice(0, budget);
    budget -= taken.length;
    const personaId = boundedString(group.personaId, MAX_PERSONA_ID_LENGTH);
    const activities = taken
      .map(parseLifecycleReport)
      .filter((a): a is NormalizedLifecycleActivity => a !== undefined);
    if (personaId && activities.length > 0) out.push({ personaId, activities });
  }
  return out;
}
