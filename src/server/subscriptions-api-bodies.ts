import { PLAYBOOK_MODES, type PlaybookMode } from "../domain/types.js";
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

export function parseSubscribeBody(raw: string): SubscribeBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
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
      }
    : undefined;
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
