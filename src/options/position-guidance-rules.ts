import { CHEAP_IV_RANK, RICH_IV_RANK } from "./outlook.js";
import type {
  Confidence,
  DteMark,
  EarningsWindow,
  GuidanceCatalyst,
  GuidanceQuote,
  GuidanceStake,
  PulseItem,
  PulseStatus,
  Richness,
} from "./position-guidance-types.js";

/**
 * THE GUIDANCE RULES — every threshold in one place, each with the reason it exists (#3729). The
 * rule ids are what a guidance read's "why" lines cite, so a reader can trace any call back to a line here.
 * PURE: no I/O, no clock.
 */

/** DTE-FLOOR: under a week, the premium stops beating the bid/ask toll plus pin and gamma risk. */
export const MIN_DTE = 7;

/** STRIKE rules: a short strike further than this delta is a coin flip dressed as income. */
export const MAX_SHORT_DELTA = 0.3;

/** PRICE-AT-BID: a quote this wide gives most of the premium back to the market maker. */
export const MAX_SPREAD_OF_MID = 0.15;

/** PRICE-AT-BID: under a dime, commissions and the spread eat the trade. */
export const MIN_BID = 0.1;

/** RICHNESS, while IV history is short: implied ÷ realized. ≥ this, premium pays for the movement. */
export const RICH_IV_TO_RV = 1.2;
/** Below 1, the market charges less than the stock actually moves — selling it is underpaid. */
export const CHEAP_IV_TO_RV = 1.0;

/** In session, a strike quoted longer ago than this is not a price anyone can sell at. */
export const QUOTE_STALE_MS = 15 * 60 * 1000;

/** Liquidity floor: fewer contracts open than this and the quote is a number nobody trades against. */
export const MIN_OPEN_INTEREST = 100;

/** Richness compares like with like: IV from the expiry nearest this many days, not the nearest weekly. */
export const RICHNESS_TARGET_DAYS = 25;

/** Feed-delta vs our-delta disagreement worth flagging as a data-quality problem. */
export const DELTA_TOLERANCE = 0.05;

/** Sessions before the print window that the hold/flat decision falls due (S1's D-5 dead zone). */
export const DECISION_SESSIONS_BEFORE_PRINT = 5;

/** Ladder rows kept per expiry, per lever. */
export const LADDER_DEPTH = 3;

export const GUIDANCE_DISCLOSURE =
  "Educational, not financial advice. Option prices here are estimates; the trade form re-checks " +
  "live prices before any order. Chances come from a standard pricing model that assumes no sudden jumps.";

const RANK: Readonly<Record<Confidence, number>> = { none: 0, low: 1, medium: 2, high: 3 };

/** The lower of two grades — a cap never raises a call. */
export function capConfidence(grade: Confidence, cap: Confidence): Confidence {
  return RANK[grade] <= RANK[cap] ? grade : cap;
}

/** The house rule: a low grade is a stand-aside, never a small bet. */
export function actionable(grade: Confidence): boolean {
  return RANK[grade] >= RANK.medium;
}

