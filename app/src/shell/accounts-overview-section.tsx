import type { ReactElement } from "react";
import type { DeskSnapshot } from "../live/desk";
import type { AccountNetWorthView, NetWorthStatsView } from "../live/networth";
import type { OwnedAccount } from "../live/settings";
import { AccountsPositionsSection } from "./accounts-positions-section";
import { DecisionPager } from "./decision-pager";
import { LeagueCard } from "./league-card";
import { MoneyStrip } from "./money-strip";
import { NetWorthCard } from "./networth-card";
import { NetWorthRoster } from "./networth-summary";

/**
 * ACCOUNTS' OVERVIEW SECTION — Summary's old cash/position detail and per-account roster, then the
 * positions blotter, in one scroll (Eric, live: "the summary page does very little atm... summary
 * and positions should be merged into a single section/view/page"). For a single account: the
 * dry-powder note, the equity chart + considerations rail, then the (possibly filtered) positions
 * table. For "All accounts": the roster table, then each account's grouped positions. The
 * net-worth-at-a-glance hero (value, day move, ROI) stays in the Cockpit header, not duplicated
 * here.
 *
 * #3689 slice 3: the Overview now opens with the net-worth card (value, today / locked in / on
 * paper, each window against the S&P, the chart with the all-time high), so the sticky header
 * drops its condensed copy on this section and keeps it on the others.
 */
export function OverviewSection({
  stats,
  caption,
  owned,
  allAccounts,
  roster,
  loading,
  error,
  accountId,
  desks,
  desksLoading,
  desksError,
  query,
  onFilterChange,
}: {
  readonly stats: NetWorthStatsView | null;
  readonly caption: string;
  readonly owned: readonly OwnedAccount[];
  readonly allAccounts: boolean;
  readonly roster: readonly AccountNetWorthView[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly accountId: string;
  readonly desks: readonly DeskSnapshot[] | undefined;
  readonly desksLoading: boolean;
  readonly desksError: boolean;
  readonly query: string;
  readonly onFilterChange: (next: string) => void;
}): ReactElement {
  // One account's desk carries the Money strip's allocation (#3689 slice 5).
  const singleDesk = allAccounts ? undefined : desks?.[0]?.desk;
  if (loading) return <p className="note">Reading your net worth…</p>;
  if (error || !stats) return <p className="note">Net worth is unreachable right now.</p>;
  return (
    <div className="networth-detail">
      <div className="overview-hero">
        <NetWorthCard
          stats={stats}
          caption={caption}
          accountId={allAccounts ? undefined : accountId}
        />
        <LeagueCard
          ownedIds={owned.map((a) => a.id)}
          meId={owned.find((a) => a.kind === "human")?.id}
        />
      </div>
      {!allAccounts && singleDesk?.allocation ? (
        <MoneyStrip
          accountId={accountId}
          allocation={singleDesk.allocation}
          hasOptions={singleDesk.positions.some((p) => p.isOption)}
        />
      ) : (
        <p className="desk-note">
          {stats.cashKnown ? `cash ${stats.cash} ready to use` : "cash —"} · {stats.positionCount}{" "}
          open positions
        </p>
      )}
      {allAccounts ? (
        <NetWorthRoster accounts={roster} />
      ) : (
        <DecisionPager accountId={accountId} decisions={singleDesk?.decisions ?? []} />
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
