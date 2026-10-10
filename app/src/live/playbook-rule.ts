/**
 * A PLAYBOOK, OPENED IN PLACE (#5073 slice 3 — #5037 round 2's R2-open): the pure joins behind
 * the opened card. The card already knows its state, lane and reason from `/heartbeat`; opening it
 * adds what the R&D Store already sends (`/api/playbook-store` — the pair's strategy, its evidence
 * and the owner's subscription) and the bot's own book (`/api/desk/:id`). Nothing here asks the
 * server anything new.
 *
 * THE HONESTY RULES, each the server's own:
 *  - The wheel's step is read from the positions alone, exactly as the wheel itself reads it
 *    (`wheelPhase`, `src/playbooks/wheel.ts` — "nothing is persisted"). `wheelPhaseOf` mirrors it,
 *    and a spec holds the two together.
 *  - A pre-print window is the playbook's own answer, never re-derived here: the Store's `window`
 *    sentence is what the window probe got by ASKING the playbook (`spanOf`,
 *    `src/discovery/playbook-probe.ts`). This only lays that answer on the next print's calendar —
 *    the same `UPCOMING_PRINTS` and session arithmetic the playbook counts in.
 *  - "What it holds" is what this bot holds in the playbook's ticker. Which playbook opened each
 *    position is not on the book yet (#5037's R2-pos needs a server join), so the card names the
 *    ticker, never claims the lot.
 */

import { type EarningsPrint, nextPrint } from "../../../src/domain/earnings-calendar";
import { nextSession, sessionsBefore } from "../../../src/domain/market-calendar";
import { marketDayKey } from "../../../src/domain/market-day";
import { OPTION_MULTIPLIER, parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition } from "./desk";
import type {
  PairRowView,
  PlaybookStoreCardView,
  PlaybookStoreView,
  StrategyCardView,
} from "./playbook-store";
import { parseQuantity } from "./quantity";

/** One playbook as the Store knows it: its strategy, its pair row, and the card with its rules. */
export interface StorePair {
  readonly strategy: StrategyCardView;
  readonly pair: PairRowView;
  readonly card?: PlaybookStoreCardView;
}

/** The pair a playbook id names, looked up — never built from the id (`pair-table.ts`, criterion 8). */
export function storePairOf(store: PlaybookStoreView, playbookId: string): StorePair | undefined {
  for (const strategy of store.strategies) {
    const pair = strategy.pairs.find((p) => p.id === playbookId);
    if (pair) {
      const card = store.cards.find((c) => c.id === playbookId);
      return { strategy, pair, ...(card ? { card } : {}) };
    }
  }
  return undefined;
}

/** The two rules round 2 draws: the wheel as a loop, and a print-keyed window on the calendar.
 *  Every other strategy says its rule in its one sentence. */
export type RuleTemplate = "wheel" | "window";

export function ruleTemplateOf(strategy: string): RuleTemplate | undefined {
  if (strategy === "wheel") return "wheel";
  // The call spread trades the run-up's window (`pair-table.ts`), so it draws the same picture.
  if (strategy === "pre-print-run-up" || strategy === "call-spread") return "window";
  return undefined;
}

/** The ticker a single-ticker pair trades; undefined for a basket or none. */
export function soleSymbol(pair: PairRowView): string | undefined {
  return pair.symbols.length === 1 ? pair.symbols[0] : undefined;
}

/** The stock a position is in: its own symbol, or an option's underlying. */
export function stockOf(p: DeskPosition): string {
  return parseOccSymbol(p.symbol)?.underlying ?? p.symbol;
}

/** What this bot holds in one ticker, shares first, then its contracts by expiry. */
export function heldIn(positions: readonly DeskPosition[], symbol: string): DeskPosition[] {
  return positions
    .filter((p) => stockOf(p) === symbol)
    .sort((a, b) => Number(a.isOption) - Number(b.isOption) || a.symbol.localeCompare(b.symbol));
}

/** Mirrors `WheelPhase` in `src/playbooks/wheel.ts`. */
export type WheelPhase = "foreign" | "put-open" | "assigned" | "call-open" | "flat";

/**
 * The wheel's step on this book, read the way the wheel reads it (`wheelPhase`): a long contract or
 * short shares is not the wheel's book; a sold put is step 1; 100 shares no sold call covers is
 * step 2 (assigned); a sold call is step 3; nothing is the start.
 */
export function wheelPhaseOf(positions: readonly DeskPosition[], symbol: string): WheelPhase {
  let shares = 0;
  const contracts: { type: "call" | "put"; quantity: number }[] = [];
  for (const p of positions) {
    const occ = parseOccSymbol(p.symbol);
    const quantity = parseQuantity(p.quantity);
    if (!Number.isFinite(quantity)) continue;
    if (occ && occ.underlying === symbol) contracts.push({ type: occ.type, quantity });
    else if (!occ && p.symbol === symbol) shares += quantity;
  }
  if (shares < 0 || contracts.some((c) => c.quantity > 0)) return "foreign";
  const shorts = contracts.filter((c) => c.quantity < 0);
  if (shorts.some((c) => c.type === "put")) return "put-open";
  const callsOut = shorts.reduce((n, c) => n - c.quantity, 0);
  if (Math.floor((shares - OPTION_MULTIPLIER * callsOut) / OPTION_MULTIPLIER) >= 1) {
    return "assigned";
  }
  return callsOut > 0 ? "call-open" : "flat";
}