/** The ET calendar date (YYYY-MM-DD) of an instant — the whole market day is anchored on ET. */
export function etDateOf(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

/** Whole calendar days between two YYYY-MM-DD dates (negative = `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Step back `sessions` weekdays from `date` (exchange holidays are not modelled — stated, not hidden). */
export function weekdaysBefore(date: string, sessions: number): string {
  const at = new Date(`${date}T00:00:00Z`);
  let left = sessions;
  while (left > 0) {
    at.setUTCDate(at.getUTCDate() - 1);
    const day = at.getUTCDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return at.toISOString().slice(0, 10);
}

/**
 * The last expiry options may be sold on, given the goal. An option must never outlive the
 * decision the SHARES row asks for: if "decide whether to hold through earnings" falls due on
 * Nov 2, a call expiring Nov 6 is still open on the day the member may sell the shares under it.
 * So for every goal but keep-shares, options stop at the decision date; keep-shares (the member
 * has already chosen to hold through) may sell right up to the earnings window.
 */
export function optionsCutoff(
  earnings: EarningsWindow | undefined,
  goal: string | undefined,
): { readonly date: string; readonly kind: "decision" | "window" } | undefined {
  if (!earnings) return undefined;
  return goal === "keep-shares"
    ? { date: earnings.start, kind: "window" }
    : { date: weekdaysBefore(earnings.start, DECISION_SESSIONS_BEFORE_PRINT), kind: "decision" };
}

/**
 * DTE-PRINT + DTE-FLOOR: mark every listed expiry in or out. An expiry on or after the print
 * window's START spans the print — this name's own research may show its options underprice the
 * move (the "options underprice CRWV's earnings moves" forward test: Q2 implied ~15.5% vs ~18.6%
 * realized), so premium sold across a print is underpriced insurance. An expiry after the
 * decision date (`optionsCutoff`) outlives the hold-or-sell decision and is out too. Catalysts
 * before an expiry are a warning, never an exclusion.
 */
export function dteStrip(
  expirations: readonly string[],
  today: string,
  earnings: EarningsWindow | undefined,
  catalysts: readonly GuidanceCatalyst[],
  goal?: string,
): DteMark[] {
  const cutoff = optionsCutoff(earnings, goal);
  return [...new Set(expirations)].sort().flatMap((expiration) => {
    const dte = daysBetween(today, expiration);
    if (dte < 0) return [];
    const verdict =
      earnings && expiration >= earnings.start
        ? "spans-print"
        : cutoff?.kind === "decision" && expiration > cutoff.date
          ? "after-decision"
          : dte < MIN_DTE
            ? "too-short"
            : "in";
    const hits = catalysts
      .filter((c) => c.date >= today && c.date <= expiration)
      .map((c) => `${c.label} (${dayText(c.date)})`);
    return [{ expiration, dte, verdict, catalysts: hits }];
  });
}

/**
 * The expiry richness reads IV from: the usable one nearest `RICHNESS_TARGET_DAYS`. The nearest
 * weekly carries event premium and gamma that a 20-session realized vol has nothing to compare to.
 */
export function richnessExpiry(
  marks: readonly { readonly expiration: string; readonly dte: number }[],
): string | undefined {
  return [...marks].sort(
    (a, b) =>
      Math.abs(a.dte - RICHNESS_TARGET_DAYS) - Math.abs(b.dte - RICHNESS_TARGET_DAYS) ||
      a.dte - b.dte,
  )[0]?.expiration;
}

/** The at-the-money IV of the nearest in-band expiry: the mean IV of the strikes closest to spot. */
export function atmIv(
  chain: readonly GuidanceQuote[],
  spot: number,
  expiration: string | undefined,
): number | undefined {
  if (!expiration) return undefined;
  const row = chain.filter((q) => q.expiration === expiration && q.iv !== undefined && q.iv > 0);
  if (row.length === 0) return undefined;
  const nearest = Math.min(...row.map((q) => Math.abs(q.strike - spot)));
  const atm = row.filter((q) => Math.abs(q.strike - spot) === nearest);
  return atm.reduce((sum, q) => sum + (q.iv ?? 0), 0) / atm.length;
}

/**
 * RICHNESS: IV rank when the instrument has a full window, else implied ÷ realized — which needs
 * no history at all and asks the question that matters to a seller: does the premium pay for how
 * much this stock actually moves?
 */
export function richnessOf(
  ivRank: number | undefined,
  atm: number | undefined,
  realizedVol: number | undefined,
): Richness {
  if (ivRank !== undefined && Number.isFinite(ivRank)) {
    const verdict =
      ivRank >= RICH_IV_RANK ? "rich" : ivRank <= CHEAP_IV_RANK ? "cheap" : "middling";
    return { verdict, basis: "iv-rank", ivRank, atmIv: atm, realizedVol };
  }
  if (atm !== undefined && realizedVol !== undefined && realizedVol > 0) {
    const ratio = atm / realizedVol;
    const verdict = ratio >= RICH_IV_TO_RV ? "rich" : ratio < CHEAP_IV_TO_RV ? "cheap" : "middling";
    return { verdict, basis: "iv-vs-realized", atmIv: atm, realizedVol };
  }
  return { verdict: "unknown", basis: "none", atmIv: atm, realizedVol };
}

/**
 * How richness caps a WRITE. Without IV rank the read is a proxy, so it can never grade high — and
 * only a RICH proxy reading (IV ÷ realized ≥ RICH_IV_TO_RV) licenses selling at all: a middling
 * ratio caps low, which is a stand-aside. Otherwise the 1.2 threshold would change nothing, since
 * 1.1 and 1.3 would both grade medium.
 */
export function richnessCap(richness: Richness): Confidence {
  if (richness.basis === "iv-rank") return richness.verdict === "middling" ? "medium" : "high";
  if (richness.basis === "iv-vs-realized") return richness.verdict === "rich" ? "medium" : "low";
  return "low";
}

/** The status of one pulse input, or `fresh` when the server did not report it. */
export function pulseOf(pulse: readonly PulseItem[], id: PulseItem["id"]): PulseItem | undefined {
  return pulse.find((p) => p.id === id);
}

export const pct = (x: number, digits = 0): string => `${(x * 100).toFixed(digits)}%`;
export const usd = (x: number): string =>
  `$${x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The headline strike's target |delta| — the band income sellers actually use (≈ 1-in-5 odds). */
export const HEADLINE_DELTA = 0.2;
/** Prefer at least three weeks: time decay is fastest relative to risk from here out (≤ the print cap). */
export const HEADLINE_MIN_DTE = 21;

/** Display names, in the guidance's fixed lever order. */
export const LEVER_NAME = {
  shares: "Shares",
  "covered-calls": "Covered calls",
  "cash-secured-puts": "Cash-secured puts",
} as const;

/** The plain words a member reads for each machine call. */
export const CALL_WORDS: Readonly<Record<string, string>> = {
  WRITE: "Reasonable now",
  WAIT: "Wait",
  "NOT AVAILABLE": "Not available",
  "NO ANSWER": "No answer",
  BUY: "Buy",
  HOLD: "Hold",
  SELL: "Sell",
  DECIDE: "Decide",
  "STAND ASIDE": "Stand aside",
};

/** How good option prices are for a seller, in plain words (for "what changed"). */
export const RICHNESS_WORDS: Readonly<Record<string, string>> = {
  rich: "paying well",
  middling: "about average",
  cheap: "paying poorly",
  unknown: "unknown",
};

/** The member's goal, in plain words. */
export const GOAL_WORDS: Readonly<Record<string, string>> = {
  income: "earn income",
  "keep-shares": "keep the shares",
  exit: "exit",
};

/** What each freshness check is about, in plain words. */
export const PULSE_WORDS: Readonly<Record<string, string>> = {
  spot: "Stock price",
  chain: "Option prices",
  research: "Research",
  "earnings-date": "Earnings date",
  filings: "Company filings",
  session: "Market hours",
};

/** Confidence as a shape — hue never carries it alone (CLAUDE.md, colourblind reader). */
export const DOTS: Readonly<Record<Confidence, string>> = {
  high: "●●●",
  medium: "●●○",
  low: "●○○",
  none: "○○○",
};

/** Freshness as a glyph, always beside its word. */
export const PULSE_MARK: Readonly<Record<PulseStatus, string>> = {
  fresh: "✓",
  aging: "~",
  stale: "✕",
};

/** Each expiry verdict, glyph first. */
export const DTE_WORD = {
  in: "✓ usable",
  "too-short": "✕ under 7 days",
  "after-decision": "✕ after your hold-or-sell date",
  "spans-print": "✕ crosses earnings",
} as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * A date as a member reads it: "2026-10-16" → "Oct 16". Every sentence the guidance writes uses
 * this; the ISO form stays in the structured fields (`until.date`, `expiration`) for sorting and
 * links. Persona review (#3729): four date formats on one screen read as four different things.
 */
export function dayText(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return m && d ? `${MONTHS[m - 1]} ${d}` : iso;
}

/** A span of days: "Nov 9–16" within a month, "Oct 30–Nov 2" across one. */
export function spanText(start: string, end: string): string {
  if (start === end) return dayText(start);
  return start.slice(0, 7) === end.slice(0, 7)
    ? `${dayText(start)}–${Number(end.slice(8))}`
    : `${dayText(start)}–${dayText(end)}`;
}

/**
 * 100-share lots still free to sell a call against: every lot minus the calls already open on it
 * (#3729 step 4b). Counting all lots would offer a call on shares already promised — a naked call
 * in all but name, which this desk never sells.
 */
export function coverableLots(stake: GuidanceStake): number {
  const open = (stake.openCalls ?? []).reduce((n, c) => n + c.contracts, 0);
  return Math.max(0, Math.floor((stake.shares ?? 0) / 100) - Math.max(stake.callsSold ?? 0, open));
}

/**
 * The lowest strike a covered call may sit at: what the member paid per share, less the premium
 * already collected on the position (spread over its shares). Selling at this floor breaks even
 * on the whole position, premiums included — the plan's "basis minus premiums".
 */
export function strikeFloor(stake: GuidanceStake): number | undefined {
  const { costBasis, premiumsCollected, shares } = stake;
  if (costBasis === undefined) return undefined;
  return premiumsCollected && shares ? costBasis - premiumsCollected / shares : costBasis;
}
