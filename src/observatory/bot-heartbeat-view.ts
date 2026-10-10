import type { DecisionRecord } from "../autonomous/decision-record.js";
import { unmanagedTickers } from "../domain/bots-universe.js";
import { type EarningsPrint, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { lastClosedSessionOpen } from "../domain/market-session.js";
import type {
  PlaybookMode,
  PlaybookSubscription,
  PlaybookVerdict,
  PlaybookVerdictState,
} from "../domain/types.js";
import { findPair, type Pair } from "../playbooks/pair-table.js";
import type { Playbook } from "../playbooks/playbook.js";
import { PLAYBOOK_WIRING_GAPS, registeredPlaybooks } from "../playbooks/registry.js";
import { notTradingNote, subscribedPairs } from "../subscriptions/subscribe-eligibility.js";
import { pausedPlaybookIds } from "../subscriptions/subscription-roster.js";
import { isOccSymbol } from "../trading/option-symbols.js";
import { readPlaybookWindow } from "./playbook-window.js";

/**
 * BOT HEARTBEAT (#3687 slice 2) — is this bot's decision loop alive, and what is each of its
 * playbooks currently concluding? "Pulse" already names the account's performance view
 * (`pulse-json-view.ts`); this is liveness, so it takes Eric's own word for it.
 *
 * Silence has three causes that must never read alike: the market is closed, the loop is down, or
 * the loop is running and nothing fired. Only the second is a problem, so the state is judged
 * against the market session first and the pass cadence second.
 */

/** Mirrors `run-autonomous.ts`'s `LIVE_EVAL_INTERVAL_MS`: at most one pass per 15s. */
export const PASS_CADENCE_MS = 15_000;

/** Passes reach the dashboard through the bots process's 30s `/controls` poll, so a healthy bot's
 *  newest visible pass is routinely ~45s old. Two minutes is several missed passes AND a missed
 *  poll, never ordinary lag. */
export const STALE_AFTER_MS = 2 * 60_000;

export type HeartbeatState = "beating" | "stale" | "market-closed" | "no-record";

export interface PlaybookHeartbeat {
  readonly playbookId: string;
  readonly mode: PlaybookMode;
  readonly state: PlaybookVerdictState;
  /** When this verdict began, as far back as the passes on hand reach. */
  readonly since: string;
  /** True when the run reaches the oldest pass on hand — the real start may be earlier. */
  readonly sinceIsLowerBound: boolean;
}

export interface HeartbeatView {
  readonly state: HeartbeatState;
  readonly marketOpen: boolean;
  readonly lastPassAt: string | null;
  readonly sinceLastPassMs: number | null;
  readonly cadenceMs: number;
  readonly staleAfterMs: number;
  /** The breaker or kill switch holding the loop, when the newest pass was halted. */
  readonly halted?: string;
  /** Null when the newest verdict-carrying pass is absent (records predate capture, or no
   *  playbooks run on this account) — an absence, never an empty list posing as "none active". */
  readonly playbooks: readonly PlaybookHeartbeat[] | null;
  /** Every house playbook plus any the bot ran or holds a subscription to (#4450 slice 1, #4650). */
  readonly rollCall: readonly RollCallLine[];
  /** Share tickers this bot holds that nothing on it will sell (#4777, `unmanagedHoldings`).
   *  Absent when there was nothing to judge from — never an empty list posing as "all managed". */
  readonly unmanaged?: readonly string[];
}

/** What the dashboard knows of a bot's book and roster beyond its passes: the lots its broker read
 *  shows, and every playbook id the bot holds a Store subscription to, enabled or paused. */
export interface BotHoldings {
  readonly positions: readonly { readonly symbol: string; readonly quantity: number }[];
  readonly subscribedIds: readonly string[];
}

/**
 * THE UNMANAGED LOTS (#4777) — a lot priced by the stream but sold by nothing. The bots process
 * streams every ticker a bot holds, so an orphan keeps a live price; but a base persona sees only
 * the ten names, so a GOOG lot left behind when G1-GOOG is unsubscribed would otherwise sit on the
 * book with no line anywhere saying no rule will ever exit it. The roll call says it out loud.
 *
 * A playbook counts as managing its basket if the bot's newest verdict pass ran it (the env house
 * roster included) OR the bot holds a subscription to it at all: a PAUSED playbook records no
 * verdict, yet its exits still run (#4651), so verdicts alone would call a paused G1's lot orphaned.
 * So does one the bots app's own playbook setting names with no subscription (`exitsOnly`, #4650):
 * it opens nothing on the bot, and its exit rules still sell what it holds.
 * Null — no claim — when any of those ids is not a house playbook: a Store play authored on its
 * owner's account has a basket this process cannot read, and guessing would be the false alarm.
 */
export function unmanagedHoldings(
  holdings: BotHoldings,
  verdicts: readonly PlaybookVerdict[] | null,
  house: readonly Playbook[] = registeredPlaybooks(),
  exitsOnly: readonly string[] = [],
): string[] | null {
  const byId = new Map(house.map((playbook) => [playbook.id, playbook]));
  const ids = new Set([
    ...(verdicts ?? []).map((v) => v.playbookId),
    ...holdings.subscribedIds,
    ...exitsOnly,
  ]);
  const managed = new Set<string>();
  for (const id of ids) {
    const playbook = byId.get(id);
    if (!playbook) return null;
    for (const symbol of playbook.symbols) managed.add(symbol);
  }
  const held = holdings.positions
    .filter((p) => p.quantity !== 0 && !isOccSymbol(p.symbol))
    .map((p) => p.symbol);
  return unmanagedTickers(held, managed);
}

/**
 * THE ROLL CALL (#4450 slice 1) — "is every playbook online?" answered per bot. The verdict table
 * lists only what the bot ran, so a playbook nobody switched on was simply absent, and absence
 * reads like a quiet market. This lists the whole house roster against the bot's own newest
 * verdict pass, so "off" is said out loud.
 *
 * - `armed` — the bot's newest verdict pass ran it.
 * - `paused` — the bot holds a subscription to it, switched off (#4650). It opens nothing new and
 *   still runs its exits, so it records no verdict (`withPlaybooks`) — read from passes alone it
 *   said "off", like one nobody subscribed to, while the Store said "Paused". The subscription
 *   wins over a verdict: a pass recorded just before the pause still carries one.
 * - `starting` — subscribed and on, but no pass on hand ran it yet: the bots pick a subscription
 *   up on their next `/controls` poll and run it from the pass after.
 * - `off` — registered, but no pass on hand ran it: nobody switched it on for this bot. Said
 *   differently when the bots app's own playbook setting names it and the bot holds no
 *   subscription (exits only, `resolveBotRoster`), and when the bot is subscribed to an id no
 *   playbook answers to (the bots refuse it, `subscriptionRoster`).
 * - `blocked` — registered, but the live wiring cannot make it fire (`PLAYBOOK_WIRING_GAPS`).
 *   Blocked wins over everything: a playbook that runs but can never trade is not online.
 *
 * AN ARMED LINE SAYS WHAT IT IS WAITING FOR, not just that it is on (criterion 1's second half:
 * "an armed one carries its next possible entry date where it has one"). One shared sentence for
 * every armed playbook would have read as reassurance on the very day the calendar held no
 * confirmed NVDA print — see `playbook-window.ts`, which owns that read and its honesty rules.
 */
export type RollCallStatus = "armed" | "paused" | "starting" | "off" | "blocked";

/** What the dashboard knows of a bot's roster beyond its passes (#4650). */
export interface RollCallRoster {
  /** Every Store subscription the bot holds, on or paused. */
  readonly subscriptions: readonly Pick<PlaybookSubscription, "playbookId" | "enabled">[];
  /** The playbook ids the bots app's own playbook setting (`SKYNET_PLAYBOOKS`) runs on this bot,
   *  as its latest `/controls` poll reported them (`house-roster-wire.ts`). Absent when it reported
   *  none. One the bot holds no subscription to opens nothing and still runs its exits. */
  readonly envNamed?: readonly string[];
}

/** The env-named playbooks this bot holds no subscription to: exits only (`resolveBotRoster`). */
function exitsOnlyIds(roster: RollCallRoster | undefined): string[] {
  const held = new Set(roster?.subscriptions.map((s) => s.playbookId));
  return (roster?.envNamed ?? []).filter((id) => !held.has(id));
}

export interface RollCallLine {
  readonly playbookId: string;
  readonly status: RollCallStatus;
  /** The mode it runs in; present only when armed or blocked-while-running. */
  readonly mode?: PlaybookMode;
  readonly reason: string;
  /** `YYYY-MM-DD` the playbook's own rule would next open a position. Absent for a playbook with
   *  no datable window, one already inside its window, and anything not armed. */
  readonly nextEntry?: string;
}

const OFF_REASON = "Not switched on for this bot — no recorded pass ran it.";
/** The fallback for an armed playbook whose definition is not on hand: a Store playbook, authored
 *  on its owner's account, whose rule this process cannot read to say more than this. */
const ARMED_REASON = "Checked on every pass; it trades when its own condition holds.";
/** What Pause does — the Store's own note under a paused subscription (`PAUSED_NOTE`,
 *  `playbook-subscription-row.tsx`), cut to what a roll-call line has room for. */
const PAUSED_REASON =
  "Paused: it opens nothing new and keeps managing what it holds — it sells on its own exit " +
  "rules and closes any option before it expires, except a covered call, kept so the shares can " +
  "be called away (a wheel still sells covered calls on shares it was assigned).";
/** Subscribed and on, no pass yet: the poll (30s) picks it up, a pass (15s) runs it, and the
 *  pass reaches this dashboard on a later poll — about two minutes, and only while passes run. */
const STARTING_REASON =
  "Subscribed and on, but no recorded pass has run it yet. It starts on the bot's next pass — " +
  "usually within two minutes of the change while the market is open, otherwise at the open.";
/** The bots app's boot line for the same case, said to the owner (`resolveBotRoster`). */
const EXITS_ONLY_REASON =
  "Not subscribed, but the bots app's own playbook setting names it, so on this bot it opens " +
  "nothing and its exit rules still sell what it holds. Subscribe this bot to it to let it open " +
  "positions.";
/** No playbook answers to the id, so the bots refuse the subscription (`subscriptionRoster`) and a
 *  paused one runs no exits either (`pausedRoster`). An authored play resolves only once its spec
 *  reaches the bots (`resolveBotRoster`'s `authored`), and nothing persists one yet (#809). */
const UNKNOWN_REASON =
  "Subscribed, but the bots find no playbook by this id, so nothing on this bot runs it.";

/** Why a pair the bot is subscribed to records no pass: the bots drop the later of two option pairs
 *  on one ticker (`claimOptionUnderlyings`), so "starting" would be a promise nothing keeps. */
const NOT_TRADING_WHY =
  "A bot runs one option playbook per ticker; this one is skipped until the other is paused or removed.";

/** A line no pass on hand ran and no pause explains: why, most specific cause first. */
function idleLine(
  playbookId: string,
  playbook: Playbook | undefined,
  held: { readonly subscribed: boolean; readonly exitsOnly: boolean },
): RollCallLine {
  if (held.subscribed && !playbook) return { playbookId, status: "off", reason: UNKNOWN_REASON };
  // A playbook with its own off-reason (the forced daily pick: one bot, one setting) keeps it —
  // a subscription alone never makes it run, so "starts next pass" would be a promise.
  if (held.subscribed && !playbook?.whenOff) {
    return { playbookId, status: "starting", reason: STARTING_REASON };
  }
  if (held.exitsOnly) return { playbookId, status: "off", reason: EXITS_ONLY_REASON };
  return { playbookId, status: "off", reason: playbook?.whenOff ?? OFF_REASON };
}

export function playbookRollCall(
  verdicts: readonly PlaybookVerdict[] | null,
  now: Date = new Date(),
  house: readonly Playbook[] = registeredPlaybooks(),
  gaps: Readonly<Record<string, string>> = PLAYBOOK_WIRING_GAPS,
  calendar: readonly EarningsPrint[] = UPCOMING_PRINTS,
  /** The bot's subscriptions and env-named playbooks. Absent — the store unwired or unreadable —
   *  and every line is judged from the passes alone, exactly as before #4650. */
  roster?: RollCallRoster,
  /** Test seam: the pair rows the bot's ids resolve through (`findPair`). */
  lookup: (id: string) => Pair | undefined = findPair,
): RollCallLine[] {
  const ran = verdicts ?? [];
  const byId = new Map(house.map((playbook) => [playbook.id, playbook]));
  const subscribed = roster?.subscriptions.map((s) => s.playbookId) ?? [];
  const paused = pausedPlaybookIds(roster?.subscriptions ?? []);
  const exitsOnly = new Set(exitsOnlyIds(roster));
  const onBot = subscribedPairs(roster?.subscriptions ?? [], lookup, roster?.envNamed);
  // House roster first in its own order, then anything else the bot ran (a Store play), then any
  // other id it holds a subscription to — a paused one runs no pass, so it would otherwise vanish.
  const ids = [...byId.keys(), ...ran.map((v) => v.playbookId), ...subscribed];
  return [...new Set(ids)].map((playbookId): RollCallLine => {
    const verdict = ran.find((v) => v.playbookId === playbookId);
    const mode = verdict ? { mode: verdict.mode } : {};
    const gap = gaps[playbookId];
    if (gap) return { playbookId, status: "blocked", ...mode, reason: gap };
    const playbook = byId.get(playbookId);
    if (paused.has(playbookId) && playbook) {
      return { playbookId, status: "paused", reason: PAUSED_REASON };
    }
    if (!verdict) {
      const pair = lookup(playbookId);
      const owned = pair ? notTradingNote(pair, onBot) : undefined;
      if (owned) {
        const sentence = owned.charAt(0).toUpperCase() + owned.slice(1);
        return { playbookId, status: "off", reason: `${sentence}. ${NOT_TRADING_WHY}` };
      }
      return idleLine(playbookId, playbook, {
        subscribed: subscribed.includes(playbookId),
        exitsOnly: exitsOnly.has(playbookId),
      });
    }
    if (!playbook) {
      return { playbookId, status: "armed", ...mode, reason: ARMED_REASON };
    }
    const read = readPlaybookWindow(playbook, verdict.state, now, calendar);
    return {
      playbookId,
      status: "armed",
      ...mode,
      reason: read.reason,
      ...(read.nextEntry ? { nextEntry: read.nextEntry } : {}),
    };
  });
}

/**
 * The newest pass that carried playbook verdicts, with its index — the BOT'S OWN account of which
 * plays it ran. The dashboard process cannot read the `bots` process's roster (`SKYNET_PLAYBOOKS`
 * merged with that account's subscriptions), so this is the one honest source, and it is shared
 * with the Thesis Drawer's safeguard ladder (#3194 slice 6a) so two surfaces can never name a
 * different set of plays for the same bot.
 */
export function latestVerdictPass(newestFirst: readonly DecisionRecord[]): {
  readonly index: number;
  readonly verdicts: readonly PlaybookVerdict[];
  /** Epoch ms of that pass. A caller showing the roster must date it: nothing bounds how old the
   *  newest verdict-carrying pass is, and a safety readout with no date reads as current. */
  readonly at: number;
} | null {
  const index = newestFirst.findIndex((r) => r.playbookVerdicts && r.playbookVerdicts.length > 0);
  const pass = newestFirst[index];
  return pass?.playbookVerdicts ? { index, verdicts: pass.playbookVerdicts, at: pass.at } : null;
}

function playbookLines(newestFirst: readonly DecisionRecord[]): PlaybookHeartbeat[] | null {
  const pass = latestVerdictPass(newestFirst);
  if (!pass) return null;
  const start = pass.index;
  return pass.verdicts.map((verdict) => {
    let oldest = start;
    for (let i = start + 1; i < newestFirst.length; i++) {
      const match = newestFirst[i]?.playbookVerdicts?.find(
        (v) => v.playbookId === verdict.playbookId && v.mode === verdict.mode,
      );
      if (match?.state !== verdict.state) break;
      oldest = i;
    }
    return {
      ...verdict,
      since: new Date(newestFirst[oldest]?.at ?? 0).toISOString(),
      sinceIsLowerBound: oldest === newestFirst.length - 1,
    };
  });
}

/** `records` newest first, as `DecisionDb.listByPersona` returns them. `holdings` absent — the
 *  dashboard could not read the bot's book or its subscriptions — leaves `unmanaged` off; `roster`
 *  absent judges the roll call from the passes alone. */
export function botHeartbeatView(
  records: readonly DecisionRecord[],
  now: Date,
  marketOpen: boolean,
  holdings?: BotHoldings,
  roster?: RollCallRoster,
): HeartbeatView {
  const verdicts = latestVerdictPass(records)?.verdicts ?? null;
  const house = registeredPlaybooks();
  const orphans = holdings
    ? unmanagedHoldings(holdings, verdicts, house, exitsOnlyIds(roster))
    : null;
  const base = {
    marketOpen,
    cadenceMs: PASS_CADENCE_MS,
    staleAfterMs: STALE_AFTER_MS,
    rollCall: playbookRollCall(verdicts, now, house, PLAYBOOK_WIRING_GAPS, UPCOMING_PRINTS, roster),
    ...(orphans ? { unmanaged: orphans } : {}),
  };
  const newest = records[0];
  if (!newest) {
    return {
      ...base,
      state: "no-record",
      lastPassAt: null,
      sinceLastPassMs: null,
      playbooks: null,
    };
  }
  const sinceLastPassMs = Math.max(0, now.getTime() - newest.at);
  // A closed market explains silence only back to the last session (#4949): a bot with no pass in
  // all of it stopped, and "market closed · idle" would let that read as fine until the next open.
  const state: HeartbeatState = !marketOpen
    ? newest.at < lastClosedSessionOpen(now).getTime()
      ? "stale"
      : "market-closed"
    : sinceLastPassMs > STALE_AFTER_MS
      ? "stale"
      : "beating";
  return {
    ...base,
    state,
    lastPassAt: new Date(newest.at).toISOString(),
    sinceLastPassMs,
    ...(newest.halted ? { halted: newest.halted } : {}),
    playbooks: playbookLines(records),
  };
}
