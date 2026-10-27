import { OPTION_MULTIPLIER, occStrikeLabel } from "../../../src/trading/option-symbols";
import { signedDollars } from "./order-facts";
import type { OptionPlay, Play } from "./order-play";

/**
 * THE OPENED ORDER'S PRICE LINE, AS DATA (#5262; settled on #5160, rounds 8–16). The deep dive's
 * line (`order-play.ts` zones) names what each stretch does at expiry; the opened order's line names
 * the levels the strategy turns on, then what the bar means, then the outcome split at the strike:
 *  - the pivots come first — Breakeven · Strike (Filled, for shares) — each over its own line, with
 *    now on its ring (round 15: "break even, strike and current price on the top");
 *  - the zones say what a stretch IS, not what it does: Loss (hatch), the Premium (solid — round 8:
 *    "The premium is the profit in this particular trade"), Profit past a bought option's
 *    breakeven (solid), and OTM past a sold option's strike (a thin line, never green — round 8:
 *    "Everything above the strike price for puts is just OTM, not green");
 *  - the outcome AT EXPIRY, either side of the strike: ITM and OTM, each with what happens there.
 * Assignment is said at expiry only (round 16: "any contracts can be assigned") — the words never
 * claim OTM can't be assigned early, or that ITM waits for expiry; they say what expiry does.
 * Everything is the contract's arithmetic; nothing here is a forecast or a P/L.
 */

export type PivotZoneKind = "loss" | "premium" | "profit" | "otm";

export interface PivotZone {
  readonly kind: PivotZoneKind;
  /** Price bounds; `undefined` runs off that edge of the line. */
  readonly from?: number;
  readonly to?: number;
}

/** The word under a zone. OTM has none under the bar: the outcome below names it. */
export const ZONE_NAME: Record<PivotZoneKind, string | undefined> = {
  loss: "Loss",
  premium: "Premium",
  profit: "Profit",
  otm: undefined,
};

export interface Pivot {
  readonly name: string;
  readonly at: number;
  /** The strike: its line carries on down, dividing the outcome at expiry. */
  readonly divides?: boolean;
}

/** One side of the strike at expiry: "ITM · below $80", then its lines, each kept whole. */
export interface Outcome {
  readonly side: "ITM" | "OTM";
  readonly when: string;
  readonly lines: readonly string[];
}

export interface PivotLine {
  readonly pivots: readonly Pivot[];
  /** The level the axis centres on — the strike, or a share's fill — so the outcome's divider
   *  sits mid-card and both sides get the same room, wherever the stock has gone since. */
  readonly centre: number;
  readonly zones: readonly PivotZone[];
  /** The loss runs on past the edge (shares, a sold option) — never a bought option's, which
   *  stops at what it paid. */
  readonly lossGrows: boolean;
  readonly atExpiry?: {
    readonly when: string;
    readonly below: Outcome;
    readonly above: Outcome;
  };
}

/** A whole-dollar amount the way the card says cash: "$8,000", "$255", "$45.50". */
const dollars = (value: number): string => signedDollars(value).slice(1);

export function pivotLine(play: Play): PivotLine {
  if (play.kind === "shares") {
    return {
      pivots: [{ name: "Filled", at: play.fill }],
      centre: play.fill,
      zones: [
        { kind: "loss", to: play.fill },
        { kind: "profit", from: play.fill },
      ],
      lossGrows: true,
    };
  }
  return optionLine(play);
}

function optionLine(play: OptionPlay): PivotLine {
  const { occ, written, breakeven: be } = play;
  const k = occ.strike;
  const put = occ.type === "put";
  const strike = occStrikeLabel(k);
  const shares = play.contracts * OPTION_MULTIPLIER;
  const stock = `${shares.toLocaleString("en-US")} ${occ.underlying} shares`;
  const atStrike = dollars(k * shares);
  const paid = dollars(Math.round(play.premium * shares * 100) / 100);
  const pivots: Pivot[] = [
    { name: "Breakeven", at: be },
    { name: "Strike", at: k, divides: true },
  ];
  // ITM is the side the option pays on: below a put's strike, above a call's.
  const itm = (lines: readonly string[]): Outcome => ({
    side: "ITM",
    when: `${put ? "below" : "above"} ${strike}`,
    lines,
  });
  const otm = (lines: readonly string[]): Outcome => ({
    side: "OTM",
    when: `${put ? "above" : "below"} ${strike}`,
    lines,
  });
  const lapses = written
    ? put
      ? ["expires:", `the ${atStrike}`, "is freed"]
      : ["expires:", "no shares", "are sold"]
    : ["expires:", `the ${paid} paid`, "is lost"];
  const lands = written
    ? put
      ? ["assigned:", `${atStrike} buys`, stock]
      : ["assigned:", stock, `sell for ${atStrike}`]
    : put
      ? ["exercised:", stock, `sell for ${atStrike}`]
      : ["exercised:", `${atStrike} buys`, stock];
  const [below, above] = put ? [itm(lands), otm(lapses)] : [otm(lapses), itm(lands)];
  // A sold option: the premium is the stretch between the strike and breakeven, the loss lies past
  // breakeven, and the OTM side is flat. A bought one: the loss runs to breakeven, profit past it.
  const zones: PivotZone[] = written
    ? put
      ? [
          { kind: "loss", to: be },
          { kind: "premium", from: be, to: k },
          { kind: "otm", from: k },
        ]
      : [
          { kind: "otm", to: k },
          { kind: "premium", from: k, to: be },
          { kind: "loss", from: be },
        ]
    : put
      ? [
          { kind: "profit", to: be },
          { kind: "loss", from: be },
        ]
      : [
          { kind: "loss", to: be },
          { kind: "profit", from: be },
        ];
  return {
    pivots: put ? pivots : [...pivots].reverse(),
    centre: k,
    zones,
    lossGrows: written,
    atExpiry: { when: play.expiryWords, below, above },
  };
}

/** The axis, centred on the line's own level: half its width covers the farthest of the pivots
 *  and now, with room past it, so the strike — and the outcome's divider — stay mid-card. */
export function pivotScale(line: PivotLine, now?: number): (value: number) => number {
  const levels = [...line.pivots.map((p) => p.at), ...(now === undefined ? [] : [now])];
  const reach = Math.max(...levels.map((v) => Math.abs(v - line.centre)), line.centre * 0.02);
  const half = reach * 1.5;
  return (value) => 50 + ((value - line.centre) / half) * 50;
}

/** Spread labels that would overlap: each keeps its order and stays as near its mark as it can,
 *  at least `gap` percent from its neighbours and inside [`edge`, 100 − `edge`]. */
export function spreadLabels(xs: readonly number[], gap: number, edge: number): number[] {
  const order = xs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x);
  const placed = order.map((o) => Math.min(100 - edge, Math.max(edge, o.x)));
  for (let pass = 0; pass < 20; pass += 1) {
    let moved = false;
    for (let j = 1; j < placed.length; j += 1) {
      const short = gap - ((placed[j] as number) - (placed[j - 1] as number));
      if (short > 0.01) {
        placed[j - 1] = Math.max(edge, (placed[j - 1] as number) - short / 2);
        placed[j] = Math.min(100 - edge, (placed[j] as number) + short / 2);
        moved = true;
      }
    }
    if (!moved) break;
  }
  const out = new Array<number>(xs.length);
  order.forEach((o, j) => {
    out[o.i] = placed[j] as number;
  });
  return out;
}
