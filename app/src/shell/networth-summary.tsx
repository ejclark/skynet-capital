import type { ReactElement } from "react";
import type { AccountNetWorthView, NetWorthStatsView, NetWorthWindowView } from "../live/networth";

/**
 * The Accounts page's Summary section (#2321) — a net-worth hero (total value + the day's move)
 * with an ROI strip across four windows (7D/1M/3M/1Y), and, for "All accounts", a per-account
 * roster so the book reads at a glance. Every figure arrives server-formatted; this component
 * only places it. The same shape serves one account (its row) and all accounts (the aggregate),
 * so the view never branches on how many accounts are selected beyond choosing which stats to show.
 * @category desk
 */

function WindowTile({ w }: { readonly w: NetWorthWindowView }): ReactElement {
  return (
    <div className={`networth-tile${w.partial ? " networth-tile--partial" : ""}`}>
      <span className="desk-k">{w.label}</span>
      <span className={`desk-v num tone-${w.tone}`}>{w.value}</span>
      <span className="desk-note">{w.partial ? `${w.note} · partial` : w.note}</span>
    </div>
  );
}

function NetWorthHero({
  stats,
  caption,
}: {
  readonly stats: NetWorthStatsView;
  readonly caption: string;
}): ReactElement {
  return (
    <div className="networth-hero">
      <div className="networth-hero-main">
        <span className="desk-k">Net worth · {caption}</span>
        <span className="networth-value num">{stats.value}</span>
        <span className={`networth-day num tone-${stats.dayTone}`}>
          {stats.dayChange}
          <span className="desk-note">today</span>
        </span>
        <span className="desk-note networth-hero-note">
          {stats.cashKnown ? `cash ${stats.cash} dry powder` : "cash —"} · {stats.positionCount}{" "}
          open positions
        </span>
      </div>
      <div className="networth-roi">
        {stats.windows.map((w) => (
          <WindowTile key={w.label} w={w} />
        ))}
      </div>
    </div>
  );
}

function NetWorthRoster({
  accounts,
}: {
  readonly accounts: readonly AccountNetWorthView[];
}): ReactElement | null {
  if (accounts.length <= 1) return null;
  return (
    <div className="networth-roster-scroll">
      <table className="networth-roster">
        <thead>
          <tr>
            <th scope="col">Account</th>
            <th scope="col" className="num">
              Net worth
            </th>
            <th scope="col" className="num">
              Today
            </th>
            {accounts[0]?.windows.map((w) => (
              <th key={w.label} scope="col" className="num">
                {w.label}
              </th>
            )) ?? null}
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id}>
              <th scope="row">
                {a.name}{" "}
                <span className={`chip chip-${a.kind}`}>{a.kind === "bot" ? "BOT" : "HUMAN"}</span>
                {a.error ? <span className="desk-note"> · {a.error}</span> : null}
              </th>
              <td className="num">{a.value}</td>
              <td className={`num tone-${a.dayTone}`}>{a.dayChange}</td>
              {a.windows.map((w) => (
                <td key={w.label} className={`num tone-${w.tone}`}>
                  {w.value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NetWorthSummary({
  stats,
  caption,
  roster,
}: {
  readonly stats: NetWorthStatsView;
  readonly caption: string;
  /** The per-account rows; shown only when more than one account is in view (the "All accounts" book). */
  readonly roster: readonly AccountNetWorthView[];
}): ReactElement {
  return (
    <section className="networth">
      <NetWorthHero stats={stats} caption={caption} />
      <NetWorthRoster accounts={roster} />
    </section>
  );
}
