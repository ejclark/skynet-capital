import {
  OPTION_MULTIPLIER,
  type OptionContractParts,
  occStrikeLabel,
  parseOccSymbol,
} from "../../../src/trading/option-symbols";
import type { DeskActivityEvent } from "./desk";
import { expiryWords, priceOf, signedDollars } from "./order-facts";

/**
 * AN ORDER'S PLAY AT EXPIRY, FROM THE CONTRACT ALONE (#5101, the deep dive). A single-leg option's
 * outcomes are arithmetic on three numbers the row already carries — the strike, the premium a
 * share, the contract count — so the deep dive draws them instead of quoting paragraphs: the zones
 * of the price line (where it loses, where it is still ahead, where it keeps or gains) and the
 * branches of "the play" (above the strike → …, below it → …).
 *
 * Contract arithmetic is a public fact, so a non-owner gets the same drawing; what the bot planned
 * to do NEXT (its expectation, its retire rule) is the playbook's, and stays in the owner's block
 * (#885, #5043). Nothing here is a forecast: these are the outcomes AT EXPIRY, labelled so, and the
 * deep dive says so beside them.
 *
 * Shares get a line too — the fill and where the stock is now — with no zones claimed beyond
 * "above / below what it paid", and no stop price, because an order for shares carries none.
 */

const MINUS = "−";
const money = (value: number): string =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** "$80" for a whole strike, "$77.45" otherwise — the strike's own style for any level. */
const level = (value: number): string =>
  Number.isInteger(value) ? occStrikeLabel(value) : money(value);

/** How a stretch of the line reads at expiry. Each pattern pairs with words; hue never carries it. */
export type ZoneKind = "loses" | "ahead" | "keeps";

export interface Zone {
  readonly kind: ZoneKind;
  /** Price bounds; `undefined` runs off that edge of the line. */
  readonly from?: number;
  readonly to?: number;
  /** The legend's words for this stretch: "loses below $77.45". */
  readonly words: string;
}

export interface Branch {
  /** The condition, on the price line's own swatch: "above $80". */
  readonly when: string;
  readonly kind: ZoneKind;
  /** True on the branch where the bet is wrong — drawn with ✕ and the words "wrong if". */
  readonly wrong: boolean;
  /** What happens, in words: "the put expires · keeps +$255". */
  readonly outcome: string;
}

export interface OptionPlay {
  readonly kind: "option";
  readonly occ: OptionContractParts;
  readonly written: boolean;
  readonly contracts: number;
  readonly premium: number;
  readonly breakeven: number;
  /** Cash a sold put holds aside to buy the shares — strike × 100 × contracts. */
  readonly setAside?: number;
  /** The level the bet is wrong past, and its words — the strike, read for the side it was bet. */
  readonly wrongIf?: { readonly at: number; readonly words: string };
  readonly zones: readonly Zone[];
  readonly branches: readonly Branch[];
  readonly expiryWords: string;
}

export interface SharePlay {
  readonly kind: "shares";
  readonly symbol: string;
  readonly fill: number;
  readonly zones: readonly Zone[];
}

export type Play = OptionPlay | SharePlay;

/** The play an order made, or undefined when the row cannot support one: a fill that closed a
 *  position (its result is booked, not at stake), a spread, a report, an order that never filled. */
export function orderPlay(event: DeskActivityEvent, now: Date = new Date()): Play | undefined {
  if (event.lifecycle || event.realizedPl !== undefined || event.filled <= 0) return undefined;
  const fill = priceOf(event.price);
  if (fill === undefined) return undefined;
  const occ = parseOccSymbol(event.symbol);
  if (!occ) {
    if (event.symbol === "" || event.side !== "buy") return undefined;
    const paid = money(fill);
    return {
      kind: "shares",
      symbol: event.symbol,
      fill,
      zones: [
        { kind: "loses", to: fill, words: `below the ${paid} it paid` },
        { kind: "keeps", from: fill, words: `above the ${paid} it paid` },
      ],
    };
  }
  return optionPlay(occ, event.side === "sell", event.filled, fill, now);
}

