import { type ReactElement, type ReactNode, useMemo } from "react";
import type { NetWorthStatsView } from "../live/networth";
import { FormStrip } from "./form-strip";
import { GlossaryTerm } from "./glossary-term";
import { HeroChart } from "./hero-chart";

/**
 * THE NET-WORTH CARD (#3689 slice 3, design handoff 3a): the Overview's first answer, "am I
 * winning". Left column: the value, what moved today, what's locked in versus on paper, and each
 * window's return with how it did against the S&P 500. Right: the equity chart with the all-time
 * high drawn as a dashed line. Footer: the gap to a new high as a meter. The Form strip (last N
 * closed trades) joins the footer in a later slice.
 *
 * On "All accounts" there's no single equity curve or high to draw (a sum of per-account highs set
 * on different days was never the book's high), so the card is the left column alone and the
 * roster below carries the per-account detail. Every figure is server-formatted; the only
 * arithmetic here is the meter's fill, which is geometry, not a figure anyone reads.
 */

/** "$1,047,832.14" → ["$1,047,832", ".14"] so the cents can sit smaller and muted. */
function splitCents(value: string): readonly [string, string] {
  const dot = value.lastIndexOf(".");
  return dot > 0 ? [value.slice(0, dot), value.slice(dot)] : [value, ""];
}

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
  const [whole, cents] = splitCents(stats.value);
  const high = stats.allTimeHigh;
  const highLine = useMemo(
    () =>
      high ? { label: `your high ${high.value} · ${high.at}`, aboveNow: high.aboveNow } : undefined,
    [high],
  );
  const toHigh = high ? 1 / (1 + high.aboveNow) : undefined;
  // The phone's one line (#3689 slice 8, handoff 3b): today, this month, and the month against
  // the S&P. The stats, windows table, chart and footer stay on wider screens.
  const month = stats.windows.find((w) => w.label === "1M" && w.known);

  return (
    <section
      className={accountId ? "nw-card" : "nw-card nw-card--solo"}
      aria-label={`Net worth · ${caption}`}
    >
      <div className="nw-main">
        <span className="nw-eyebrow">Net worth · {caption}</span>
        <span className="nw-value num">
          {whole}
          {cents ? <span className="nw-cents">{cents}</span> : null}
        </span>
        <p className="nw-phone-line">
          <span className={`num tone-${stats.dayTone}`}>{stats.dayChange}</span> today
          {month ? (
            <>
              {" · "}
              <span className={`num tone-${month.tone}`}>{month.value}</span> this month
              {month.vsBenchmark ? (
                <>
                  {" · "}
                  <span className={`num tone-${month.vsBenchmarkTone ?? "flat"}`}>
                    {month.vsBenchmark}
                  </span>
                </>
              ) : null}
            </>
          ) : null}
        </p>
        <div className="nw-stats">
          <Stat label="Today" value={stats.dayChange} tone={stats.dayTone} />
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
      {accountId || (high && toHigh !== undefined) ? (
        <div className="nw-foot">
          {accountId ? <FormStrip accountId={accountId} /> : null}
          {!high ? null : stats.toNewHigh ? (
            <span className="nw-to-high">
              To a new high <b className="num">{stats.toNewHigh}</b>
            </span>
          ) : (
            <span className="nw-to-high nw-at-high">At a new high ✦</span>
          )}
          {/* the words beside it carry the gap; the meter is its picture */}
          {toHigh !== undefined ? (
            <span className="nw-meter" aria-hidden="true">
              <span className="nw-meter-fill" style={{ width: `${(toHigh * 100).toFixed(1)}%` }} />
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
