import type { CSSProperties, ReactElement } from "react";
import type { NetWorthStatsView, Tone } from "../live/networth";

/**
 * THE HEAD'S ONE VITALS LINE (#5072 — #5037 round 2, Level 2): the three numbers that matter on
 * every section of the Profile page, said once, in the sticky head, at one height. Eric, on
 * Level 2: "I really liked reducing down to the primary content. What if we further organized the
 * data groupings to include the most relevant dimensions that overlap/intersect across various
 * views to tell the most information with minimal content". The dimensions that cut across every
 * section are the account's worth, how it moved today, and how much of it is cash — so the line is
 * those three and nothing else; the month, the S&P and the record stay with the Overview.
 *
 * Every figure is the server's (`/api/accounts/networth`): the day move arrives as "amount ·
 * percent", which this only splits for placement. The cash share is the server's own number
 * (cash over net worth, `idlePct`), printed to one place; the bar beside it is its picture — one
 * whole in two parts, invested solid and cash hatched, told apart by pattern and the word "cash",
 * never by hue (a standing reader is red/green colourblind). The invested part keeps a minimum
 * width so a 96% cash book still shows a sliver of what is working — and none at all when nothing
 * is. A wider head adds the cash amount beside the share; the phone keeps the share.
 * @category accounts
 */

const DAY_GLYPH: Record<Tone, string> = { pos: "▲", neg: "▼", flat: "" };

/** "+$1,951 · +0.20%" → ["+$1,951", "+0.20%"]; a lone amount or "—" comes back whole. */
function splitDayChange(text: string): readonly [string, string | undefined] {
  const at = text.indexOf(" · ");
  return at < 0 ? [text, undefined] : [text.slice(0, at), text.slice(at + 3)];
}

function CashPart({ stats }: { readonly stats: NetWorthStatsView }): ReactElement {
  if (stats.idlePct === undefined) {
    return (
      <span className="head-cash">
        {stats.cashKnown ? <b className="num">{stats.cash}</b> : "—"} cash
      </span>
    );
  }
  const share = stats.idlePct.toFixed(1);
  const invested = { "--invested": `${(100 - stats.idlePct).toFixed(1)}%` } as CSSProperties;
  return (
    <span className="head-cash" title={`${stats.cash} cash · ${share}% of net worth`}>
      <span
        className="head-cash-bar"
        style={invested}
        data-all-cash={stats.idlePct >= 100 || undefined}
        aria-hidden="true"
      >
        <span className="head-cash-in" />
        <span className="head-cash-idle" />
      </span>
      {/* the amount where a wider head has room; a phone keeps the share */}
      {stats.cashKnown ? <span className="head-cash-amount num">{stats.cash} · </span> : null}
      <b className="num">{share}%</b> cash
    </span>
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
  return (
    <p className="head-vitals">
      <span className="visually-hidden">Net worth </span>
      <span className="head-worth num">{stats.value}</span>{" "}
      <span className={`head-day num tone-${stats.dayTone}`}>
        {glyph ? <span aria-hidden="true">{glyph} </span> : null}
        {amount}
      </span>{" "}
      <span className="head-day-word">
        today{percent ? <span className="head-day-pct num"> ({percent})</span> : null}
      </span>{" "}
      <CashPart stats={stats} />
    </p>
  );
}
