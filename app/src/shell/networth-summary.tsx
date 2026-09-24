import type { ReactElement } from "react";
import type { AccountNetWorthView, NetWorthStatsView, NetWorthWindowView } from "../live/networth";
import { GlossaryTerm } from "./glossary-term";
import { RosterSparkline } from "./roster-sparkline";

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

/**
 * The All-accounts roster (#3689 slice 10, handoff 2b): one row per owned account with its month
 * as a sparkline, net worth, today, the month against the S&P, and how much of it is deployed
 * versus idle (folded in here; there's no separate capital-by-account block). "Needs you" counts
 * the account's open decision cards.
 */
export function NetWorthRoster({
  accounts,
  decisionsById,
}: {
  readonly accounts: readonly AccountNetWorthView[];
  /** Open decision cards per account id, from the desks the page already loaded. */
  readonly decisionsById?: ReadonlyMap<string, number>;
}): ReactElement | null {
  if (accounts.length <= 1) return null;
  return (
    <div className="networth-roster-scroll">
      <table className="networth-roster">
        <thead>
          <tr>
            <th scope="col">Account</th>
            <th scope="col">Last month</th>
            <th scope="col" className="num">
              Net worth
            </th>
            <th scope="col" className="num">
              Today
            </th>
            <th scope="col" className="num">
              1M vs S&amp;P
            </th>
            <th scope="col">Deployed · idle</th>
            <th scope="col" className="num">
              Needs you
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => {
            const month = a.windows.find((w) => w.label === "1M");
            const moves = decisionsById?.get(a.id);
            return (
              <tr key={a.id}>
                <th scope="row">
                  {a.name}{" "}
                  <span className={`chip chip-${a.kind}`}>
                    {a.kind === "bot" ? "BOT" : "HUMAN"}
                  </span>
                  {a.error ? <span className="desk-note"> · {a.error}</span> : null}
                </th>
                <td>
                  <RosterSparkline accountId={a.id} />
                </td>
                <td className="num">{a.value}</td>
                <td className={`num tone-${a.dayTone}`}>{a.dayChange}</td>
                <td className="num">
                  <span className={`tone-${month?.tone ?? "flat"}`}>{month?.value ?? "—"}</span>
                  {month?.vsBenchmark ? (
                    <span className={`roster-vs tone-${month.vsBenchmarkTone ?? "flat"}`}>
                      {month.vsBenchmark}
                    </span>
                  ) : null}
                </td>
                <td>
                  {a.idle !== undefined && a.idlePct !== undefined ? (
                    <span className="roster-idle">
                      <span className="roster-idle-text">{a.idle}</span>
                      <span className="roster-idle-bar" aria-hidden="true">
                        <span style={{ width: `${(100 - a.idlePct).toFixed(1)}%` }} />
                      </span>
                    </span>
                  ) : (
                    <span className="desk-note">—</span>
                  )}
                </td>
                <td className="num">{moves === undefined ? "—" : moves}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

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
          {stats.bookedKnown ? (
            <span className={`networth-condensed-booked num tone-${stats.bookedTone}`}>
              {stats.bookedPl}
              <span className="desk-note">
                <GlossaryTerm term="lockedIn">locked in</GlossaryTerm>
              </span>
            </span>
          ) : null}
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
