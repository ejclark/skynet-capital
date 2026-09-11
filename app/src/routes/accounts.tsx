import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import {
  type DeskActivityEvent,
  type DeskSnapshot,
  fetchDesk,
  fetchDeskActivity,
} from "../live/desk";
import {
  type AccountNetWorthView,
  type AccountsNetWorthView,
  fetchNetWorth,
  type NetWorthStatsView,
} from "../live/networth";
import { fetchSettings } from "../live/settings";
import { AccountSwitcher, ALL_ACCOUNTS } from "../shell/account-switcher";
import { PageFrame } from "../shell/frame";
import { NetWorthCondensed, NetWorthRoster } from "../shell/networth-summary";
import { PositionsTable } from "../shell/positions-table";
import { ProfileRail } from "../shell/profile-rail";
import { SectionSwitch } from "../shell/section-switch";
import { type PageSection, resolveSection } from "../shell/sections";
import { EventLine } from "../shell/timeline-drawer";

/**
 * PROFILE > ACCOUNTS (#2321) — the Cockpit: a unified per-account view whose sticky header carries
 * the net-worth at-a-glance (total value, day move, ROI pills) and a horizontal section switch that
 * stay visible while the section detail (Positions, Activity, roster) scrolls below. One owned
 * account or "All accounts" combined, human and bot alike — Alpaca has no such distinction, so this
 * page never branches on `kind` beyond the switcher's own label.
 *
 * PROGRESSIVE DISCLOSURE: the sticky {@link NetWorthCondensed} is the always-visible summary layer;
 * the section switch reveals one section's full detail at a time (Positions blotter, Activity
 * timeline, or the Summary roster + cash/position detail). The net-worth payload is one
 * `/api/accounts/networth` fetch that carries every owned account plus the aggregate, so the
 * switcher never triggers a re-fetch. Windows' returns come straight from Alpaca's own portfolio
 * history (flow-adjusted, so a deposit never reads as a gain); the aggregate per window is
 * `Σend / Σbase − 1` across the accounts that reported one. Positions and Activity still run through
 * `fetchDesk` / `PositionsTable` as before, and the desk fetch is skipped on Summary.
 */

type AccountsSection = "summary" | "positions" | "activity";

const SECTIONS: readonly PageSection<AccountsSection>[] = [
  { id: "summary", label: "Summary" },
  { id: "positions", label: "Positions" },
  { id: "activity", label: "Activity" },
];

function fetchDesks(ids: readonly string[]): Promise<DeskSnapshot[]> {
  return Promise.all(ids.map((id) => fetchDesk(id)));
}

/** Resolve the net-worth stats for the selected account (or the aggregate for "All accounts").
 *  Returns the stats, a caption for the hero label, the roster (non-empty only for "All"), and
 *  whether the aggregate is in view — so {@link AccountsBody} and {@link CockpitBody} share one
 *  resolution path without re-deriving it. */
function resolveNetWorth(
  data: AccountsNetWorthView | undefined,
  accountId: string,
): {
  readonly stats: NetWorthStatsView | null;
  readonly caption: string;
  readonly roster: readonly AccountNetWorthView[];
  readonly allAccounts: boolean;
} {
  if (!data) return { stats: null, caption: "this account", roster: [], allAccounts: false };
  const all = accountId === ALL_ACCOUNTS;
  if (all)
    return { stats: data.total, caption: "all accounts", roster: data.accounts, allAccounts: true };
  const row = data.accounts.find((a) => a.id === accountId) ?? null;
  return { stats: row, caption: row?.name ?? "this account", roster: [], allAccounts: false };
}

/** The Summary section body — the cash/position detail and per-account roster that live below the
 *  sticky condensed hero. For a single account this is the dry-powder note; for "All accounts" the
 *  roster table reads the whole book at a glance. The hero itself (value, day move, ROI) is in the
 *  Cockpit header, not duplicated here. */
