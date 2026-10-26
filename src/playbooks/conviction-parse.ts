import { boundedString, isRecord } from "../storage/parse-guards.js";
import {
  CLAIM_BUCKETS,
  CLAIM_TAGS,
  type ClaimBucket,
  type ClaimTag,
  type Conviction,
  type ConvictionClaim,
} from "./conviction-record.js";
import type { Narrowing, PairNarrowings } from "./conviction-steering.js";

/**
 * A CONVICTION, READ FROM JSON (#5482 slice 6a) — the total, shape-only parse a member's draft and
 * the file that keeps it both pass through. Shape only: whether the record keeps the rules (a claim
 * per view, dated falsifiers, ◆ pairs, narrow never widen) is `convictionProblems`' call, so the
 * same words judge a seeded record, a member's draft and what a chat drafts for them.
 *
 * Bounded on purpose: a claim is a sentence and a view is a handful of them. A body over any bound
 * is unreadable, never truncated — a view cut short would steer on half its reasons. What the system
 * attaches to a claim (a study's verdict, a falsifier check, a score) is never read from a member's
 * JSON; those come from the research pass's own ledgers.
 */

export const MAX_CLAIMS = 12;
export const MAX_STEERS = 6;
const MAX_NARROWINGS = 5;
/** The longest a claim's statement, evidence or falsifier may be, as a member types it. */
export const MAX_TEXT = 600;
export const MAX_TITLE = 80;
/** Room for the number a record puts before each claim ("12. "): a stored statement may be this much
 *  longer than a member may type, so a draft at the limit still reads back whole. */
const CLAIM_LABEL_ROOM = 4;
const MAX_LABEL = 8;
/** Longest conviction id — the route and the stored-record parser share it. */
export const MAX_CONVICTION_ID = 64;
/** Longest pair id, for `pair` and each steer. */
const MAX_PAIR_ID = 64;

const isNumberValue = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const text = (v: unknown, max = MAX_TEXT): string | undefined => boundedString(v, max);
const day = (v: unknown): string | undefined => text(v, 10);

/** A list of at most `max` items each `parse` reads, or undefined when any one is not. */
function listOf<T>(raw: unknown, max: number, parse: (item: unknown) => T | undefined) {
  if (!Array.isArray(raw) || raw.length > max) return undefined;
  const out: T[] = [];
  for (const item of raw) {
    const parsed = parse(item);
    if (parsed === undefined) return undefined;
    out.push(parsed);
  }
  return out;
}

/** One claim as a member states it: tag, sentence, bucket, evidence, falsifier, and its score day.
 *  `statementMax` is wider for a stored claim, which carries its number. */
export function parseClaim(raw: unknown, statementMax = MAX_TEXT): ConvictionClaim | undefined {
  if (!isRecord(raw)) return undefined;
  const statement = text(raw.statement, statementMax);
  const evidence = text(raw.evidence);
  const falsifier = text(raw.falsifier);
  const tag = CLAIM_TAGS.find((t) => t === raw.tag);
  const bucket = CLAIM_BUCKETS.find((b) => b === raw.bucket);
  if (!(statement && evidence && falsifier && tag && bucket)) return undefined;
  const scoreBy = raw.scoreBy === undefined ? undefined : day(raw.scoreBy);
  if (raw.scoreBy !== undefined && scoreBy === undefined) return undefined;
  return {
    tag: tag as ClaimTag,
    statement,
    bucket: bucket as ClaimBucket,
    evidence,
    falsifier,
    ...(scoreBy ? { scoreBy } : {}),
  };
}

/** A days-to-expiry window, either end optional; a present end must be a number. */
function parseDte(raw: Record<string, unknown>): Narrowing | undefined {
  const { min, max } = raw;
  if ((min !== undefined && !isNumberValue(min)) || (max !== undefined && !isNumberValue(max))) {
    return undefined;
  }
  return {
    kind: "dte",
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
  };
}

