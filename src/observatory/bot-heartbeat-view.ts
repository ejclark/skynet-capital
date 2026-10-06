import type { DecisionRecord } from "../autonomous/decision-record.js";
import { unmanagedTickers } from "../domain/bots-universe.js";
import { type EarningsPrint, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import type { PlaybookMode, PlaybookVerdict, PlaybookVerdictState } from "../domain/types.js";
import type { Playbook } from "../playbooks/playbook.js";
import { PLAYBOOK_WIRING_GAPS, registeredPlaybooks } from "../playbooks/registry.js";
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
  /** Every house playbook plus any the bot ran, each armed, off or blocked (#4450 slice 1). */
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
 * Null — no claim — when any of those ids is not a house playbook: a Store play authored on its
 * owner's account has a basket this process cannot read, and guessing would be the false alarm.
 */
export function unmanagedHoldings(
  holdings: BotHoldings,
  verdicts: readonly PlaybookVerdict[] | null,
  house: readonly Playbook[] = registeredPlaybooks(),
): string[] | null {
  const byId = new Map(house.map((playbook) => [playbook.id, playbook]));
  const ids = new Set([...(verdicts ?? []).map((v) => v.playbookId), ...holdings.subscribedIds]);
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
 * - `off` — registered, but no pass on hand ran it: nobody switched it on for this bot.
 * - `blocked` — registered, but the live wiring cannot make it fire (`PLAYBOOK_WIRING_GAPS`).
 *   Blocked wins over armed: a playbook that runs but can never trade is not online.
 *
 * AN ARMED LINE SAYS WHAT IT IS WAITING FOR, not just that it is on (criterion 1's second half:
 * "an armed one carries its next possible entry date where it has one"). One shared sentence for
 * every armed playbook would have read as reassurance on the very day the calendar held no
 * confirmed NVDA print — see `playbook-window.ts`, which owns that read and its honesty rules.
 */
export type RollCallStatus = "armed" | "off" | "blocked";

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

export function playbookRollCall(
  verdicts: readonly PlaybookVerdict[] | null,
  now: Date = new Date(),
  house: readonly Playbook[] = registeredPlaybooks(),
  gaps: Readonly<Record<string, string>> = PLAYBOOK_WIRING_GAPS,
  calendar: readonly EarningsPrint[] = UPCOMING_PRINTS,
): RollCallLine[] {
  const ran = verdicts ?? [];
  const byId = new Map(house.map((playbook) => [playbook.id, playbook]));
  // House roster first in its own order, then anything else the bot ran (a Store play).
  const ids = [...byId.keys(), ...ran.map((v) => v.playbookId).filter((id) => !byId.has(id))];
  return [...new Set(ids)].map((playbookId): RollCallLine => {
    const verdict = ran.find((v) => v.playbookId === playbookId);
    const mode = verdict ? { mode: verdict.mode } : {};
    const gap = gaps[playbookId];
    if (gap) return { playbookId, status: "blocked", ...mode, reason: gap };
    if (!verdict) return { playbookId, status: "off", reason: OFF_REASON };
    const playbook = byId.get(playbookId);
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
 *  dashboard could not read the bot's book or its subscriptions — leaves `unmanaged` off. */
export function botHeartbeatView(
  records: readonly DecisionRecord[],
  now: Date,
  marketOpen: boolean,
  holdings?: BotHoldings,
): HeartbeatView {
  const verdicts = latestVerdictPass(records)?.verdicts ?? null;
  const orphans = holdings ? unmanagedHoldings(holdings, verdicts) : null;
  const base = {
    marketOpen,
    cadenceMs: PASS_CADENCE_MS,
    staleAfterMs: STALE_AFTER_MS,
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
      rollCall: playbookRollCall(null, now),
    };
  }
  const sinceLastPassMs = Math.max(0, now.getTime() - newest.at);
  const state: HeartbeatState = !marketOpen
    ? "market-closed"
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
    rollCall: playbookRollCall(verdicts, now),
  };
}