function SummaryDetail({
  stats,
  allAccounts,
  roster,
  loading,
  error,
}: {
  readonly stats: NetWorthStatsView | null;
  readonly allAccounts: boolean;
  readonly roster: readonly AccountNetWorthView[];
  readonly loading: boolean;
  readonly error: boolean;
}): ReactElement {
  if (loading) return <p className="note">Reading your net worth…</p>;
  if (error || !stats) return <p className="note">Net worth is unreachable right now.</p>;
  return (
    <div className="networth-detail">
      <p className="desk-note">
        {stats.cashKnown ? `cash ${stats.cash} dry powder` : "cash —"} · {stats.positionCount} open
        positions
      </p>
      {allAccounts ? <NetWorthRoster accounts={roster} /> : null}
    </div>
  );
}

function PositionsSection({ desks }: { readonly desks: readonly DeskSnapshot[] }): ReactElement {
  if (desks.length === 1) {
    const only = desks[0];
    if (!only) return <p className="note">No account selected.</p>;
    return (
      <PositionsTable
        positions={only.desk.positions}
        deskId={only.desk.id}
        totalCount={only.desk.positions.length}
      />
    );
  }
  return (
    <>
      {desks.map((d) => (
        <section key={d.desk.id} className="accounts-group">
          <h2 className="accounts-group-head">
            {d.desk.name}{" "}
            <span className={`chip chip-${d.desk.kind}`}>
              {d.desk.kind === "bot" ? "BOT" : "HUMAN"}
            </span>
          </h2>
          <PositionsTable
            positions={d.desk.positions}
            deskId={d.desk.id}
            totalCount={d.desk.positions.length}
          />
        </section>
      ))}
    </>
  );
}

function ActivitySection({ deskIds }: { readonly deskIds: readonly string[] }): ReactElement {
  const activity = useQuery({
    queryKey: ["accounts-activity", deskIds.join(",")],
    queryFn: async () => {
      const pages = await Promise.all(deskIds.map((id) => fetchDeskActivity(id)));
      const merged: DeskActivityEvent[] = pages.flatMap((p) => p.activity);
      merged.sort((a, b) => (a.at < b.at ? 1 : -1));
      return { available: pages.every((p) => p.available), events: merged };
    },
  });
  if (activity.isPending) return <p className="note">Reading the ledger…</p>;
  if (activity.isError) return <p className="note">The ledger is unreachable.</p>;
  if (!activity.data.available)
    return <p className="note">No durable activity ledger is wired in this deployment.</p>;
  if (activity.data.events.length === 0)
    return <p className="note">No recorded orders in the ledger's window.</p>;
  return (
    <ul className="tl">
      {activity.data.events.map((event) => (
        <EventLine key={`${event.orderId}-${event.at}`} event={event} />
      ))}
    </ul>
  );
}

const asId = (raw: unknown): string | undefined =>
  typeof raw === "string" && raw.length > 0 && raw.length <= 100 ? raw : undefined;

function AccountsPage(): ReactElement {
  const navigate = Route.useNavigate();
  const { account: asked, section: askedSection } = Route.useSearch();
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  if (settings.isPending)
    return (
      <PageFrame rail={<ProfileRail current="accounts" />}>
        <p className="note">Reading your accounts…</p>
      </PageFrame>
    );
  if (settings.isError)
    return (
      <PageFrame rail={<ProfileRail current="accounts" />}>
        <p className="note">Accounts are unreachable.</p>
      </PageFrame>
    );

  const { accounts } = settings.data;
  const first = accounts[0];
  if (!first)
    return (
      <PageFrame rail={<ProfileRail current="accounts" />}>
        <p className="note">
          Your sign-in doesn't resolve to an account yet — connect one from{" "}
          <a href="/app/onboarding">onboarding</a>.
        </p>
      </PageFrame>
    );

  const selected =
    asked === ALL_ACCOUNTS || accounts.some((a) => a.id === asked) ? asked : first.id;
  const deskIds = selected === ALL_ACCOUNTS ? accounts.map((a) => a.id) : [selected as string];
  const section = resolveSection(SECTIONS, askedSection);

  return (
    <AccountsBody
      accountId={selected as string}
      deskIds={deskIds}
      section={section}
      accounts={accounts}
      onSelectAccount={(id) =>
        void navigate({
          search: (prev) => ({ ...prev, account: id === first.id ? undefined : id }),
          replace: true,
        })
      }
      onSelectSection={(next) =>
        void navigate({
          search: (prev) => ({ ...prev, section: next === "summary" ? undefined : next }),
          replace: true,
        })
      }
    />
  );
}

