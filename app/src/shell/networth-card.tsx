import { type ReactElement, type ReactNode, useMemo } from "react";
import type { NetWorthStatsView } from "../live/networth";
import { FormStrip } from "./form-strip";
import { GlossaryTerm } from "./glossary-term";
import { HeroChart } from "./hero-chart";
import { StandingLine } from "./standing-line";

/**
 * THE NET-WORTH CARD (#3689 slice 3, design handoff 3a): the Overview's first answer, "am I
 * winning". Left column: what's locked in versus on paper, and each window's return with how it
 * did against the S&P 500. Right: the equity chart with the all-time high drawn as a dashed line.
 * Footer: the gap to a new high as a meter. The Form strip (last N closed trades) joins the footer
 * in a later slice.
 *
 * The value and what moved today ride the Profile head's vitals line on every section now (#5072,
 * Level 2 of #5037 round 2 — round 1's pick B: "the net-worth card drops its own big number
 * because the head carries it"), so the card never says them a second time.
 *
 * The standing line (#3964, `docs/IA.md` §5.1) closes the card's own question with the member's
 * record — win rate, profit factor, max drawdown — and one link to the rest of that account's
 * Pulse. Only for a single account: a win rate summed across books whose trades never met is not
 * one record, the same reason the chart and the all-time high sit out "All accounts".
 *
 * On "All accounts" there's no single equity curve or high to draw (a sum of per-account highs set
 * on different days was never the book's high), so the card is the left column alone and the
 * roster below carries the per-account detail. Every figure is server-formatted; the only
 * arithmetic here is the meter's fill, which is geometry, not a figure anyone reads.
 */

function Stat({
  label,
  value,
  tone,
}: {
  readonly label: ReactElement | string;
  readonly value: string;
  readonly tone: string;
}): ReactElement {
  return (
    <div className="nw-stat">
      <span className="nw-stat-label">{label}</span>
      <span className={`nw-stat-value num tone-${tone}`}>{value}</span>
    </div>
  );
}

/**
 * The card's footer: the Form strip, then the gap to a new high in words with the meter as its
 * picture. Its own component so the card's body stays under the complexity cap (#3964) — this is
 * the block that branches most, and it branches on two things only: whether one account is in view
 * and whether its all-time high is known.
 */
function CardFoot({
  accountId,
  toNewHigh,
  toHigh,
}: {
  readonly accountId: string | undefined;
  readonly toNewHigh: string | undefined;
  /** The fill fraction, present only when the all-time high is known. */
  readonly toHigh: number | undefined;
}): ReactElement | null {
  if (!accountId && toHigh === undefined) return null;
  return (
    <div className="nw-foot">
      {accountId ? <FormStrip accountId={accountId} /> : null}
      {/* one unit, so a wrapping footer never parts the words from their meter */}
      {toHigh === undefined ? null : (
        <span className="nw-high">
          {toNewHigh ? (
            <span className="nw-to-high">
              To a new high <b className="num">{toNewHigh}</b>
            </span>
          ) : (
            <span className="nw-to-high nw-at-high">At a new high ✦</span>
          )}
          {/* the words beside it carry the gap; the meter is its picture */}
          <span className="nw-meter" aria-hidden="true">
            <span className="nw-meter-fill" style={{ width: `${(toHigh * 100).toFixed(1)}%` }} />
          </span>
        </span>
      )}
    </div>
  );
}

export function NetWorthCard({
  stats,
  caption,
  accountId,
  children,
}: {
  readonly stats: NetWorthStatsView;
  readonly caption: string;
  /** The single account whose curve to chart; omitted for the "All accounts" book. */
  readonly accountId?: string;
  /** A full-width row under the footer — the Overview seats "where your money is" here (#3725). */
  readonly children?: ReactNode;
}): ReactElement {
  const high = stats.allTimeHigh;
  const highLine = useMemo(
    () =>
      high ? { label: `your high ${high.value} · ${high.at}`, aboveNow: high.aboveNow } : undefined,
    [high],
  );
  const toHigh = high ? 1 / (1 + high.aboveNow) : undefined;
  // The phone's one line (#3689 slice 8, handoff 3b): this month, and the month against the S&P
  // (today rides the head). The stats, windows table, chart and footer stay on wider screens.
  const month = stats.windows.find((w) => w.label === "1M" && w.known);

  return (
    <section
      className={accountId ? "nw-card" : "nw-card nw-card--solo"}
      aria-label={`Net worth · ${caption}`}
    >
      <div className="nw-main">
        <span className="nw-eyebrow">Net worth · {caption}</span>
        {month ? (
          <p className="nw-phone-line">
            <span className={`num tone-${month.tone}`}>{month.value}</span> this month
            {month.vsBenchmark ? (
              <>
                {" · "}
                <span className={`num tone-${month.vsBenchmarkTone ?? "flat"}`}>
                  {month.vsBenchmark}
                </span>
              </>
            ) : null}
          </p>
        ) : null}
        <div className="nw-stats">
          <Stat
            label={<GlossaryTerm term="lockedIn" />}
            value={stats.bookedPl}
            tone={stats.bookedTone}
          />
          <Stat
            label={<GlossaryTerm term="onPaper" />}
            value={stats.onPaper}
            tone={stats.onPaperTone}
          />
        </div>
        <table className="nw-windows">
          <caption className="visually-hidden">Return by window, against the S&amp;P 500</caption>
          <tbody>
            {stats.windows.map((w) => (
              <tr key={w.label} className={w.partial ? "is-partial" : undefined}>
                <th scope="row">{w.label}</th>
                <td className={`num tone-${w.tone}`}>{w.value}</td>
                <td className={`num tone-${w.partial ? "flat" : (w.vsBenchmarkTone ?? "flat")}`}>
                  {w.vsBenchmark ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {accountId ? (
        <div className="nw-chart">
          <HeroChart accountId={accountId} high={highLine} />
        </div>
      ) : null}
      <CardFoot accountId={accountId} toNewHigh={stats.toNewHigh} toHigh={toHigh} />
      {accountId ? <StandingLine accountId={accountId} /> : null}
      {children}
    </section>
  );
}
