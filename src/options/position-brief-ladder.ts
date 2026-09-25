import {
  DELTA_TOLERANCE,
  HEADLINE_DELTA,
  HEADLINE_MIN_DTE,
  LADDER_DEPTH,
  MAX_SHORT_DELTA,
  MAX_SPREAD_OF_MID,
  MIN_BID,
} from "./position-brief-rules.js";
import type { BriefInputs, BriefQuote, DteMark, LadderRow } from "./position-brief-types.js";
import { priceOption } from "./pricing.js";
import { daysToExpiryFrom } from "./single-leg-odds.js";
import { probabilityAbove, probabilityBelow, probabilityOfTouch } from "./terminal-odds.js";

/**
 * THE STRIKE LADDER — the sellable strikes on every in-band expiry, for a covered call and a
 * cash-secured put, each priced at the BID (the member is selling; the mid is shown second and
 * never used for a yield). A strike that fails a rule is counted under that rule's name, so an
 * empty ladder can still say exactly why it is empty.
 *
 * On the expected-move floor the plan (#3729) also listed: it is deliberately NOT applied. A 1×
 * expected-move strike sits near 0.16 delta, so it duplicates MAX_SHORT_DELTA at a stricter level
 * and would discard the 0.20–0.30 band income sellers actually use. The delta cap is the one rule.
 */

export type LadderDrop = "quote" | "otm" | "basis" | "delta" | "own" | "cash";

export interface LadderResult {
  readonly rows: readonly LadderRow[];
  /** How many strikes each rule removed — the raw material for a WAIT's "why". */
  readonly dropped: Readonly<Record<LadderDrop, number>>;
}

const emptyDrops = (): Record<LadderDrop, number> => ({
  quote: 0,
  otm: 0,
  basis: 0,
  delta: 0,
  own: 0,
  cash: 0,
});

/** PRICE-AT-BID: a quote a seller could actually hit — bid ≥ a dime, spread ≤ 15% of mid, IV solved. */
function tradable(q: BriefQuote): { bid: number; mid: number; iv: number } | undefined {
  const { bid, ask, iv } = q;
  if (bid === undefined || ask === undefined || iv === undefined) return undefined;
  if (!(bid >= MIN_BID && ask >= bid && iv > 0)) return undefined;
  const mid = (bid + ask) / 2;
  if ((ask - bid) / mid > MAX_SPREAD_OF_MID) return undefined;
  return { bid, mid, iv };
}

interface Side {
  readonly lever: LadderRow["lever"];
  readonly type: BriefQuote["type"];
  /** Contracts this strike supports, or 0 when the stake cannot cover it. */
  readonly contracts: (strike: number) => number;
  /** A rule-named reason this strike is out, or undefined when it may be sold. */
  readonly reject: (strike: number) => LadderDrop | undefined;
}

function sideFor(lever: LadderRow["lever"], input: BriefInputs): Side {
  const { spot, stake } = input;
  if (lever === "covered-calls") {
    const lots = Math.floor((stake.shares ?? 0) / 100);
    const protectBasis = stake.costBasis !== undefined && stake.goal !== "exit";
    return {
      lever,
      type: "call",
      contracts: () => lots,
      reject: (strike) =>
        strike <= spot
          ? "otm"
          : protectBasis && strike < (stake.costBasis ?? 0)
            ? "basis"
            : undefined,
    };
  }
  return {
    lever,
    type: "put",
    contracts: (strike) => Math.floor((stake.cash ?? 0) / (strike * 100)),
    reject: (strike) =>
      strike >= spot
        ? "otm"
        : stake.happyToOwnAt !== undefined && strike > stake.happyToOwnAt
          ? "own"
          : undefined,
  };
}

function rowFor(
  side: Side,
  q: BriefQuote,
  mark: DteMark,
  input: BriefInputs,
  drops: Record<LadderDrop, number>,
): LadderRow | undefined {
  const drop = (reason: LadderDrop): undefined => {
    drops[reason] += 1;
    return undefined;
  };
  const rejected = side.reject(q.strike);
  if (rejected) return drop(rejected);
  const quote = tradable(q);
  if (!quote) return drop("quote");
  const contracts = side.contracts(q.strike);
  if (contracts < 1) return drop("cash");
  const days = daysToExpiryFrom(q.expiration, new Date(input.now)) ?? mark.dte;
  const rate = input.rate ?? 0;
  const odds = {
    spot: input.spot,
    target: q.strike,
    daysForward: days,
    volatility: quote.iv,
    rate,
  };
  const valuation = priceOption({
    spot: input.spot,
    strike: q.strike,
    daysToExpiry: days,
    volatility: quote.iv,
    rate,
    type: side.type,
  });
  const assigned = side.type === "call" ? probabilityAbove(odds) : probabilityBelow(odds);
  const touch = probabilityOfTouch(odds);
  if (!valuation || assigned === undefined || touch === undefined) return drop("quote");
  if (Math.abs(valuation.delta) > MAX_SHORT_DELTA) return drop("delta");
  const capital = side.type === "call" ? input.spot : q.strike;
  const basis = input.stake.costBasis ?? input.spot;
  const disagreement =
    q.feedDelta === undefined ? undefined : Math.abs(q.feedDelta - valuation.delta);
  return {
    lever: side.lever,
    expiration: q.expiration,
    dte: mark.dte,
    strike: q.strike,
    bid: quote.bid,
    mid: quote.mid,
    annualizedYield: (quote.bid / capital) * (365 / Math.max(1, mark.dte)),
    probAssigned: assigned,
    probTouch: touch,
    ...(side.type === "call"
      ? { returnIfCalled: (q.strike - basis + quote.bid) / basis }
      : { effectiveEntry: q.strike - quote.bid }),
    delta: valuation.delta,
    ...(disagreement !== undefined && disagreement > DELTA_TOLERANCE
      ? { deltaDisagreement: disagreement }
      : {}),
    contracts,
  };
}

/** The ladder for one lever: top `LADDER_DEPTH` strikes by yield-at-bid, per in-band expiry. */
export function buildLadder(
  lever: LadderRow["lever"],
  input: BriefInputs,
  strip: readonly DteMark[],
): LadderResult {
  const side = sideFor(lever, input);
  const dropped = emptyDrops();
  const rows = strip
    .filter((m) => m.verdict === "in")
    .flatMap((mark) =>
      input.chain
        .filter((q) => q.expiration === mark.expiration && q.type === side.type)
        .flatMap((q) => rowFor(side, q, mark, input, dropped) ?? [])
        .sort((a, b) => b.annualizedYield - a.annualizedYield || a.strike - b.strike)
        .slice(0, LADDER_DEPTH),
    );
  return { rows, dropped };
}

/**
 * The headline row a call quotes — NOT the highest annualized yield, which always crowns the
 * riskiest, shortest trade (a 7-DTE near-the-money put can print "100% annualized"). The pick is the
 * practitioner sweet spot: at least HEADLINE_MIN_DTE when the band allows, |delta| nearest
 * HEADLINE_DELTA, then the higher yield.
 */
export function headlineRow(rows: readonly LadderRow[]): LadderRow | undefined {
  const long = rows.filter((r) => r.dte >= HEADLINE_MIN_DTE);
  const pool = long.length > 0 ? long : rows;
  return [...pool].sort(
    (a, b) =>
      Math.abs(Math.abs(a.delta) - HEADLINE_DELTA) - Math.abs(Math.abs(b.delta) - HEADLINE_DELTA) ||
      b.annualizedYield - a.annualizedYield,
  )[0];
}
