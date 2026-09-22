import { formatCurrency, formatSigned, pct, plClass } from "./render-atoms.js";

/**
 * NET WORTH AS DATA — `/api/accounts/networth`, the JSON view behind the Accounts page's Summary
 * section. The session's OWN accounts only (the route resolves ownership, never the client), each
 * carrying total equity, the day's move, and flow-adjusted ROI over four windows (7D/1M/3M/1Y), plus
 * an aggregate "all accounts" total. Same doctrine as every other observatory view: every displayed
 * value arrives here as a formatted string, so the browser renders and never re-derives a figure.
 *
 * The windows' returns come straight from Alpaca's own `/v2/account/portfolio/history`
 * (`profit_loss_pct` — Alpaca's flow-adjusted cumulative return, so a mid-window deposit never reads
 * as a gain); the aggregate per window is `Σend / Σbase − 1` across the accounts that reported one,
 * which is the same flow-adjusted return lifted to the book level. An account that didn't report a
 * window (broker unreachable, account too new) is honestly excluded and the window marked `partial`
 * rather than silently shrinking the denominator — the same honesty the desk's "needs a closed trade"
 * seams use.
 */

export type Tone = "pos" | "neg" | "flat";

export type NetWorthWindowKey = "7D" | "1M" | "3M" | "1Y";

export const NET_WORTH_WINDOWS: readonly {
  readonly key: NetWorthWindowKey;
  readonly label: string;
  readonly note: string;
}[] = [
  { key: "7D", label: "7D", note: "the last week" },
  { key: "1M", label: "1M", note: "the last month" },
  { key: "3M", label: "3M", note: "the last quarter" },
  { key: "1Y", label: "1Y", note: "the last year" },
];

/** One window's flow-adjusted return for a single account. `returnFraction` is Alpaca's
 *  `profit_loss_pct` (a fraction: `0.0123` = 1.23%); `base`/`end` are the window's start/end equity
 *  from the same history call, carried only so the aggregate can sum them — never for display. */
export interface NetWorthWindowInput {
  readonly returnFraction?: number;
  readonly base?: number;
  readonly end?: number;
}

export interface AccountNetWorthInput {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  /** Current equity (snapshot). Omitted when the account read errored — the row renders "—". */
  readonly equity?: number;
  readonly cash?: number;
  readonly positionCount: number;
  /** Equity at the previous trading day's close — omitted when unknown, so the day move is "—". */
  readonly lastEquity?: number;
  /** Present when the account read failed; the row carries the honest reason and is excluded from totals. */
  readonly error?: string;
  readonly windows: Record<NetWorthWindowKey, NetWorthWindowInput>;
}

export interface NetWorthWindowView {
  readonly label: string;
  readonly note: string;
  /** "+1.23%" or "—" when no reporting account had data for this window. */
  readonly value: string;
  readonly tone: Tone;
  readonly known: boolean;
  /** True on an aggregate window computed over a SUBSET of live accounts — the note says so. */
  readonly partial?: boolean;
}

export interface NetWorthStatsView {
  readonly value: string;
  readonly valueKnown: boolean;
  /** "+$1,230 · +0.45%" or "—" when the day's move isn't known. */
  readonly dayChange: string;
  readonly dayTone: Tone;
  readonly dayKnown: boolean;
  readonly cash: string;
  readonly cashKnown: boolean;
  readonly positionCount: number;
  readonly windows: readonly NetWorthWindowView[];
}

export interface AccountNetWorthView extends NetWorthStatsView {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly error?: string;
}

export interface AccountsNetWorthView {
  readonly generatedAt: string;
  readonly accounts: readonly AccountNetWorthView[];
  /** The "all accounts" aggregate. `null` only when every owned account errored. */
  readonly total: NetWorthStatsView | null;
}

function windowView(
  input: NetWorthWindowInput | undefined,
  label: string,
  note: string,
): NetWorthWindowView {
  const r = input?.returnFraction;
  if (r === undefined || !Number.isFinite(r)) {
    return { label, note, value: "—", tone: "flat", known: false };
  }
  return { label, note, value: pct(r * 100), tone: plClass(r), known: true };
}

/** The day move as one "amount · percent" string, or "—" when the previous close isn't known. */
function dayChangeView(
  equity: number,
  lastEquity: number,
): { readonly text: string; readonly tone: Tone } {
  const move = equity - lastEquity;
  const pctVal = lastEquity !== 0 ? (move / lastEquity) * 100 : 0;
  return { text: `${formatSigned(move)} · ${pct(pctVal)}`, tone: plClass(move) };
}

