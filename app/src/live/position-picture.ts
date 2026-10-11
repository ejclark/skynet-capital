import { priceOption } from "../../../src/options/pricing";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition } from "./desk";
import type { OptionPositionRow } from "./options";
import { held, parseQuantity } from "./quantity";

/**
 * A POSITION'S PICTURE, AS NUMBERS (#5070 slice 2; round 2 of #5037, R2 "tap opens it in place").
 * The opened guidance leads with two strips and three figures, in Eric's order:
 *  - the PRICE STRIP: where the stock is now against the prices that decide the position at expiry
 *    (breakeven, strike), the zones between them named in words — "keeps all", "keeps part",
 *    "loses" — so the zone never rides on hue alone;
 *  - the WAITING-EARNS STRIP (an option only): the P/L if the stock holds today's price, day by
 *    day to expiry, with the $/day along it (af4f8295: "put the $/day decay in the graph; it speeds
 *    up toward expiry"). Black-Scholes at the contract's own implied volatility, said as an
 *    assumption on the strip, never a forecast;
 *  - the THREE FIGURES: what the position ties up (Cash set aside on a sold put), its P/L, and Model
 *    projects — "—" until #4952 grades a projection.
 * Pure: the components in `shell/position-picture.tsx` draw what this returns.
 */

/** "−$550", "-$550", "$1,056.40" → signed dollars; undefined when the text names no figure. */
export function signedDollars(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const plain = text.replace(/−/g, "-").replace(/[$,\s+]/g, "");
  if (!/\d/.test(plain)) return undefined;
  const n = Number(plain);
  return Number.isFinite(n) ? n : undefined;
}

/** What a stretch of the price axis does to the position at expiry. */
export type ZoneKind = "keep" | "part" | "lose" | "gain";

export interface PriceZone {
  /** 0..100 along the axis. */
  readonly from: number;
  readonly to: number;
  readonly kind: ZoneKind;
  /** "keeps all", "keeps part", "loses", "profits" — drawn in the zone. */
  readonly word: string;
}

export interface PriceMark {
  readonly kind: "now" | "strike" | "breakeven";
  readonly price: number;
  /** 0..100 along the axis. */
  readonly at: number;
}

export interface PriceStrip {
  readonly zones: readonly PriceZone[];
  readonly marks: readonly PriceMark[];
  /** The whole strip in one sentence, for a screen reader. */
  readonly said: string;
}

