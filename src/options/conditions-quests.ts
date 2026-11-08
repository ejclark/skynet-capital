import { type DailyHighReading, underHigh } from "../domain/daily-high.js";
import type { Quest, QuestExit } from "../domain/quest.js";
import {
  DRAWDOWN_RATES,
  DRAWDOWN_STUDY,
  EPISODES_NEEDED,
  type MoveRow,
  type StudiedIndex,
} from "./drawdown-base-rates.js";

/**
 * QUESTS FROM YOUR CASH × TODAY'S CONDITIONS (#7028 slice 3). Eric's example (2026-11-07) was "after
 * a huge correction… a portfolio with a lot of cash… write cash secured puts, enter long calls". That
 * is a thesis — corrections can deepen (2000–02, 2008) — so a quest here states the MEASURED
 * condition and what the house's own study (`docs/research/drawdown-quests-2026-11.md`) found each
 * move returned after it, with the sample and the worst tenth. It never says a time is good to buy.
 *
 * THE CONDITION (the study's, fixed before it looked): an index closes 10% or more under its
 * 252-session high AND VIX closes at 25 or more. Either index the study measured (SPY, QQQ) can
 * hold it; a quest is keyed to the index that does, and carries THAT index's own rates.
 *
 * THE BOOK GATE: cash is 50% or more of the account, and covers the move — one share, or one
 * contract's collateral. The put's strike is not known until the member picks it, so collateral is
 * judged at the last close × 100, the most any put on the index can need; the order path checks the
 * real strike at the ticket.
 *
 * THE MOVES: the cash-secured put and the shares. The 24-month call is not offered: below its
 * control on both indexes, worst decile −74%/−98%, and its sign flips by era.
 *
 * NO EDGE CLAIMED: every row reads `underpowered` (fewer episodes than the study's declared power
 * needs), so each quest carries its numbers as a `measured` base rate whose note says the edge is
 * untested, the house's call is `no-edge`, and it ranks below any tested quest (AC 5). Nothing here
 * places an order — the quest opens a draft on Trade for its owner to fire.
 *
 * Expiry needs no timer: conditions are re-read on every request, so a quest whose condition stops
 * holding is simply not derived next time. PURE: no I/O, no clock.
 */

/** The study's thresholds (`scripts/research/drawdown-quest-math.mjs`: DRAWDOWN, VIX_FLOOR). */
export const DRAWDOWN_FLOOR = 0.1;
export const VIX_FLOOR = 25;
/** Cash as a share of the account, at or above which the book matches the conditions table's row. */
export const CASH_SHARE_FLOOR = 0.5;
/** Shares a put contract covers. */
const CONTRACT = 100;

/** One studied index as the last completed session left it. */
export interface IndexCondition {
  readonly symbol: StudiedIndex;
  readonly reading: DailyHighReading;
}

/** The market half: the VIX close of the same session the index readings end on. */
export interface ConditionsMarket {
  readonly session: string;
  readonly vix: number;
  readonly indexes: readonly IndexCondition[];
}

/** The member's book: cash and the account's worth, as the server holds them. */
export interface ConditionsBook {
  readonly cash: number;
  readonly equity: number;
}

/** True when the study's condition holds for this index at this VIX. */
export function conditionHolds(reading: DailyHighReading, vix: number): boolean {
  // The 1e-9 is the study's own (`stateAt`): 1 − 90/100 is 0.09999999999999998, not 0.1.
  return underHigh(reading) >= DRAWDOWN_FLOOR - 1e-9 && vix >= VIX_FLOOR;
}

/** Cash share of the account, or 0 when the account has no positive worth to share. */
export function cashShare(book: ConditionsBook): number {
  return book.equity > 0 && book.cash > 0 ? book.cash / book.equity : 0;
}

/** The first weekday after a session: the next close, which is when the condition is read again. */
function nextSession(session: string): string {
  const d = new Date(`${session}T00:00:00Z`);
  do d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().slice(0, 10);
}

const pct = (x: number): string => `${Math.round(Math.abs(x) * 100)}%`;
const size = (x: number, digits: number): string => `${(Math.abs(x) * 100).toFixed(digits)}%`;
const signed = (x: number, digits: number): string => `${x >= 0 ? "+" : "−"}${size(x, digits)}`;