function parseNarrowing(raw: unknown): Narrowing | undefined {
  if (!isRecord(raw)) return undefined;
  switch (raw.kind) {
    case "dte":
      return parseDte(raw);
    case "expiry-from": {
      const on = day(raw.day);
      return on ? { kind: "expiry-from", day: on } : undefined;
    }
    case "strike-ceiling": {
      if (isNumberValue(raw.ceiling)) return { kind: "strike-ceiling", ceiling: raw.ceiling };
      const label = isRecord(raw.ceiling) ? text(raw.ceiling.floorOfClaim, MAX_LABEL) : undefined;
      return label ? { kind: "strike-ceiling", ceiling: { floorOfClaim: label } } : undefined;
    }
    case "quiet":
      return isNumberValue(raw.sessionsAfterPrint)
        ? { kind: "quiet", sessionsAfterPrint: raw.sessionsAfterPrint }
        : undefined;
    case "contracts":
      return isNumberValue(raw.max) ? { kind: "contracts", max: raw.max } : undefined;
    default:
      return undefined;
  }
}

/** One steered pair's narrowings: the pair, the claim labels they rest on, and what they fence. */
export function parsePairNarrowings(raw: unknown): PairNarrowings | undefined {
  if (!isRecord(raw)) return undefined;
  const pair = text(raw.pair, MAX_PAIR_ID);
  const fromClaims = listOf(raw.fromClaims ?? [], MAX_CLAIMS, (l) => text(l, MAX_LABEL));
  const narrow = listOf(raw.narrow, MAX_NARROWINGS, parseNarrowing);
  return pair && fromClaims && narrow ? { pair, fromClaims, narrow } : undefined;
}

/** What a member writes: everything a record holds except who, when and the id, which the server
 *  sets from the session and the clock. */
export interface ConvictionDraftInput {
  readonly title: string;
  readonly checkOn: string;
  readonly claims: readonly ConvictionClaim[];
  readonly steers: readonly string[];
  readonly narrowings?: readonly PairNarrowings[];
  readonly acceptsAssignment?: boolean;
}

export function parseConvictionDraft(
  raw: unknown,
  statementMax = MAX_TEXT,
): ConvictionDraftInput | undefined {
  if (!isRecord(raw)) return undefined;
  const title = text(raw.title, MAX_TITLE);
  const checkOn = day(raw.checkOn);
  const claims = listOf(raw.claims, MAX_CLAIMS, (c) => parseClaim(c, statementMax));
  const steers = listOf(raw.steers, MAX_STEERS, (s) => text(s, MAX_PAIR_ID));
  const narrowings =
    raw.narrowings === undefined
      ? undefined
      : listOf(raw.narrowings, MAX_STEERS, parsePairNarrowings);
  if (!(title && checkOn && claims && steers)) return undefined;
  if (raw.narrowings !== undefined && narrowings === undefined) return undefined;
  if (raw.acceptsAssignment !== undefined && typeof raw.acceptsAssignment !== "boolean") {
    return undefined;
  }
  return {
    title,
    checkOn,
    claims,
    steers,
    ...(narrowings && narrowings.length > 0 ? { narrowings } : {}),
    ...(raw.acceptsAssignment === true ? { acceptsAssignment: true } : {}),
  };
}

/**
 * A whole record as the member store keeps it: the draft plus id, owner, the day it was stated, and
 * its scope — which only the server sets, so it is read here and never from a draft. A scope this
 * build does not know makes the record unreadable: read as an ordinary view, it would be judged by
 * rules its writer did not mean, and a pointer at it runs its pair exits-only until the bots learn it.
 */
export function parseStoredConviction(raw: unknown): Conviction | undefined {
  if (!isRecord(raw)) return undefined;
  const draft = parseConvictionDraft(raw, MAX_TEXT + CLAIM_LABEL_ROOM);
  const id = text(raw.id, MAX_CONVICTION_ID);
  const owner = text(raw.owner, 80);
  const statedOn = day(raw.statedOn);
  if (!(draft && id && owner && statedOn)) return undefined;
  if (raw.scope !== undefined && raw.scope !== "pair") return undefined;
  return { id, owner, statedOn, ...draft, ...(raw.scope === "pair" ? { scope: "pair" } : {}) };
}
