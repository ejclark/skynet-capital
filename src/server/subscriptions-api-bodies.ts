import { PLAYBOOK_MODES, type PlaybookMode, type SubscriptionConviction } from "../domain/types.js";
import { STRATEGIES, type StrategyId } from "../playbooks/pair-table.js";
import { isRecord } from "../storage/parse-guards.js";
import { isCalendarDay } from "../subscriptions/subscription-state.js";
import { boundedString, parseJsonRecord } from "./page-shell.js";
import type { SubscriptionTuning } from "./subscription-store.js";

/**
 * The Playbook Store API's strict shape gates (issue #885): exactly the fields each write needs,
 * everything else dropped, and a malformed body answered 400, never coerced. Moved out of
 * `subscriptions-api-routes.ts` when #4649 added the configure body, so the router reads as its
 * gates and nothing else.
 */

interface SubscribeBody {
  readonly id: string;
  readonly playbookId: string;
  readonly mode: PlaybookMode;
  readonly capitalAllocated: number;
  /** Symbol-targeting filter (#885) — optional, absent/empty means unrestricted. */
  readonly symbols?: readonly string[];
  /** Owner opt-in to compound this subscription's budget with its own realized P/L (issue #3527
   *  slice 3). Absent/false means unchanged, flat-budget behavior. */
  readonly compoundAllocation?: boolean;
  /** The owner's conviction (#4469 slice 3c part 3) — optional; a malformed one is a 400. */
  readonly conviction?: SubscriptionConviction;
}

interface PlaybookRefBody {
  readonly id: string;
  readonly playbookId: string;
}

interface SetEnabledBody extends PlaybookRefBody {
  readonly enabled: boolean;
}

interface ConfigureBody extends PlaybookRefBody {
  readonly tuning: SubscriptionTuning;
}

interface ConvictionBody extends PlaybookRefBody {
  readonly conviction: SubscriptionConviction;
}

interface AllocationBody {
  readonly id: string;
  readonly strategy: StrategyId;
  /** Dollars, above zero; `undefined` clears the allocation (sent as `null`). */
  readonly capitalAllocated: number | undefined;
}

/** A conviction's reason is the owner's own sentence or two, never an essay. */
export const MAX_REASON_LENGTH = 500;

const MAX_SYMBOLS = 20;

/** An array of up to `MAX_SYMBOLS` non-empty tickers, uppercased; anything else (not an array, an
 *  empty array, a non-string entry, an over-long one) drops the whole filter to "unrestricted"
 *  rather than rejecting the request — the safe default (see `subscription-state.ts`'s parser). */
function parseSymbols(raw: unknown): readonly string[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_SYMBOLS) return undefined;
  const symbols = raw
    .map((s) => boundedString(s, 12))
    .filter((s): s is string => Boolean(s))
    .map((s) => s.toUpperCase());
  return symbols.length === raw.length ? symbols : undefined;
}

function parseMode(raw: unknown): PlaybookMode | undefined {
  return typeof raw === "string" && PLAYBOOK_MODES.includes(raw as PlaybookMode)
    ? (raw as PlaybookMode)
    : undefined;
}

const isCapital = (raw: unknown): raw is number =>
  typeof raw === "number" && Number.isFinite(raw) && raw >= 0;

/** `{reason, checkOn}`: a non-blank reason within the cap, trimmed, and a real calendar day.
 *  Whether the day is one a conviction may be checked on is the route's call (`checkOnRefusal`). */
function parseConviction(raw: unknown): SubscriptionConviction | undefined {
  if (!isRecord(raw)) return undefined;
  const { reason, checkOn } = raw;
  const text = typeof reason === "string" ? reason.trim() : "";
  if (!(text.length > 0 && text.length <= MAX_REASON_LENGTH && isCalendarDay(checkOn))) {
    return undefined;
  }
  return { reason: text, checkOn };
}

