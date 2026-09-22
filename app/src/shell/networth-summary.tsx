import type { ReactElement } from "react";
import type { AccountNetWorthView, NetWorthStatsView, NetWorthWindowView } from "../live/networth";

/**
 * The Accounts page's net-worth components (#2321) — the Cockpit's sticky at-a-glance
 * ({@link NetWorthCondensed}), the per-account roster ({@link NetWorthRoster}), and the legacy
 * composite ({@link NetWorthSummary}). Every figure arrives server-formatted; these components
 * only place it. The same shape serves one account (its row) and all accounts (the aggregate),
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

export function NetWorthRoster({
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

/** The Cockpit's sticky at-a-glance — a condensed net-worth hero that stays visible while the
 *  section detail (Positions, Activity, roster) scrolls below. Shows the total value, the day's
 *  move, and ROI pills (7D/1M/3M/1Y); the cash/position detail and the per-account roster live in
 *  the Summary section body, not here, so the sticky bar stays compact. Same server-formatted
 *  strings as {@link NetWorthHero}, placed tighter for a bar that never leaves the viewport. */
export function NetWorthCondensed({
  stats,
  caption,
}: {
  readonly stats: NetWorthStatsView;
  readonly caption: string;
}): ReactElement {
  return (
    <div className="networth-condensed">
      <div className="networth-condensed-main">
        <span className="desk-k">Net worth · {caption}</span>
        <div className="networth-condensed-values">
          <span className="networth-condensed-value num">{stats.value}</span>
          <span className={`networth-condensed-day num tone-${stats.dayTone}`}>
            {stats.dayChange}
            <span className="desk-note">today</span>
          </span>
        </div>
      </div>
      <div className="networth-condensed-roi">
        {stats.windows.map((w) => (
          <span
            key={w.label}
            className={`networth-pill tone-${w.tone}${w.partial ? " networth-pill--partial" : ""}`}
          >
            <span className="networth-pill-label">{w.label}</span>
            <span className="networth-pill-value num">{w.value}</span>
          </span>
        ))}
      </div>
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
