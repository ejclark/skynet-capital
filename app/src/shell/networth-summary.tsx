import type { ReactElement } from "react";
import type { AccountNetWorthView } from "../live/networth";
import { KindChip } from "../ui";
import { RosterSparkline } from "./roster-sparkline";

/**
 * The Accounts page's per-account net-worth roster ({@link NetWorthRoster}, #2321). The sticky
 * at-a-glance that lived here became the Profile head's vitals line (`head-vitals.tsx`, #5072), and
 * the legacy hero composite (`NetWorthSummary`) was buried once knip's app scope flagged it as
 * unimported. Every figure arrives server-formatted; the roster only places it.
 * @category desk
 */

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
                  {a.name} <KindChip kind={a.kind} />
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
