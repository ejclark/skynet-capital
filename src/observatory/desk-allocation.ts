import { isOccSymbol } from "../trading/option-symbols.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { formatCurrency } from "./render-atoms.js";

/** Where the money is (#3689 slice 5): long market value split into shares and options, plus cash.
 *  Percentages are of that three-way total (shorts and a negative cash balance are left out of the
 *  bar, since a bar can't draw a negative slice), so the three always add to 100. */
export interface DeskAllocation {
  readonly shares: string;
  /** Options HELD — the long side only, the same money the bar's options slice draws. */
  readonly options: string;
  /** "-$1,240" — what the open sold options would cost to buy back (#4948). Present only while a
   *  sold option is open: the bar can't draw it, so this is the one place the strip owns up to it,
   *  where "Options $0" used to sit as though nothing were owed. */
  readonly optionsSold?: string;
  readonly cash: string;
  readonly sharesPct: number;
  readonly optionsPct: number;
  readonly cashPct: number;
  /** "32.9%" — cash's share, for the "cash ready to use" line. */
  readonly cashShare: string;
  /** Signed shares held across every stock position. Their delta, which the Money strip adds to
   *  the option book's delta for "market exposure". */
  readonly shareCount: number;
}

export function allocationOf(snapshot: ParticipantSnapshot): DeskAllocation {
  let shares = 0;
  let options = 0;
  let optionsSold = 0;
  let anySold = false;
  let shareCount = 0;
  for (const p of snapshot.positions) {
    const long = Math.max(0, p.marketValue);
    if (isOccSymbol(p.symbol)) {
      options += long;
      // A written contract's market value is negative: the liability, signed as the positions
      // table shows it. Clamping it to 0 alone is how a sold put read "Options $0" (#4948).
      optionsSold += Math.min(0, p.marketValue);
      // Whether one is written comes from the position's sign, not the summed value: a contract
      // marked at 0 (no quote, or worthless near expiry) is still owed, never "Options $0".
      if (p.quantity < 0 || p.marketValue < 0) anySold = true;
    } else {
      shares += long;
      shareCount += p.quantity;
    }
  }
  const cash = Math.max(0, snapshot.cash);
  const total = shares + options + cash;
  const share = (x: number) => (total > 0 ? (x / total) * 100 : 0);
  return {
    shares: formatCurrency(shares),
    options: formatCurrency(options),
    // Rounded first, so a liability under 50 cents reads "$0" rather than "-$0".
    ...(anySold ? { optionsSold: formatCurrency(Math.round(optionsSold) || 0) } : {}),
    cash: formatCurrency(snapshot.cash),
    sharesPct: share(shares),
    optionsPct: share(options),
    cashPct: share(cash),
    cashShare: `${share(cash).toFixed(1)}%`,
    shareCount,
  };
}
