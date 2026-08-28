import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchDesk } from "../live/desk";
import {
  type DeskPulse,
  fetchDeskPulse,
  type PulseCurveData,
  type PulseStreakGroupData,
  type PulseWeekData,
} from "../live/pulse";
import { DeskRail } from "../shell/desk-rail";
import { PageFrame } from "../shell/frame";

/**
 * DESK PULSE (#738 phase 4a) — the Insights template on a desk: how the account breathes over
 * time. The server sends formatted figures and normalized 0..1 geometry; this page only draws.
 * Each section owns its empty state (performance-view doctrine): a desk with trades but no
 * recorded history still shows its weeks, and vice versa.
 */

const W = 640;
const H = 160;
const PAD = 6;

function curvePath(curve: PulseCurveData): { line: string; area: string } {
  const pts = curve.points.map(
    (p) => [PAD + p.x * (W - PAD * 2), H - PAD - p.y * (H - PAD * 2)] as const,
  );
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  const first = pts[0];
  const last = pts[pts.length - 1];
  const area =
    first && last
      ? `${line.join(" ")} L${last[0].toFixed(1)},${H - PAD} L${first[0].toFixed(1)},${H - PAD} Z`
      : "";
  return { line: line.join(" "), area };
}

function EquityCurve({ curve }: { readonly curve: PulseCurveData }): ReactElement {
  const { line, area } = curvePath(curve);
  return (
    <figure className="pulse-curve">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Equity from ${curve.startLabel} (${curve.lowLabel} low) to ${curve.endLabel} (${curve.highLabel} high)`}
      >
        <path className="pulse-area" d={area} />
        <path className="pulse-line" d={line} />
      </svg>
      <figcaption className="pulse-rails num">
        <span>{curve.startLabel}</span>
        <span>
          {curve.lowLabel} – {curve.highLabel}
        </span>
        <span>{curve.endLabel}</span>
      </figcaption>
      <div className="pulse-lines">
        <span>Peak equity</span>
        <span className="num">{curve.peak}</span>
        <span>Max drawdown</span>
        <span className={`num tone-${curve.drawdownTone}`}>{curve.drawdown}</span>
      </div>
    </figure>
  );
}

function WeeklyBars({ weeks }: { readonly weeks: readonly PulseWeekData[] }): ReactElement {
  return (
    <div className="pulse-weeks" role="img" aria-label="Realized P/L by week">
      {weeks.map((week) => (
        <div key={week.label} className="pulse-week" title={`${week.label}: ${week.pl}`}>
          <div className="pulse-week-track">
            <div className="pulse-week-up">
              {week.tone === "pos" ? (
                <i style={{ height: `${Math.round(week.bar * 100)}%` }} />
              ) : null}
            </div>
            <div className="pulse-week-down">
              {week.tone === "neg" ? (
                <i style={{ height: `${Math.round(week.bar * 100)}%` }} />
              ) : null}
            </div>
          </div>
          <span className={`pulse-week-pl num tone-${week.tone}`}>{week.pl}</span>
          <span className="pulse-week-label num">{week.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The two run families (#780), side by side and never merged. Each group keeps its caption even
 * when it has rows: "4 trading days" and "4 trades" are different facts, and the caption is the
 * only thing on the page that says which one a reader is looking at.
 */
function StreakGroups({
  groups,
}: {
  readonly groups: readonly PulseStreakGroupData[];
}): ReactElement {
  return (
    <div className="pulse-streaks">
      {groups.map((group) => (
        <div key={group.title} className="pulse-streak-group">
          <h3 className="pulse-streak-h">{group.title}</h3>
          <p className="pulse-streak-cap">{group.caption}</p>
          {group.rows.length > 0 ? (
            <dl className="pulse-streak-rows">
              {group.rows.map((row) => (
                <div key={row.label} className="pulse-streak-row">
                  <dt className="pulse-streak-k">{row.label}</dt>
                  <dd className={`pulse-streak-v num tone-${row.tone}`}>{row.value}</dd>
                  <dd className="pulse-streak-note num">{row.note}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="note">{group.empty}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function PulseBody({ pulse }: { readonly pulse: DeskPulse }): ReactElement {
  return (
    <>
      <div className="desk-tiles">
        {pulse.tiles.map((tile) => (
          <div key={tile.label} className="desk-tile">
            <span className="desk-k">{tile.label}</span>
            <span className={`desk-v num${tile.tone ? ` tone-${tile.tone}` : ""}`}>
              {tile.value}
            </span>
            <span className="desk-note">{tile.note}</span>
          </div>
        ))}
      </div>

      <section className="pulse-panel">
        <h2 className="pulse-title">Equity curve</h2>
        {pulse.curve ? (
          <EquityCurve curve={pulse.curve} />
        ) : (
          <p className="note">
            Two samples are needed to draw a line — history is still accruing. Nothing is
            back-filled or estimated.
          </p>
        )}
        {pulse.race ? (
          <div className="pulse-race">
            <span className="pulse-race-k">The doubling race</span>
            <p className="pulse-race-line">{pulse.race.line}</p>
            <div
              className={`pulse-progress${pulse.race.doubled ? " pulse-progress-done" : ""}`}
              role="progressbar"
              aria-valuenow={Math.round(pulse.race.progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <i style={{ width: `${pulse.race.progress.toFixed(1)}%` }} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="pulse-panel">
        <h2 className="pulse-title">Streaks</h2>
        <StreakGroups groups={pulse.streaks} />
      </section>

      <section className="pulse-panel">
        <h2 className="pulse-title">Realized P/L by week</h2>
        {pulse.weeks.length > 0 ? (
          <WeeklyBars weeks={pulse.weeks} />
        ) : (
          <p className="note">
            Needs a closed trade — nothing here is estimated from open positions.
          </p>
        )}
      </section>
    </>
  );
}

function PulsePage(): ReactElement {
  const { id } = Route.useParams();
  const desk = useQuery({ queryKey: ["desk", id], queryFn: () => fetchDesk(id) });
  const pulse = useQuery({
    queryKey: ["desk-pulse", id],
    queryFn: () => fetchDeskPulse(id),
    refetchOnWindowFocus: true,
  });

  if (desk.isPending || pulse.isPending)
    return (
      <PageFrame>
        <p className="note">Taking the pulse…</p>
      </PageFrame>
    );
  if (desk.isError || pulse.isError)
    return (
      <PageFrame>
        <p className="note">The pulse is unreachable.</p>
      </PageFrame>
    );

  const d = desk.data.desk;
  return (
    <PageFrame rail={<DeskRail id={d.id} name={d.name} kind={d.kind} current="pulse" />}>
      <header className="page-header">
        <h1>{d.name} — pulse</h1>
        <p>
          How the account breathes over time: the recorded equity curve, the runs it strung
          together, realized P/L week by week, and the friendly race to 2×. Nothing here is
          estimated — every figure comes from a recorded equity sample or a closed trade, and each
          section says which.
        </p>
      </header>
      <PulseBody pulse={pulse.data} />
    </PageFrame>
  );
}

export const Route = createFileRoute("/u/$id/pulse")({ component: PulsePage });
