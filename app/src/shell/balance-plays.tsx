import type { ReactElement } from "react";
import {
  committedShareOf,
  dollars,
  entryDay,
  HEALTH_GLYPH,
  type HealthFinding,
  idleShareOf,
  type PlayHealth,
  refusedCount,
  targetLine,
} from "../live/book-health";
import type { PlaybookMetricsView } from "../live/playbook-performance";
import { PlayLink } from "./balance-findings";
import { signedMoney } from "./option-preview";

/**
 * ONE ROW PER PLAY, MOST IDLE FIRST (#5493 slice 3, AC 5: "then plays by idle share; the desktop
 * adds the per-play numbers beside each row, never new concepts").
 *
 * PHONE (390): the play's name and whether it is on, how many findings sit on it, one bar of how
 * much of its budget is committed with the dollars under it, then three facts — open positions,
 * closed trades, net. WIDER: the same row lays its facts out beside the name and gains the ones a
 * phone leaves a tap away (how long the oldest position has been held, the newest entry, what the
 * guards refused last session, the win rate). Those are the `bal-wide` cells; nothing is added that
 * the phone row does not already stand for.
 *
 * An unmeasurable figure prints "—", never 0 (the metrics' own honesty invariant): a play with no
 * budget set is "uncapped" with no bar, and a figure the server could not derive is a dash.
 */

const sessions = (n: number): string => `${n} ${n === 1 ? "session" : "sessions"}`;

/** The worst level on a play's findings, said as glyph and count — "■ 1 gate" / "◆ 2 findings". */
function flagOf(findings: readonly HealthFinding[]): string | undefined {
  if (findings.length === 0) return undefined;
  const gates = findings.filter((f) => f.level === "gate").length;
  return gates > 0
    ? `${HEALTH_GLYPH.gate} ${gates} ${gates === 1 ? "gate" : "gates"}`
    : `${HEALTH_GLYPH.signal} ${findings.length} ${findings.length === 1 ? "signal" : "signals"}`;
}

function Cell({
  label,
  value,
  wide = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly wide?: boolean;
}): ReactElement {
  return (
    <div className={wide ? "bal-wide" : undefined}>
      <dt>{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}

function Budget({ play }: { readonly play: PlayHealth }): ReactElement {
  const share = committedShareOf(play);
  if (play.allocation === undefined)
    return <p className="bal-budget-words">No budget set — uncapped.</p>;
  const idleShare = idleShareOf(play);
  const committed = play.committed === undefined ? "—" : dollars(play.committed);
  const idle = play.idle === undefined ? "—" : dollars(play.idle);
  return (
    <>
      {share === undefined ? null : (
        <div
          className="bal-meter"
          role="img"
          aria-label={`${Math.round(share * 100)}% of the budget committed`}
        >
          <span style={{ width: `${share * 100}%` }} />
        </div>
      )}
      <p className="bal-budget-words num">
        <b>{committed}</b> committed of {dollars(play.allocation)} · <b>{idle}</b> idle
        {idleShare === undefined ? "" : ` (${Math.round(idleShare * 100)}%)`}
      </p>
    </>
  );
}

export function BalancePlays({
  deskId,
  plays,
  findings,
  closed,
}: {
  readonly deskId: string;
  /** Already in the order to draw (`playsByIdle`). */
  readonly plays: readonly PlayHealth[];
  readonly findings: readonly HealthFinding[];
  /** This account's closed-trade numbers per play; undefined while unread, null when unreadable. */
  readonly closed: readonly PlaybookMetricsView[] | null | undefined;
}): ReactElement {
  return (
    <ul className="bal-plays">
      {plays.map((play) => {
        const flag = flagOf(findings.filter((f) => f.playbookId === play.playbookId));
        const row = closed?.find((m) => m.playbookId === play.playbookId);
        const closedTrades =
          closed === undefined || closed === null
            ? "—"
            : row
              ? `${row.trades} · ${signedMoney(row.netRealized)}`
              : "none yet";
        return (
          <li key={`${play.playbookId}|${play.mode}`} className="bal-play" data-on={play.enabled}>
            <div className="bal-play-head">
              <PlayLink deskId={deskId} playbookId={play.playbookId} mode={play.mode} />
              <span className="bal-play-state">
                {play.enabled ? "On" : "Paused"} · {play.mode}
              </span>
              {flag ? <span className="bal-play-flag">{flag}</span> : null}
            </div>
            <div className="bal-play-budget">
              <Budget play={play} />
              {play.target ? <p className="bal-target num">{targetLine(play.target)}</p> : null}
            </div>
            <dl className="bal-play-nums">
              <Cell label="Open" value={String(play.openPositions)} />
              <Cell label="Closed · net" value={closedTrades} />
              <Cell
                wide
                label="Oldest open"
                value={
                  play.oldestOpenSessions === undefined ? "—" : sessions(play.oldestOpenSessions)
                }
              />
              <Cell
                wide
                label="Last entry"
                value={play.lastEntryAt === undefined ? "—" : entryDay(play.lastEntryAt)}
              />
              <Cell wide label="Refused last session" value={String(refusedCount(play))} />
              <Cell
                wide
                label="Win rate"
                value={row?.winRate == null ? "—" : `${row.winRate.toFixed(0)}%`}
              />
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