/** The scrollable section content — owns the desks query (enabled only off-Summary) and reads the
 *  shared net-worth query for the Summary detail. React Query deduplicates the net-worth fetch that
 *  {@link AccountsBody} already started for the sticky header. */
function CockpitBody({
  section,
  deskIds,
  accountId,
}: {
  readonly section: AccountsSection;
  readonly deskIds: readonly string[];
  readonly accountId: string;
}): ReactElement {
  const desks = useQuery({
    queryKey: ["desks", deskIds.join(",")],
    queryFn: () => fetchDesks(deskIds),
    // Summary reads from `/api/accounts/networth`, not the desk — skip the blotter fetch until the
    // visitor opens Positions or Activity (the desk endpoint is cheap and cached, but a wasted
    // fetch on every summary view is still a wasted fetch).
    enabled: section !== "summary",
  });
  const networth = useQuery({ queryKey: ["accounts-networth"], queryFn: fetchNetWorth });

  if (section === "summary") {
    const { stats, allAccounts, roster } = resolveNetWorth(networth.data, accountId);
    return (
      <SummaryDetail
        stats={stats}
        allAccounts={allAccounts}
        roster={roster}
        loading={networth.isPending}
        error={networth.isError}
      />
    );
  }
  if (desks.isPending) return <p className="note">Reading the desk…</p>;
  if (desks.isError) return <p className="note">This account is unreachable.</p>;
  if (!desks.data) return <p className="note">No data.</p>;
  if (section === "positions") return <PositionsSection desks={desks.data} />;
  return <ActivitySection deskIds={deskIds} />;
}

function AccountsBody({
  deskIds,
  accountId,
  section,
  accounts,
  onSelectAccount,
  onSelectSection,
}: {
  readonly deskIds: readonly string[];
  readonly accountId: string;
  readonly section: AccountsSection;
  readonly accounts: Parameters<typeof AccountSwitcher>[0]["accounts"];
  readonly onSelectAccount: (id: string) => void;
  readonly onSelectSection: (section: AccountsSection) => void;
}): ReactElement {
  const networth = useQuery({ queryKey: ["accounts-networth"], queryFn: fetchNetWorth });
  const { stats, caption } = resolveNetWorth(networth.data, accountId);

  return (
    <PageFrame rail={<ProfileRail current="accounts" />}>
      <h1 className="visually-hidden">Accounts</h1>
      <div className="cockpit">
        <div className="cockpit-head">
          <AccountSwitcher
            accounts={accounts}
            selectedId={accountId}
            onSelect={onSelectAccount}
            allowAll
          />
          {stats ? (
            <NetWorthCondensed stats={stats} caption={caption} />
          ) : (
            <p className="note">
              {networth.isError ? "Net worth is unreachable right now." : "Reading your net worth…"}
            </p>
          )}
          <SectionSwitch
            sections={SECTIONS}
            current={section}
            onSelect={onSelectSection}
            variant="horizontal"
          />
        </div>
        <CockpitBody section={section} deskIds={deskIds} accountId={accountId} />
      </div>
    </PageFrame>
  );
}

export const Route = createFileRoute("/accounts")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(asId(search.account) ? { account: asId(search.account) } : {}),
    ...(typeof search.section === "string" && SECTIONS.some((s) => s.id === search.section)
      ? { section: search.section as AccountsSection }
      : {}),
  }),
  component: AccountsPage,
});
