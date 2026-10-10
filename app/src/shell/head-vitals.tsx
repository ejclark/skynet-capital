import type { CSSProperties, ReactElement } from "react";
import type { NetWorthStatsView, Tone } from "../live/networth";
import { useMediaQuery } from "./use-media";
import { PHONE_QUERY } from "./widths";

/**
 * THE HEAD'S VITALS (#5072 — #5037 round 2, Level 2): the three numbers that matter on every
 * section of the Profile page, said once, in the sticky head, at one height. Eric, on Level 2: "I
 * really liked reducing down to the primary content. What if we further organized the data
 * groupings to include the most relevant dimensions that overlap/intersect across various views to
 * tell the most information with minimal content". The dimensions that cut across every section
 * are the account's worth, how it moved today, and how much of it is cash — so the vitals are
 * those three and nothing else; the month, the S&P and the record stay with the Overview.
 *
 * TWO FORMS, one per width (#5100 — round 2's question 7, R2). Eric: "I like the mobile design
 * Option R2 with the graph on the second row. I do not like the desktop version as much as the
 * mobile."
 *   - A PHONE draws the number's line, then the cash bar across the head's whole width on a row of
 *     its own, then each part's amount under its end: "▮ $34,166 invested · ▨ $962,800 ready to
 *     use · 96.6%". The amounts are the point — at a glance, how much of this account is idle and
 *     roughly how much.
 *   - A WIDER HEAD keeps the compact line it had: a short bar beside the number with the cash
 *     amount and its share, "$962,800 · 96.6% cash".
 *
 * Every figure is the server's (`/api/accounts/networth`): the day move arrives as "amount ·
 * percent", which this only splits for placement; the cash share is the server's own number (cash
 * over net worth, `idlePct`), printed to one place, and `invested` is its dollar complement. The bar
 * is one whole in two parts — invested solid, cash hatched — told apart by pattern and words, never
 * by hue (a standing reader is red/green colourblind), and each part's words carry that part's own
 * pattern as a swatch. The invested part keeps a minimum width so a 96% cash book still shows a
 * sliver of what is working — and none at all when nothing is, when its words lose their swatch
 * too (nothing in the bar is solid). A book whose sold options outweigh what it holds is "-$550 in
 * positions", never a negative "invested"; a negative cash balance is "cash", never "ready to use".
 * @category accounts
 */

const DAY_GLYPH: Record<Tone, string> = { pos: "▲", neg: "▼", flat: "" };

/** "+$1,951 · +0.20%" → ["+$1,951", "+0.20%"]; a lone amount or "—" comes back whole. */
function splitDayChange(text: string): readonly [string, string | undefined] {
  const at = text.indexOf(" · ");
  return at < 0 ? [text, undefined] : [text.slice(0, at), text.slice(at + 3)];
}

/** A server-formatted amount below zero ("-$550"): the words change, the figure never does. */
const negative = (amount: string | undefined): boolean => amount?.startsWith("-") ?? false;

/** One whole in two parts — the invested part at its share, the cash part hatched. */
function CashBar({ idlePct }: { readonly idlePct: number }): ReactElement {
  const invested = { "--invested": `${(100 - idlePct).toFixed(1)}%` } as CSSProperties;
  return (
    <span
      className="head-cash-bar"
      style={invested}
      data-all-cash={idlePct >= 100 || undefined}
      aria-hidden="true"
    >
      <span className="head-cash-in" />
      <span className="head-cash-idle" />
    </span>
  );
}

/** A wider head's form: a short bar, then the cash amount and its share, beside the number. */
function CompactCash({ stats }: { readonly stats: NetWorthStatsView }): ReactElement {
  if (stats.idlePct === undefined) {
    return (
      <span className="head-cash">
        {stats.cashKnown ? <b className="num">{stats.cash}</b> : "—"} cash
      </span>
    );
  }
  const share = stats.idlePct.toFixed(1);
  return (
    <span className="head-cash" title={`${stats.cash} cash · ${share}% of net worth`}>
      <CashBar idlePct={stats.idlePct} />
      {stats.cashKnown ? <span className="head-cash-amount num">{stats.cash} · </span> : null}
      <b className="num">{share}%</b> cash
    </span>
  );
}

/** A phone's form: the bar on its own row, each part's amount under its end. */
function CashSplit({ stats }: { readonly stats: NetWorthStatsView }): ReactElement {
  if (stats.idlePct === undefined) {
    // No share to draw: the cash still says itself, where the bar's words go, at the same height.
    return (
      <div className="head-split">
        <p className="head-split-words">
          <span className="head-split-idle">
            {stats.cashKnown ? <b className="num">{stats.cash}</b> : "—"} cash
          </span>
        </p>
      </div>
    );
  }
  const drawsInvested = stats.idlePct < 100;
  const drawsCash = stats.idlePct > 0;
  return (
    <div className="head-split">
      <CashBar idlePct={stats.idlePct} />
      <p className="head-split-words">
        {stats.invested !== undefined ? (
          <span className="head-split-in">
            {drawsInvested ? (
              <span className="head-swatch head-swatch--in" aria-hidden="true" />
            ) : null}
            <b className="num">{stats.invested}</b>{" "}
            {negative(stats.invested) ? "in positions" : "invested"}
          </span>
        ) : null}
        <span className="head-split-idle">
          {drawsCash ? <span className="head-swatch head-swatch--idle" aria-hidden="true" /> : null}
          <b className="num">{stats.cash}</b> {negative(stats.cash) ? "cash" : "ready to use"} ·{" "}
          <span className="num">{stats.idlePct.toFixed(1)}%</span>
        </span>
      </p>
    </div>
  );
}

export function HeadVitals({
  stats,
  loading,
  error,
}: {
  readonly stats: NetWorthStatsView | null;
  readonly loading: boolean;
  readonly error: boolean;
}): ReactElement {
  const phone = useMediaQuery(PHONE_QUERY);
  if (!stats) {
    return (
      <p className="head-vitals head-vitals--note">
        {loading
          ? "Reading your net worth…"
          : error
            ? "Net worth is unreachable right now."
            : "No net worth to show yet."}
      </p>
    );
  }
  const [amount, percent] = splitDayChange(stats.dayChange);
  const glyph = stats.dayKnown ? DAY_GLYPH[stats.dayTone] : "";
  // The `{" "}`s are for a screen reader's sentence; the line's gap does the spacing on screen.
  const numbers = (
    <>
      <span className="visually-hidden">Net worth </span>
      <span className="head-worth num">{stats.value}</span>{" "}
      <span className={`head-day num tone-${stats.dayTone}`}>
        {glyph ? <span aria-hidden="true">{glyph} </span> : null}
        {amount}
      </span>{" "}
      <span className="head-day-word">
        today{percent ? <span className="head-day-pct num"> ({percent})</span> : null}
      </span>
    </>
  );
  if (phone) {
    return (
      <div className="head-vitals" data-split="">
        <p className="head-vitals-line">{numbers}</p>
        <CashSplit stats={stats} />
      </div>
    );
  }
  return (
    <p className="head-vitals">
      {numbers} <CompactCash stats={stats} />
    </p>
  );
}
