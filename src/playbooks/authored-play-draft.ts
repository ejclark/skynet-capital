/**
 * A SAVED AUTHORED PLAY (#5457 slice 1) — what the authoring form leaves behind, and the one rule
 * that says it does not trade.
 *
 * A record is the model's own `AuthoredPlaySpec` plus the name the member gave it and a STATUS. Two
 * statuses exist and neither trades. A `draft` is a play the member has written down and nothing
 * more. A `shadow` play is a draft the member has put in its shadow test (slice 2): the bots work
 * out, each pass, what it would have bought and sold and write that on a ledger
 * (`authored-shadow.ts`) — no order is sent for the account. Promotion (slice 3) is the first
 * status that may trade, and it does not exist yet.
 *
 * THE RULE, MECHANICAL. `runnableSpecs` is the single door from saved records to the specs
 * `authoredRoster` compiles into a bot's playbooks, and it lets through only a status listed in
 * `TRADING_STATUSES` — which is empty, and `shadow` is NOT in it. Shadowing has its own, separate
 * door (`shadowOrders`) that hands a spec to the shadow runner and nowhere else. Nothing in the
 * bots' roster wiring reads this store (`resolveBotRoster` still takes no specs), so there are two
 * locks on the trading door, and `tests/playbooks/authored-play-draft.spec.ts` holds both.
 */
import { isRecord } from "../storage/parse-guards.js";
import type { AuthoredPlaySpec, AuthoredTrigger } from "./authored-play.js";

/** Where a saved play stands. `shadow` is a test, not a rung toward trading by itself (slice 3). */
export type AuthoredPlayStatus = "draft" | "shadow";

/** The statuses whose plays may reach a bot. Empty on purpose: promotion (slice 3) adds the first. */
export const TRADING_STATUSES: readonly AuthoredPlayStatus[] = [];

export interface AuthoredPlayRecord {
  /** The compiled play's id (`authoredPlayId`) — unique per author account and stable until renamed. */
  readonly id: string;
  /** What the member called it, as typed (the spec carries only the slug made from it). */
  readonly name: string;
  readonly status: AuthoredPlayStatus;
  readonly spec: AuthoredPlaySpec;
  /** ISO-8601, present while `status` is `shadow`: when the test began. A new value is a new test —
   *  the runner starts its ledger over when it changes. */
  readonly shadowSince?: string;
  /** ISO-8601. */
  readonly createdAt: string;
  /** ISO-8601. */
  readonly updatedAt: string;
}

/** The records that may trade — none while no status is in `TRADING_STATUSES`. */
export function runnableSpecs(records: readonly AuthoredPlayRecord[]): AuthoredPlaySpec[] {
  return records.filter((r) => TRADING_STATUSES.includes(r.status)).map((r) => r.spec);
}

/**
 * Whether the bots' decision pass is handed outside events (news about a stock). It is not today:
 * the live roster composes its playbooks with an empty event list (`tradingRoster`), so an
 * event-window play — shadowed or, once promoted, running — has nothing to open on. The shadow test
 * is exactly as quiet as the play would be, and a member is told so; flip this where events are wired.
 */
export const EVENT_FEED_REACHES_BOTS = false;

/** One play the bots are asked to shadow: the spec, and the moment this test began. */
export interface ShadowOrder {
  readonly id: string;
  readonly since: string;
  readonly spec: AuthoredPlaySpec;
}

/**
 * The records in a shadow test, as the orders the bots receive — the ONLY other door from a saved
 * record to a bot, and it leads to the shadow runner, never to a roster: nothing it returns reaches
 * `authoredRoster`, a subscription or an order.
 */
export function shadowOrders(state: AuthoredPlaysState): ShadowOrder[] {
  return Object.values(state)
    .flat()
    .flatMap((r) =>
      r.status === "shadow"
        ? [{ id: r.id, since: r.shadowSince ?? r.updatedAt, spec: r.spec }]
        : [],
    );
}

/** Member key → that member's saved plays, oldest first. */
export type AuthoredPlaysState = Readonly<Record<string, readonly AuthoredPlayRecord[]>>;

export const EMPTY_AUTHORED_PLAYS: AuthoredPlaysState = {};

const isText = (v: unknown, max = 400): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function parseTrigger(raw: unknown): AuthoredTrigger | undefined {
  if (!isRecord(raw)) return undefined;
  if (raw.kind === "event-window" && isNum(raw.holdMinutes)) {
    return { kind: "event-window", holdMinutes: raw.holdMinutes };
  }
  if (raw.kind === "pre-print-window" && isNum(raw.enterDaysBefore) && isNum(raw.exitDaysBefore)) {
    return {
      kind: "pre-print-window",
      enterDaysBefore: raw.enterDaysBefore,
      exitDaysBefore: raw.exitDaysBefore,
    };
  }
  return undefined;
}

export function parseAuthoredPlaySpec(raw: unknown): AuthoredPlaySpec | undefined {
  if (!isRecord(raw)) return undefined;
  const trigger = parseTrigger(raw.trigger);
  const size = raw.size;
  if (
    !(
      isText(raw.slug) &&
      isText(raw.authorAccountId) &&
      isText(raw.authorDisplayName) &&
      isText(raw.thesis, 1_000) &&
      trigger &&
      Array.isArray(raw.symbols) &&
      raw.symbols.length === 1 &&
      isText(raw.symbols[0], 20) &&
      isRecord(size) &&
      isNum(size.conservative) &&
      isNum(size.standard) &&
      isNum(size.aggressive)
    )
  ) {
    return undefined;
  }
  return {
    slug: raw.slug,
    authorAccountId: raw.authorAccountId,
    authorDisplayName: raw.authorDisplayName,
    symbols: [raw.symbols[0]],
    thesis: raw.thesis,
    trigger,
    size: {
      conservative: size.conservative,
      standard: size.standard,
      aggressive: size.aggressive,
    },
  };
}

function parseRecord(raw: unknown): AuthoredPlayRecord | undefined {
  if (!isRecord(raw)) return undefined;
  const spec = parseAuthoredPlaySpec(raw.spec);
  if (
    !(
      spec &&
      isText(raw.id) &&
      isText(raw.name) &&
      (raw.status === "draft" || raw.status === "shadow") &&
      isText(raw.createdAt) &&
      isText(raw.updatedAt)
    )
  ) {
    return undefined;
  }
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    spec,
    ...(raw.status === "shadow" && isText(raw.shadowSince) ? { shadowSince: raw.shadowSince } : {}),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/**
 * Total, defensive parse — a torn file or an old schema can only produce `undefined` (the caller
 * falls back to empty), never a throw. A record this build cannot read is dropped, not fatal to the
 * file, and `JsonFileStore.loadIfReadable` notices the loss for a writer that must not lose it.
 * A status this build does not know is unreadable on purpose: reading it as a draft would quietly
 * downgrade a play a newer build had moved on.
 */
export function parseAuthoredPlaysState(raw: unknown): AuthoredPlaysState | undefined {
  if (!isRecord(raw)) return undefined;
  const state: Record<string, readonly AuthoredPlayRecord[]> = {};
  for (const [member, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    const records = list.flatMap((item) => {
      const record = parseRecord(item);
      return record ? [record] : [];
    });
    if (records.length > 0) state[member] = records;
  }
  return state;
}