/** An all-empty window map — the shape an errored account renders with, so every window reads "—". */
function emptyWindowsInput(): Record<NetWorthWindowKey, NetWorthWindowInput> {
  return { "7D": {}, "1M": {}, "3M": {}, "1Y": {} };
}

/** One account's stats — the per-account row and (via `aggregateStats`) the total share this shape. */
export function netWorthStatsView(input: {
  readonly equity?: number;
  readonly cash?: number;
  readonly positionCount: number;
  readonly lastEquity?: number;
  readonly windows: Record<NetWorthWindowKey, NetWorthWindowInput>;
}): NetWorthStatsView {
  const valueKnown = typeof input.equity === "number";
  const cashKnown = typeof input.cash === "number";
  const dayKnown = valueKnown && typeof input.lastEquity === "number" && input.lastEquity !== 0;
  const day = dayKnown
    ? dayChangeView(input.equity as number, input.lastEquity as number)
    : undefined;
  return {
    value: valueKnown ? formatCurrency(input.equity as number) : "—",
    valueKnown,
    dayChange: day ? day.text : "—",
    dayTone: day ? day.tone : "flat",
    dayKnown,
    cash: cashKnown ? formatCurrency(input.cash as number) : "—",
    cashKnown,
    positionCount: input.positionCount,
    windows: NET_WORTH_WINDOWS.map((w) => windowView(input.windows[w.key], w.label, w.note)),
  };
}

/** The "all accounts" aggregate — sums equity/cash/positions, and lifts each window's flow-adjusted
 *  return to the book level as `Σend / Σbase − 1` over the accounts that reported it. */
function aggregateStats(live: readonly AccountNetWorthInput[]): NetWorthStatsView {
  const totalEquity = live.reduce((sum, a) => sum + (a.equity ?? 0), 0);
  const totalCash = live.reduce((sum, a) => sum + (a.cash ?? 0), 0);
  const positionCount = live.reduce((sum, a) => sum + a.positionCount, 0);
  // The day move is known only when EVERY live account knows its previous close — one unknown
  // account makes a partial sum misstate the book, so the honest answer is "—".
  const dayKnown = live.every((a) => typeof a.lastEquity === "number" && a.lastEquity !== 0);
  const totalLast = dayKnown ? live.reduce((sum, a) => sum + (a.lastEquity as number), 0) : 0;
  const day = dayKnown ? dayChangeView(totalEquity, totalLast) : undefined;
  const windows: NetWorthWindowView[] = NET_WORTH_WINDOWS.map((w) => {
    const reporting = live.filter((a) => {
      const win = a.windows[w.key];
      return (
        win?.returnFraction !== undefined &&
        Number.isFinite(win.returnFraction) &&
        typeof win.base === "number" &&
        win.base > 0 &&
        typeof win.end === "number"
      );
    });
    if (reporting.length === 0) {
      return { label: w.label, note: w.note, value: "—", tone: "flat", known: false };
    }
    const sumBase = reporting.reduce((sum, a) => sum + (a.windows[w.key].base as number), 0);
    const sumEnd = reporting.reduce((sum, a) => sum + (a.windows[w.key].end as number), 0);
    const r = sumBase > 0 ? sumEnd / sumBase - 1 : 0;
    return {
      label: w.label,
      note: w.note,
      value: pct(r * 100),
      tone: plClass(r),
      known: true,
      ...(reporting.length < live.length ? { partial: true } : {}),
    };
  });
  return {
    value: formatCurrency(totalEquity),
    valueKnown: true,
    dayChange: day ? day.text : "—",
    dayTone: day ? day.tone : "flat",
    dayKnown,
    cash: formatCurrency(totalCash),
    cashKnown: true,
    positionCount,
    windows,
  };
}

/** Build the full `/api/accounts/networth` payload from per-account inputs. */
export function accountsNetWorthView(
  generatedAt: string,
  inputs: readonly AccountNetWorthInput[],
): AccountsNetWorthView {
  const accounts: AccountNetWorthView[] = inputs.map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    ...(a.error ? { error: a.error } : {}),
    // An errored account renders "—" throughout regardless of what equity it carries — the route
    // already omits equity on error, but the view stays self-consistent even if a caller doesn't.
    ...netWorthStatsView(
      a.error
        ? {
            equity: undefined,
            cash: undefined,
            positionCount: a.positionCount,
            lastEquity: undefined,
            windows: emptyWindowsInput(),
          }
        : a,
    ),
  }));
  const live = inputs.filter((a) => a.error === undefined && typeof a.equity === "number");
  return {
    generatedAt,
    accounts,
    total: live.length === 0 ? null : aggregateStats(live),
  };
}