/** The wheel's step as the loop numbers it: ① sell a put, ② own the shares, ③ sell a call. A
 *  book with nothing open is about to take step 1; a foreign book is on no step. */
export function wheelStep(phase: WheelPhase): 1 | 2 | 3 | undefined {
  if (phase === "put-open" || phase === "flat") return 1;
  if (phase === "assigned") return 2;
  if (phase === "call-open") return 3;
  return undefined;
}

/** The contract the wheel has sold, when it has one open: the put on step 1, the call on step 3. */
export function soldContract(
  positions: readonly DeskPosition[],
  symbol: string,
  phase: WheelPhase,
): DeskPosition | undefined {
  const type = phase === "put-open" ? "put" : phase === "call-open" ? "call" : undefined;
  if (!type) return undefined;
  return positions.find((p) => {
    const occ = parseOccSymbol(p.symbol);
    return occ?.underlying === symbol && occ.type === type && parseQuantity(p.quantity) < 0;
  });
}

/** "$77.45" → 77.45; undefined for anything that is not one dollar figure. */
export function dollarsOf(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const n = Number(text.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && /\d/.test(text) ? n : undefined;
}

/** The Store's window sentence, as sessions before the print: `closes` 0 means it holds to the
 *  close of print day. A window with a hole in it ("on sessions 20, 18 …") has no single span to
 *  draw, so it reads as undefined and the card says the sentence instead. */
export function parseWindowSpan(
  span: string | undefined,
): { readonly opens: number; readonly closes: number } | undefined {
  if (!span) return undefined;
  const range = span.match(/^(\d+) to (\d+) sessions before the print$/);
  if (range) return { opens: Number(range[1]), closes: Number(range[2]) };
  const toPrint = span.match(/^(\d+) sessions before the print to the close of print day$/);
  if (toPrint) return { opens: Number(toPrint[1]), closes: 0 };
  return undefined;
}

/** Where today sits against the window: before it opens, inside it, or out and waiting on the
 *  print itself. */
export type WindowPhase = "before" | "inside" | "out";

export interface WindowPlan {
  readonly symbol: string;
  readonly print: { readonly date: string; readonly confirmed: boolean };
  /** The first session it wants to hold. */
  readonly opens: string;
  /** The last session it wants to hold — print day itself when it holds to the close. */
  readonly lastLong: string;
  /** The first session it wants out; absent when it holds to the close of print day. */
  readonly outBy?: string;
  readonly today: string;
  readonly phase: WindowPhase;
}

/**
 * The window laid on the next print's calendar. Undefined when the Store sent no single span, or
 * no print for the ticker is on file — there is then nothing true to draw a date on.
 */
export function windowPlan(
  symbol: string,
  span: string | undefined,
  nowIso: string,
  prints?: readonly EarningsPrint[],
): WindowPlan | undefined {
  const window = parseWindowSpan(span);
  if (!window) return undefined;
  const print = nextPrint(symbol, nowIso, prints);
  if (!print) return undefined;
  const opens = sessionsBefore(print.date, window.opens);
  const lastLong = sessionsBefore(print.date, window.closes);
  const today = marketDayKey(nowIso);
  const phase: WindowPhase = today < opens ? "before" : today <= lastLong ? "inside" : "out";
  return {
    symbol,
    print: { date: print.date, confirmed: print.status === "confirmed" },
    opens,
    lastLong,
    ...(window.closes > 0 ? { outBy: nextSession(lastLong) } : {}),
    today,
    phase,
  };
}

/** "Oct 21", or "Jan 29, 2027" when it is not this year. Date-only in, read at UTC noon. */
export function dayText(date: string, now: Date = new Date()): string {
  const at = new Date(`${date}T12:00:00Z`);
  return at.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(at.getUTCFullYear() === now.getUTCFullYear() ? {} : { year: "numeric" }),
  });
}

/** Whose say-so a playbook runs on, in the Store's own words: its evidence, the mode it runs in,
 *  and the dated test that would stop its new entries. */
export interface SaySo {
  /** "◆ Your conviction", "✓ Researched, weakened". */
  readonly head: string;
  readonly mode?: string;
  /** The pair's call — the server's one sentence. */
  readonly call: string;
  /** The owner's own reason, for a conviction. */
  readonly reason?: string;
  /** "Checked again Jan 29, 2027", "Good until Mar 31, 2027". */
  readonly dated?: string;
  readonly studyHref?: string;
}

export function saySoOf(pair: PairRowView, mode?: string): SaySo {
  const conviction = pair.subscription?.conviction;
  const head =
    pair.status === "conviction"
      ? "◆ Your conviction"
      : pair.statusLabel.replace(/^(\S+\s)(\S)/, (_, g: string, c: string) => g + c.toUpperCase());
  const checkOn = conviction?.checkOn ?? pair.checkOn;
  const dated = checkOn
    ? `Checked again ${dayText(checkOn)} — a failed check stops new entries; exits never stop`
    : pair.shelfOn && !pair.stale
      ? `Good until ${dayText(pair.shelfOn)}, then re-researched before new entries`
      : undefined;
  const runIn = pair.subscription?.mode ?? mode;
  return {
    head,
    ...(runIn ? { mode: runIn } : {}),
    // An issue number is written for the code's readers, not the member (as `plainReason` drops it).
    call: pair.call.replace(/\s*\(#\d+\)/g, ""),
    ...(conviction?.reason ? { reason: conviction.reason } : {}),
    ...(dated ? { dated } : {}),
    ...(pair.studyHref ? { studyHref: pair.studyHref } : {}),
  };
}
