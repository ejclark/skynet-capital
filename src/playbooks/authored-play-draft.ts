/**
 * A SAVED AUTHORED PLAY (#5457 slice 1) — what the authoring form leaves behind, and the one rule
 * that says it does not trade.
 *
 * A record is the model's own `AuthoredPlaySpec` plus the name the member gave it and a STATUS. The
 * only status this slice writes is `draft`. A draft is a play the member has written down and nothing
 * more: no shadow test has run on it (slice 2) and no bot may subscribe to it (slice 3), so it is
 * not on any bot's roster and no order can come from it.
 *
 * THE RULE, MECHANICAL. `runnableSpecs` is the single door from saved records to the specs
 * `authoredRoster` compiles into a bot's playbooks, and it lets through only a status listed in
 * `TRADING_STATUSES` — which is empty. Slices 2 and 3 add their statuses to that list as they ship;
 * until then a record, however well formed, compiles to nothing. Nothing in the bots' wiring reads
 * this store today either (`resolveBotRoster` still takes no specs), so there are two locks on the
 * door, and `tests/playbooks/authored-play-draft.spec.ts` holds both.
 */
import { isRecord } from "../storage/parse-guards.js";
import type { AuthoredPlaySpec, AuthoredTrigger } from "./authored-play.js";

/** Where a saved play stands. One value until a shadow test exists to earn another. */
export type AuthoredPlayStatus = "draft";

/** The statuses whose plays may reach a bot. Empty on purpose: nothing earns it yet (slices 2–3). */
export const TRADING_STATUSES: readonly AuthoredPlayStatus[] = [];

export interface AuthoredPlayRecord {
  /** The compiled play's id (`authoredPlayId`) — unique per author account and stable until renamed. */
  readonly id: string;
  /** What the member called it, as typed (the spec carries only the slug made from it). */
  readonly name: string;
  readonly status: AuthoredPlayStatus;
  readonly spec: AuthoredPlaySpec;
  /** ISO-8601. */
  readonly createdAt: string;
  /** ISO-8601. */
  readonly updatedAt: string;
}

/** The records that may trade — none while no status is in `TRADING_STATUSES`. */
export function runnableSpecs(records: readonly AuthoredPlayRecord[]): AuthoredPlaySpec[] {
  return records.filter((r) => TRADING_STATUSES.includes(r.status)).map((r) => r.spec);
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

function parseSpec(raw: unknown): AuthoredPlaySpec | undefined {
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
  const spec = parseSpec(raw.spec);
  if (
    !(
      spec &&
      isText(raw.id) &&
      isText(raw.name) &&
      raw.status === "draft" &&
      isText(raw.createdAt) &&
      isText(raw.updatedAt)
    )
  ) {
    return undefined;
  }
  return {
    id: raw.id,
    name: raw.name,
    status: "draft",
    spec,
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