function href(deskId: string, symbol: string, play: "101" | "201"): string {
  return `/app/trade?desk=${encodeURIComponent(deskId)}&symbol=${symbol}&play=${play}`;
}

function build(args: {
  deskId: string;
  index: IndexCondition;
  market: ConditionsMarket;
  kind: "shares" | "put";
  row: MoveRow;
}): Quest {
  const { deskId, index, market, kind, row } = args;
  const { symbol, reading } = index;
  const n = row.numbers;
  const under = underHigh(reading);
  const shares = kind === "shares";
  const study = DRAWDOWN_STUDY;
  // Shares are told in whole percents; a put's premium-sized results need two decimals to be honest.
  const digits = shares ? 0 : 2;
  const move = shares ? `Buy ${symbol} shares` : `Sell a cash-secured put on ${symbol}`;
  const hold = shares
    ? "shares held 63 sessions (about 3 months)"
    : "a 0.15-delta put 30 sessions out, held to expiry";
  const unit = shares ? "of what was spent" : "of the cash it secured";
  const exits: QuestExit[] = [
    {
      kind: "time",
      text: shares
        ? "The study held 63 sessions, then sold. It ran no stop, so its numbers include every drop along the way."
        : "The study held the put to expiry, 30 sessions out, and never bought it back early.",
    },
  ];
  return {
    id: `conditions:${symbol}:${shares ? "buy-shares" : "sell-cash-secured-put"}`,
    source: "conditions",
    move: {
      kind: shares ? "buy-shares" : "sell-cash-secured-put",
      label: move,
      symbol,
      ...(shares ? {} : { contracts: 1 }),
      href: href(deskId, symbol, shares ? "101" : "201"),
    },
    why: [
      {
        rule: "drawdown-quest:condition",
        text:
          `${symbol} closed ${pct(under)} under its year high on ${reading.session} and VIX closed at ${market.vix.toFixed(2)}. ` +
          `The study's condition is 10% under with VIX at 25 or more; in its results VIX did the work, and a drawdown with calm VIX did not.`,
      },
      {
        rule: "drawdown-quest:base-rate",
        text:
          `Across ${n.sample} past entries (${n.episodes} separate sell-offs), ${hold} averaged ${signed(n.mean, digits)} ${unit} ` +
          `and came out ahead ${pct(n.rate)} of the time. Its worst tenth ` +
          (n.worstDecile >= 0
            ? `still gained ${size(n.worstDecile, digits)} or more.`
            : `lost ${size(n.worstDecile, digits)} or more.`),
      },
      {
        rule: "drawdown-quest:worst-case",
        text: `${shares ? `The worst entry lost ${pct(n.worstSingle)}. ` : ""}${row.worstCase}`,
      },
    ],
    baseRate: {
      kind: "measured",
      ...n,
      episodesNeeded: EPISODES_NEEDED,
      source: study,
      note: `Edge untested: ${n.episodes} sell-offs measured against the ${EPISODES_NEEDED} the study needs before it will claim one. These are past results, not a promise.`,
    },
    exits,
    expires: {
      date: nextSession(reading.session),
      why: `the condition is read again at the next close; it ends if ${symbol} closes within 10% of its high or VIX closes under 25`,
    },
    houseCall: "no-edge",
    confidence: shares ? "medium" : "low",
    atOpen: false,
  };
}

/**
 * The conditions quests for one book under one market read: nothing unless the book is at least half
 * cash, then the put (when its collateral is covered) and the shares (when one share is) for every
 * studied index whose condition holds. Not ranked — the route ranks across sources.
 */
export function conditionsQuests(
  deskId: string,
  market: ConditionsMarket,
  book: ConditionsBook,
): Quest[] {
  if (cashShare(book) < CASH_SHARE_FLOOR) return [];
  const quests: Quest[] = [];
  for (const index of market.indexes) {
    if (!conditionHolds(index.reading, market.vix)) continue;
    const rates = DRAWDOWN_RATES[index.symbol];
    const { close } = index.reading;
    if (book.cash >= close * CONTRACT)
      quests.push(build({ deskId, index, market, kind: "put", row: rates.put }));
    if (book.cash >= close)
      quests.push(build({ deskId, index, market, kind: "shares", row: rates.shares }));
  }
  return quests;
}
