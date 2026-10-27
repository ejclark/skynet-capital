import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { HaltReason } from "../autonomous/safety.js";
import { regularSessionOpen, sessionBounds, sessionWeek } from "../domain/market-session.js";
import type { Alert } from "./alert.js";

/**
 * BOT WATCH — tells a bot's owner, during market hours, that the bot has stopped trading.
 *
 * Why it exists (the 2026-10-18 loop census of the bots' runtime): a bot could stop cycling, or sit
 * halted, and nobody would be told. Until now a stall produced a `[stall]` log line in
 * `fly logs` (`src/autonomous/cycle-watch.ts`) and a "stale" desk card
 * (`src/observatory/bot-heartbeat-view.ts`). Both need someone to go and look. The evidence:
 *
 *  - docs/LESSONS.md, 2026-10-09 ("The dashboard took the bots' one Alpaca price-feed
 *    connection"). The feed was down for days. It was caught only because the owner asked "no
 *    trades made today?" on 2026-10-08. That entry's side quest asks for exactly this: a
 *    market-hours "feed down for N minutes" alert (docs/IDEAS.md, #4864).
 *  - 2026-10-06, confirmed live (`src/alpaca/market-data-stream.ts`): the bots' socket died about
 *    60s after boot, and the bots sat silent through the open.
 *
 * It reads the same facts the heartbeat card reads, the bot's own decision records (newest pass,
 * and whether that pass was halted), and publishes them as `Alert`s. That puts a stall on the
 * Alerts strip and in the hourly delivery sweep (`dashboard-alert-delivery.ts`), so it reaches the
 * owner when they are not looking.
 *
 * Pure. The clock is passed in and nothing here does I/O. Market hours come from the repo's own
 * session clock (`market-session.ts`), never hand-rolled. Rules:
 *
 *  - Outside the regular session: no alerts. A closed market explains silence.
 *  - Stalled: no completed cycle for `BOT_STALL_AFTER_MS` of open market. One critical alert per
 *    bot per stall, naming the bot and how long. Overnight silence does not count: the clock
 *    starts at the later of the last pass and today's open, which is `cycle-watch.ts`'s own rule.
 *  - Halted: the newest pass was blocked by a safety-controller breaker (`HaltReason`). One
 *    critical alert per bot per breaker per session, naming the breaker. An owner's own suspend
 *    is not a breaker, so it raises nothing: they did it themselves, and the desk card shows it.
 *  - No records at all: no claim. That is absence, not a stall (the card says "no-record").
 *
 * DEDUPE. The delivery ledger and dismissals are keyed by `alertFingerprint` (source · priority ·
 * symbol · dedupeKey) and kept forever. So each key names one EPISODE, not just "bot X is
 * stalled". Otherwise the first stall ever mailed would silence every later one. A stall is keyed
 * by the pass the bot went quiet after; a halt by the session it was seen in. Ids use the same
 * episode, so they are stable across reads (an hourly sweep re-derives the identical alert).
 */

export const BOT_WATCH_SOURCE = "bot-watch";

/** How long a bot may go without a completed cycle during market hours before its owner is told.
 *  Wider than the card's two minutes (`STALE_AFTER_MS`) and the log's five (`DEFAULT_STALL_MS`).
 *  This one can send an email, so it must never fire on ordinary lag: a healthy bot passes every
 *  15s, and its passes reach the dashboard on a 30s poll. */
export const BOT_STALL_AFTER_MS = 10 * 60_000;

/** The breaker, in the words an owner reads. Typed over `HaltReason`, so a new breaker fails the
 *  build here until someone names it. */
const BREAKERS: Record<HaltReason, { readonly name: string; readonly why: string }> = {
  manual: { name: "the kill switch", why: "Someone threw it on purpose." },
  "daily-loss": {
    name: "the daily-loss breaker",
    why: "Account equity fell past the day's loss cap.",
  },
  "order-rate": {
    name: "the order-rate breaker",
    why: "Too many orders went out inside the rate window.",
  },
  errors: { name: "the errors breaker", why: "Too many decision cycles failed in a row." },
  "data-gap": { name: "the data-gap breaker", why: "Quotes went missing or came back unreadable." },
};