const money2 = (x: number) =>
  `$${x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** A strike reads as "$80", or "$82.50" when it has cents. */
const strikeText = (x: number) =>
  Number.isInteger(x) ? `$${x.toLocaleString("en-US")}` : money2(x);

export const priceText = (kind: PriceMark["kind"], price: number): string =>
  kind === "strike" ? strikeText(price) : money2(price);

/**
 * The price strip. An option's zones run from its strike to its breakeven: a sold put keeps all
 * of the premium above its strike, part of it ${upWins ? "down" : "up"} to the breakeven, and loses below; a bought call
 * loses all it paid below its strike, part of it up to the breakeven, and profits above. Shares
 * have one line, the price they were bought at. The axis spans 10% beyond the outermost of the
 * marks so every one fits. Without a live price ("now"), the zones still draw and "now" is left
 * out — never a made-up price.
 */
export function priceStrip(
  position: DeskPosition,
  spot: number | undefined,
): PriceStrip | undefined {
  const breakeven = signedDollars(position.breakeven);
  if (breakeven === undefined || breakeven <= 0) return undefined;
  const { short } = held(position.quantity);
  const occ = parseOccSymbol(position.symbol);
  const now = spot !== undefined && spot > 0 ? spot : undefined;
  const anchors = [breakeven, ...(occ ? [occ.strike] : []), ...(now === undefined ? [] : [now])];
  const lo = Math.min(...anchors) * 0.9;
  const hi = Math.max(...anchors) * 1.1;
  const at = (x: number) => ((x - lo) / (hi - lo)) * 100;
  const marks: PriceMark[] = [
    ...(now === undefined ? [] : [{ kind: "now" as const, price: now, at: at(now) }]),
    ...(occ ? [{ kind: "strike" as const, price: occ.strike, at: at(occ.strike) }] : []),
    { kind: "breakeven", price: breakeven, at: at(breakeven) },
  ];
  const be = at(breakeven);
  const nowWords = now === undefined ? "" : ` Now ${money2(now)}.`;

  if (!occ) {
    return {
      zones: shareZones(short, be),
      marks,
      said: `${short ? "Profits below" : "Profits above"} the breakeven, ${money2(breakeven)}.${nowWords}`,
    };
  }

  // Which way profit lies: a sold put and a bought call win as the stock rises.
  const upWins = (occ.type === "put") === short;
  const zones = optionZones(short, upWins, at(occ.strike), be);
  const side = upWins ? "above" : "below";
  const said = short
    ? `At expiry: keeps all of the premium ${side} the ${strikeText(occ.strike)} strike, part of it ${upWins ? "down" : "up"} to the breakeven, ${money2(breakeven)}, and loses past it.${nowWords}`
    : `At expiry: profits ${side} the breakeven, ${money2(breakeven)}; loses part of what it paid between there and the ${strikeText(occ.strike)} strike, and all of it past the strike.${nowWords}`;
  return { zones, marks, said };
}

/** Shares: a long profits above what it cost; a short, below. */
function shareZones(short: boolean, be: number): PriceZone[] {
  const lose: PriceZone["kind"] = "lose";
  const gain: PriceZone["kind"] = "gain";
  return short
    ? [
        { from: 0, to: be, kind: gain, word: "profits" },
        { from: be, to: 100, kind: lose, word: "loses" },
      ]
    : [
        { from: 0, to: be, kind: lose, word: "loses" },
        { from: be, to: 100, kind: gain, word: "profits" },
      ];
}

/** An option's three zones, strike to breakeven between them, the winning side where `upWins`
 *  says. Sold: keeps all · keeps part · loses. Bought: profits · loses part · loses all. */
function optionZones(short: boolean, upWins: boolean, strikeAt: number, be: number): PriceZone[] {
  const [left, right] = strikeAt < be ? [strikeAt, be] : [be, strikeAt];
  const far: PriceZone["kind"] = short ? "keep" : "gain";
  const farWord = short ? "keeps all" : "profits";
  const lostWord = short ? "loses" : "loses all";
  const part: PriceZone = {
    from: left,
    to: right,
    kind: "part",
    word: short ? "keeps part" : "loses part",
  };
  return upWins
    ? [
        { from: 0, to: left, kind: "lose", word: lostWord },
        part,
        { from: right, to: 100, kind: far, word: farWord },
      ]
    : [
        { from: 0, to: left, kind: far, word: farWord },
        part,
        { from: right, to: 100, kind: "lose", word: lostWord },
      ];
}

/** One day on the waiting strip: days from today, and the P/L that day if the stock holds. */
export interface WaitPoint {
  readonly day: number;
  readonly total: number;
}

/** The $/day along the strip at a checkpoint: "now", "14 days left", "7 days left", "last day". */
export interface WaitRate {
  readonly label: string;
  readonly day: number;
  readonly perDay: number;
}

export interface WaitingStrip {
  /** "earns" on an option sold (time pays it), "costs" on one bought. */
  readonly verb: "earns" | "costs";
  readonly spot: number;
  /** Annualized, as a decimal: 0.75 is 75%. */
  readonly volatility: number;
  readonly daysLeft: number;
  readonly expiration: string;
  readonly points: readonly WaitPoint[];
  readonly rates: readonly WaitRate[];
  /** The first day the P/L crosses $0, when it does: "Oct 29". */
  readonly crosses?: string;
}

const DAY_MS = 86_400_000;

/** "Oct 29" for `day` days before `expiration` (YYYY-MM-DD), counted back from expiry. */
function dayLabel(expiration: string, daysBefore: number): string {
  const end = Date.parse(`${expiration}T00:00:00Z`);
  return new Date(end - daysBefore * DAY_MS).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Days drawn on the strip, at most this many, evenly spread (a two-year LEAP stays light). */
const MAX_POINTS = 60;

/**
 * The waiting-earns strip: the position's P/L on each day to expiry if the stock holds `spot`. Its
 * two ends are facts — today's P/L, and at expiry the premium kept or paid less what the option is
 * then worth (its intrinsic value at `spot`) — and the days between are Black-Scholes at the
 * contract's own volatility. The model's price today rarely equals the feed's mark to the cent, so
 * that small gap is faded out linearly toward expiry rather than drawn as a jump on day one.
 * Undefined for shares (no decay), for a contract the feed did not price (no spot or volatility),
 * and on expiry day (nothing left to wait for).
 */
export function waitingStrip(
  position: DeskPosition,
  row: OptionPositionRow | undefined,
): WaitingStrip | undefined {
  const occ = parseOccSymbol(position.symbol);
  if (!(occ && row)) return undefined;
  const { spot, impliedVol: volatility, daysToExpiry: daysLeft } = row;
  const contracts = parseQuantity(position.quantity);
  const value = signedDollars(position.value);
  if (
    spot === undefined ||
    !(spot > 0) ||
    volatility === undefined ||
    !(volatility > 0) ||
    !(daysLeft > 0) ||
    !Number.isFinite(contracts) ||
    contracts === 0 ||
    value === undefined
  ) {
    return undefined;
  }
  const scale = contracts * 100;
  const model = (left: number) =>
    priceOption({ spot, strike: occ.strike, daysToExpiry: left, volatility, type: occ.type });
  const today = model(daysLeft);
  if (!today) return undefined;
  const gap = value - scale * today.price;
  const totalOn = (day: number) => {
    const left = daysLeft - day;
    const priced = model(left);
    const worth = scale * (priced?.price ?? 0) + gap * (left / daysLeft);
    return position.totalPlRaw + worth - value;
  };
  const step = Math.max(1, Math.ceil(daysLeft / MAX_POINTS));
  const days: number[] = [];
  for (let d = 0; d < daysLeft; d += step) days.push(d);
  days.push(daysLeft);
  const points = days.map((day) => ({
    day,
    total: day === 0 ? position.totalPlRaw : totalOn(day),
  }));
  const rateAt = (left: number) => (model(left)?.theta ?? 0) * scale;
  const checkpoints = [
    { label: "now", left: daysLeft },
    { label: "14 days left", left: 14 },
    { label: "7 days left", left: 7 },
    { label: "last day", left: 1 },
  ].filter((c, i) => i === 0 || c.left < daysLeft);
  const rates = checkpoints.map((c) => ({
    label: c.label,
    day: daysLeft - c.left,
    perDay: rateAt(c.left),
  }));
  const startSign = Math.sign(position.totalPlRaw);
  const cross = startSign === 0 ? undefined : points.find((p) => Math.sign(p.total) === -startSign);
  return {
    verb: short(position) ? "earns" : "costs",
    spot,
    volatility,
    daysLeft,
    expiration: occ.expiration,
    points,
    rates,
    ...(cross ? { crosses: dayLabel(occ.expiration, daysLeft - cross.day) } : {}),
  };
}

const short = (p: DeskPosition) => held(p.quantity).short;

/** The first of the three figures: what the position ties up, said for its kind. */
export interface StakeFigure {
  readonly label: string;
  readonly figure: string;
  /** What the figure is, in words, under it. */
  readonly note: string;
}

/**
 * What the position ties up (3a77c6db: "capital at play"): a sold put sets aside the cash to buy
 * the shares at its strike (strike × 100 × contracts — the ticket's own "Cash set aside", which
 * the order refuses to place without); a sold call is covered by shares held; a bought option is
 * what it cost; shares are what they are worth now.
 */
export function stakeFigure(position: DeskPosition): StakeFigure {
  const occ = parseOccSymbol(position.symbol);
  const { count, short: sold } = held(position.quantity);
  if (!occ) {
    return { label: "Value", figure: position.value, note: "what the shares are worth now" };
  }
  const shares = count * 100;
  if (sold && occ.type === "put") {
    return {
      label: "Cash set aside",
      figure: `$${(occ.strike * shares).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
      note: `buys ${shares.toLocaleString("en-US")} ${occ.underlying} at ${strikeText(occ.strike)} if assigned`,
    };
  }
  if (sold) {
    return {
      label: "Shares that cover it",
      figure: `${shares.toLocaleString("en-US")} ${occ.underlying}`,
      note: `sold at ${strikeText(occ.strike)} if assigned`,
    };
  }
  return { label: "Paid", figure: position.costBasis, note: "the most it can lose" };
}
