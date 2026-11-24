import type { DecisionRecord } from "../autonomous/decision-record.js";
import { BOTS_ONLY_NOTE } from "../domain/playbook-bots-only.js";
import { botHeartbeatView, type HeartbeatState } from "./bot-heartbeat-view.js";
import { decisionCyclesView } from "./decision-json-view.js";
import { PERSONA_LORE } from "./persona-lore.js";
import { withoutPlaybookNames } from "./playbook-name-redaction.js";

/**
 * THE BOTS SCREEN'S ROSTER (#8254, step 10 of #8161's shape 5) — one row per bot account in the
 * league, composed from reads the desk routes already make: the bot's own passes (`readDecisions`,
 * the heartbeat's read) and the house mode and gate verdicts the bots process reports on its
 * `/controls` poll. No broker call and no model call: every time, state and reason here comes from
 * the bots' records, and an unknown says so in words.
 *
 * Watching only. A row is a joint, not a copy (docs/IA.md §2f): the checks and the cards stay on
 * `/u/$id/playbooks`, and the row links there. Which playbooks a bot runs stays its owner's (#885)
 * in this slice, so a skip's reason is the non-owner copy: playbook ids read as "a playbook".
 */

export interface BotStandingView {
  readonly placing: boolean;
  readonly words: string;
}

export interface BotLoopView {
  readonly state: HeartbeatState;
  readonly lastCheckAt: string | null;
  readonly sinceLastCheckMs: number | null;
  readonly marketOpen: boolean;
}

/** The newest check that placed nothing, and why, in the bot's own recorded words. */
export interface BotSkipView {
  readonly at: string;
  /** Absent when the check recorded no reason: the screen says so and never writes one. */
  readonly reason?: string;
}

export interface BotRowView {
  readonly id: string;
  readonly name: string;
  /** The persona's own name and thesis; absent for a bot account no persona describes. */
  readonly persona?: { readonly name: string; readonly thesis: string };
  /** Null when the bots process has not reported this bot's standing. */
  readonly standing: BotStandingView | null;
  /** Null when no record of its checks is wired on this deployment. */
  readonly loop: BotLoopView | null;
  /** Null when no check on hand placed nothing (or none is recorded). */
  readonly skip: BotSkipView | null;
  readonly followed: boolean;
}

export interface NotRunningView {
  readonly personaId: string;
  readonly name: string;
  readonly thesis: string;
}

export interface BotsRosterView {
  /** The house mode from the `/controls` poll; null when the bots process has not reported one. */
  readonly houseMode: "observe" | "live" | null;
  /** Followed first (in follow order), then the rest by name. */
  readonly bots: readonly BotRowView[];
  readonly notRunning: readonly NotRunningView[];
  /** False with no signed-in member or no follow store wired: the screen offers no Follow then. */
  readonly canFollow: boolean;
  /** `BOTS_ONLY_NOTE` verbatim: the subscribe door and this screen never say two things. */
  readonly note: string;
}

export interface BotInput {
  readonly id: string;
  readonly displayName: string;
  readonly personaId?: string;
  /** Newest first; undefined when no decision store is wired. */
  readonly records: readonly DecisionRecord[] | undefined;
  readonly standing: BotStandingView | null;
}

/** "would have bought" — an observed intent, said as what it would have done. */
const WOULD: Record<string, string> = { buy: "would have bought", sell: "would have sold" };

/**
 * Why a check placed nothing, from what it recorded. The halt, then the guards' refusal, then the
 * first outcome: each is the bot's own words or the house's fixed label for the rule that fired,
 * never a model's. A quiet check (nothing fired) records no reason, so none is returned.
 */
export function skipReasonOf(record: DecisionRecord): string | undefined {
  const [cycle] = decisionCyclesView([record]).cycles;
  if (!cycle) return undefined;
  // The non-owner copy (#885): ids out of the keys and out of the words (#4442).
  const redacted = withoutPlaybookNames(cycle, cycle);
  if (redacted.halted) return redacted.halted;
  const refused = redacted.refusedIntents?.[0];
  if (refused) return `${refused.symbol}: ${refused.guardReason ?? refused.reason}`;
  const outcome = redacted.outcomes[0];
  if (!outcome) return undefined;
  if (outcome.action === "cooldown-skipped") {
    return `${outcome.symbol}: not sent — ordered too recently, or an earlier order is still open`;
  }
  if (outcome.action === "rejected") return `${outcome.symbol}: the broker refused the order`;
  return `${outcome.symbol}: ${WOULD[outcome.side] ?? outcome.side} — ${outcome.reason}`;
}

/** The newest check on hand that placed nothing. */
export function newestSkip(records: readonly DecisionRecord[]): BotSkipView | null {
  const skip = records.find((r) => !r.outcomes.some((o) => o.action === "placed"));
  if (!skip) return null;
  const reason = skipReasonOf(skip);
  return { at: new Date(skip.at).toISOString(), ...(reason ? { reason } : {}) };
}

function rowOf(
  bot: BotInput,
  now: Date,
  marketOpen: boolean,
  followed: ReadonlySet<string>,
): BotRowView {
  const lore = PERSONA_LORE[bot.personaId ?? bot.id];
  let loop: BotLoopView | null = null;
  if (bot.records) {
    const beat = botHeartbeatView(bot.records, now, marketOpen);
    loop = {
      state: beat.state,
      lastCheckAt: beat.lastPassAt,
      sinceLastCheckMs: beat.sinceLastPassMs,
      marketOpen,
    };
  }
  return {
    id: bot.id,
    name: bot.displayName,
    ...(lore ? { persona: { name: lore.name, thesis: lore.thesis } } : {}),
    standing: bot.standing,
    loop,
    skip: bot.records ? newestSkip(bot.records) : null,
    followed: followed.has(bot.id),
  };
}

export function botsRosterView(input: {
  readonly bots: readonly BotInput[];
  readonly houseMode: "observe" | "live" | undefined;
  /** The viewer's followed bot ids, oldest follow first. */
  readonly following: readonly string[];
  readonly canFollow: boolean;
  readonly now: Date;
  readonly marketOpen: boolean;
}): BotsRosterView {
  const followed = new Set(input.following);
  const rows = input.bots.map((b) => rowOf(b, input.now, input.marketOpen, followed));
  const order = new Map(input.following.map((id, i) => [id, i]));
  const sorted = [...rows].sort((a, b) => {
    const fa = order.get(a.id);
    const fb = order.get(b.id);
    if (fa !== undefined || fb !== undefined) return (fa ?? Infinity) - (fb ?? Infinity);
    return a.name.localeCompare(b.name);
  });
  const running = new Set(input.bots.map((b) => b.personaId ?? b.id));
  const notRunning = Object.entries(PERSONA_LORE)
    .filter(([id]) => !running.has(id))
    .map(([personaId, lore]) => ({ personaId, name: lore.name, thesis: lore.thesis }));
  return {
    houseMode: input.houseMode ?? null,
    bots: sorted,
    notRunning,
    canFollow: input.canFollow,
    note: BOTS_ONLY_NOTE,
  };
}