export function parseSubscribeBody(raw: string): SubscribeBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  // Unlike `symbols`, a conviction that does not parse is refused, never dropped: dropped, it would
  // save a subscription that trades without the dated test its owner meant to set.
  const conviction = body.conviction === undefined ? undefined : parseConviction(body.conviction);
  if (body.conviction !== undefined && !conviction) return undefined;
  const id = boundedString(body.id, 100);
  const playbookId = boundedString(body.playbookId, 60);
  const mode = parseMode(body.mode);
  const capitalAllocated = isCapital(body.capitalAllocated) ? body.capitalAllocated : undefined;
  const symbols = parseSymbols(body.symbols);
  const compoundAllocation = body.compoundAllocation === true;
  return id && playbookId && mode && capitalAllocated !== undefined
    ? {
        id,
        playbookId,
        mode,
        capitalAllocated,
        ...(symbols ? { symbols } : {}),
        ...(compoundAllocation ? { compoundAllocation: true } : {}),
        ...(conviction ? { conviction } : {}),
      }
    : undefined;
}

/** Conviction (#4469 slice 3c part 3): the whole conviction, both fields, or a 400. */
export function parseConvictionBody(raw: string): ConvictionBody | undefined {
  const ref = parsePlaybookRefBody(raw);
  const conviction = parseConviction(parseJsonRecord(raw)?.conviction);
  return ref && conviction ? { ...ref, conviction } : undefined;
}

/** Allocation (#4469 slice 3c part 3): a known strategy, and dollars above zero or `null` to clear.
 *  Leaving the amount out is a 400, so no client clears an allocation by forgetting a field. */
export function parseAllocationBody(raw: string): AllocationBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const id = boundedString(body.id, 100);
  const { strategy, capitalAllocated: capital } = body;
  const known = typeof strategy === "string" && Object.hasOwn(STRATEGIES, strategy);
  const amount = capital === null || (isCapital(capital) && capital > 0);
  if (!(id && known && amount)) return undefined;
  return {
    id,
    strategy: strategy as StrategyId,
    capitalAllocated: capital === null ? undefined : (capital as number),
  };
}

export function parsePlaybookRefBody(raw: string): PlaybookRefBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const id = boundedString(body.id, 100);
  const playbookId = boundedString(body.playbookId, 60);
  return id && playbookId ? { id, playbookId } : undefined;
}

export function parseSetEnabledBody(raw: string): SetEnabledBody | undefined {
  const ref = parsePlaybookRefBody(raw);
  if (!ref) return undefined;
  const body = parseJsonRecord(raw);
  const enabled = typeof body?.enabled === "boolean" ? body.enabled : undefined;
  return enabled === undefined ? undefined : { ...ref, enabled };
}

/**
 * Configure (#4649) is stricter than subscribe in two places, both because an edit that guessed
 * would loosen a live subscription:
 *  - `capitalAllocated` must be present: a number, or `null` for uncapped. Leaving it out is a 400,
 *    so no client can uncap a budget by forgetting a field.
 *  - A malformed `symbols` is a 400. Dropping it to "unrestricted", as subscribe does, would
 *    silently widen what the bot may buy. Absent or `[]` is the whole basket.
 * `compoundAllocation` must be a boolean when present; absent is off.
 */
export function parseConfigureBody(raw: string): ConfigureBody | undefined {
  const ref = parsePlaybookRefBody(raw);
  const body = parseJsonRecord(raw);
  if (!(ref && body)) return undefined;
  const mode = parseMode(body.mode);
  const capital = body.capitalAllocated;
  const capitalOk = capital === null || isCapital(capital);
  const wholeBasket =
    body.symbols === undefined || (Array.isArray(body.symbols) && body.symbols.length === 0);
  const symbols = wholeBasket ? [] : parseSymbols(body.symbols);
  const compound = body.compoundAllocation;
  if (!(mode && capitalOk && symbols && (compound === undefined || typeof compound === "boolean")))
    return undefined;
  return {
    ...ref,
    tuning: {
      mode,
      ...(isCapital(capital) ? { capitalAllocated: capital } : {}),
      ...(symbols.length > 0 ? { symbols } : {}),
      ...(compound === true ? { compoundAllocation: true } : {}),
    },
  };
}