function isBreaker(reason: string): reason is HaltReason {
  return Object.hasOwn(BREAKERS, reason);
}

/** One bot as the watch sees it: who it is, and its decision records in any order. */
export interface BotWatchInput {
  readonly botId: string;
  readonly name: string;
  readonly records: readonly Pick<DecisionRecord, "at" | "halted">[];
}

/** Today's regular session, when `now` is inside one. Built from the calendar helpers. */
function sessionAt(
  now: number,
): { readonly date: string; readonly openAt: number; readonly closeAt: number } | undefined {
  return sessionWeek(new Date(now))
    .map((date) => ({ date, ...sessionBounds(date) }))
    .find((session) => session.openAt <= now && now < session.closeAt);
}

/** "12 min", "1 h 5 min": whole minutes, rounded down, so the words never overstate. */
export function durationWords(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} h${rest > 0 ? ` ${rest} min` : ""}`;
}

function stalledAlert(
  bot: BotWatchInput,
  lastPassAt: number,
  openAt: number,
  now: number,
): Alert | undefined {
  const quietSince = Math.max(lastPassAt, openAt);
  const quietMs = now - quietSince;
  if (quietMs < BOT_STALL_AFTER_MS) return undefined;
  const sinceOpen = lastPassAt < openAt;
  return {
    id: `${BOT_WATCH_SOURCE}:stalled:${bot.botId}@${lastPassAt}`,
    at: now,
    source: BOT_WATCH_SOURCE,
    priority: "critical",
    title: sinceOpen
      ? `${bot.name} has not finished a decision cycle since the open, ${durationWords(quietMs)} ago`
      : `${bot.name} has not finished a decision cycle in ${durationWords(quietMs)}`,
    body:
      "The market is open, but this bot's loop has stopped, so it is not trading. A dead price " +
      "feed or a hung cycle look like this. The bot's heartbeat card shows when its last pass ran.",
    dedupeKey: `stalled:${bot.botId}:${lastPassAt}`,
    data: { botId: bot.botId, lastPassAt, quietMs },
  };
}

function haltedAlert(
  bot: BotWatchInput,
  reason: HaltReason,
  passAt: number,
  session: string,
  now: number,
): Alert {
  const breaker = BREAKERS[reason];
  return {
    id: `${BOT_WATCH_SOURCE}:halted:${bot.botId}:${reason}@${session}`,
    at: now,
    source: BOT_WATCH_SOURCE,
    priority: "critical",
    title: `${bot.name} is halted by ${breaker.name}, so it places no orders`,
    body: `${breaker.why} A breaker never re-arms on its own, so the bot stays halted until someone resets it.`,
    dedupeKey: `halted:${bot.botId}:${reason}:${session}`,
    data: { botId: bot.botId, breaker: reason, passAt },
  };
}

/** Every alert the bots' heartbeats imply right now, in the input's order. Sorting by loudness is
 *  the consumer's job (`sortAlerts`). */
export function botAlerts(bots: readonly BotWatchInput[], now: number): Alert[] {
  if (!regularSessionOpen(new Date(now))) return [];
  const session = sessionAt(now);
  // `regularSessionOpen` and the bounds read one calendar, so `session` exists here. Without it,
  // stall time would count from the last pass alone, with no allowance for the overnight gap.
  const openAt = session?.openAt ?? Number.NEGATIVE_INFINITY;
  const alerts: Alert[] = [];
  for (const bot of bots) {
    const newest = bot.records.reduce<(typeof bot.records)[number] | undefined>(
      (held, record) => (held === undefined || record.at > held.at ? record : held),
      undefined,
    );
    if (!newest) continue;
    const stalled = stalledAlert(bot, newest.at, openAt, now);
    if (stalled) alerts.push(stalled);
    if (newest.halted && isBreaker(newest.halted)) {
      alerts.push(haltedAlert(bot, newest.halted, newest.at, session?.date ?? "today", now));
    }
  }
  return alerts;
}