function optionPlay(
  occ: OptionContractParts,
  written: boolean,
  contracts: number,
  premium: number,
  now: Date,
): OptionPlay {
  const put = occ.type === "put";
  const k = occ.strike;
  const breakeven = Math.round((put ? k - premium : k + premium) * 100) / 100;
  const shares = contracts * OPTION_MULTIPLIER;
  const total = Math.round(premium * shares * 100) / 100;
  const strike = level(k);
  const be = level(breakeven);
  const cash = signedDollars(written ? total : -total);
  const shareWord = `${shares.toLocaleString("en-US")} ${occ.underlying}`;
  const base = { kind: "option" as const, occ, written, contracts, premium, breakeven };
  const expiry = expiryWords(occ.expiration, now);
  if (written && put) {
    return {
      ...base,
      setAside: k * shares,
      wrongIf: { at: k, words: `it ends below ${strike}` },
      expiryWords: expiry,
      zones: [
        { kind: "loses", to: breakeven, words: `loses below ${be}` },
        {
          kind: "ahead",
          from: breakeven,
          to: k,
          words: `buys ${shares} at ${strike}, still ahead`,
        },
        { kind: "keeps", from: k, words: `keeps ${cash.slice(1)} above ${strike}` },
      ],
      branches: [
        {
          when: `above ${strike}`,
          kind: "keeps",
          wrong: false,
          outcome: `the put expires · keeps ${cash}`,
        },
        {
          when: `below ${strike}`,
          kind: "ahead",
          wrong: true,
          outcome: `buys ${shareWord} at ${strike} (net ${be} a share)`,
        },
      ],
    };
  }
  if (written) {
    return {
      ...base,
      wrongIf: { at: k, words: `it ends above ${strike}` },
      expiryWords: expiry,
      zones: [
        { kind: "keeps", to: k, words: `keeps ${cash.slice(1)} below ${strike}` },
        {
          kind: "ahead",
          from: k,
          to: breakeven,
          words: `sells ${shares} at ${strike}, still ahead`,
        },
        { kind: "loses", from: breakeven, words: `loses above ${be}` },
      ],
      branches: [
        {
          when: `below ${strike}`,
          kind: "keeps",
          wrong: false,
          outcome: `the call expires · keeps ${cash}`,
        },
        {
          when: `above ${strike}`,
          kind: "ahead",
          wrong: true,
          outcome: `sells ${shareWord} at ${strike} (net ${be} a share)`,
        },
      ],
    };
  }
  const lost = `${MINUS}${money(total).replace(/\.00$/, "")}`;
  if (put) {
    return {
      ...base,
      wrongIf: { at: k, words: `it ends above ${strike}` },
      expiryWords: expiry,
      zones: [
        { kind: "keeps", to: breakeven, words: `gains below ${be}` },
        { kind: "ahead", from: breakeven, to: k, words: `worth less than it paid` },
        { kind: "loses", from: k, words: `loses all ${lost.slice(1)} above ${strike}` },
      ],
      branches: [
        { when: `below ${be}`, kind: "keeps", wrong: false, outcome: "worth more than it paid" },
        {
          when: `${be}–${strike}`,
          kind: "ahead",
          wrong: false,
          outcome: "worth less than it paid",
        },
        {
          when: `above ${strike}`,
          kind: "loses",
          wrong: true,
          outcome: `expires worthless · ${lost}`,
        },
      ],
    };
  }
  return {
    ...base,
    wrongIf: { at: k, words: `it ends below ${strike}` },
    expiryWords: expiry,
    zones: [
      { kind: "loses", to: k, words: `loses all ${lost.slice(1)} below ${strike}` },
      { kind: "ahead", from: k, to: breakeven, words: `worth less than it paid` },
      { kind: "keeps", from: breakeven, words: `gains above ${be}` },
    ],
    branches: [
      { when: `above ${be}`, kind: "keeps", wrong: false, outcome: "worth more than it paid" },
      { when: `${strike}–${be}`, kind: "ahead", wrong: false, outcome: "worth less than it paid" },
      {
        when: `below ${strike}`,
        kind: "loses",
        wrong: true,
        outcome: `expires worthless · ${lost}`,
      },
    ],
  };
}

/** Days from the fill to expiry and where today sits between them, counted in whole calendar days
 *  in New York — "29 days left", or "expired Nov 6" once it has passed. */
export function daysLeft(
  filledAt: string,
  expiration: string,
  now: Date = new Date(),
): { readonly span: number; readonly gone: number; readonly words: string } {
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const ms = (iso: string) => Date.parse(`${iso}T12:00:00Z`);
  const start = ms(day(new Date(filledAt)));
  const today = ms(day(now));
  const end = ms(expiration);
  const span = Math.max(1, Math.round((end - start) / 86_400_000));
  const left = Math.round((end - today) / 86_400_000);
  const gone = Math.min(span, Math.max(0, span - left));
  const words =
    left > 1
      ? `${left} days left`
      : left === 1
        ? "1 day left"
        : left === 0
          ? "expires today"
          : "expired";
  return { span, gone, words };
}

/** The bet as a sentence, the deep dive's title: "CRWV stays above $80 until Nov 6". */
export function playTitle(play: Play, words: string): string {
  if (play.kind === "shares")
    return `${play.symbol} ${words.toLowerCase()} from ${money(play.fill)}`;
  const { occ } = play;
  const by = play.written ? "until" : "by";
  return `${occ.underlying} ${words.charAt(0).toLowerCase()}${words.slice(1)} ${by} ${play.expiryWords}`;
}
