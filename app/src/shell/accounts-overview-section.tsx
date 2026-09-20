import type { ReactElement } from "react";
import type { ConsiderationChip, DeskSnapshot } from "../live/desk";
import type { AccountNetWorthView, NetWorthStatsView } from "../live/networth";
import { AccountsPositionsSection } from "./accounts-positions-section";
import { ConsiderationsRail } from "./considerations-rail";
import { HeroChart } from "./hero-chart";
import { NetWorthRoster } from "./networth-summary";

/**
 * ACCOUNTS' OVERVIEW SECTION — Summary's old cash/position detail and per-account roster, then the
 * positions blotter, in one scroll (Eric, live: "the summary page does very little atm... summary
 * and positions should be merged into a single section/view/page"). For a single account: the
 * dry-powder note, the equity chart + considerations rail, then the (possibly filtered) positions
 * table. For "All accounts": the roster table, then each account's grouped positions. The
 * net-worth-at-a-glance hero (value, day move, ROI) stays in the Cockpit header, not duplicated
 * here.
 */
export function OverviewSection({
  stats,
  allAccounts,
  roster,
  loading,
  error,
  accountId,
  considerations,
  desks,
  desksLoading,
  desksError,
  query,
  onFilterChange,
}: {
  readonly stats: NetWorthStatsView | null;
  readonly allAccounts: boolean;
  readonly roster: readonly AccountNetWorthView[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly accountId: string;
  readonly considerations: readonly ConsiderationChip[];
  readonly desks: readonly DeskSnapshot[] | undefined;
  readonly desksLoading: boolean;
  readonly desksError: boolean;
  readonly query: string;
  readonly onFilterChange: (next: string) => void;
}): ReactElement {
  if (loading) return <p className="note">Reading your net worth…</p>;
  if (error || !stats) return <p className="note">Net worth is unreachable right now.</p>;
  return (
    <div className="networth-detail">
      <p className="desk-note">
        {stats.cashKnown ? `cash ${stats.cash} dry powder` : "cash —"} · {stats.positionCount} open
        positions
      </p>
      {allAccounts ? (
        <NetWorthRoster accounts={roster} />
      ) : (
        <>
          <HeroChart accountId={accountId} />
          <ConsiderationsRail chips={considerations} />
        </>
      )}
      {desksLoading ? (
        <p className="note">Reading positions…</p>
      ) : desksError || !desks ? (
        <p className="note">Positions are unreachable right now.</p>
      ) : (
        <AccountsPositionsSection desks={desks} query={query} onFilterChange={onFilterChange} />
      )}
    </div>
  );
}
