import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  type ConsiderationChip,
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
import { AccountsPositionsSection } from "../shell/accounts-positions-section";
import { ActivityTable } from "../shell/activity-table";
import { ConsiderationsRail } from "../shell/considerations-rail";
import { DecisionsSection } from "../shell/decisions-section";
import { PageFrame } from "../shell/frame";
import { HeroChart } from "../shell/hero-chart";
import { NetWorthCondensed, NetWorthRoster } from "../shell/networth-summary";
import { ProfileRail } from "../shell/profile-rail";
import { SectionSwitch } from "../shell/section-switch";
import { type PageSection, resolveSection } from "../shell/sections";

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

type AccountsSection = "summary" | "positions" | "activity" | "decisions";

const BASE_SECTIONS: readonly PageSection<AccountsSection>[] = [
  { id: "summary", label: "Summary" },
  { id: "positions", label: "Positions" },
  { id: "activity", label: "Activity" },
];

/** The full candidate list `validateSearch` accepts from a URL — the *rendered* set narrows this
 *  per account (`sectionsFor` below); an unknown or now-inapplicable value falls back via
 *  `resolveSection`, never strands the reader. */
const ALL_SECTIONS: readonly PageSection<AccountsSection>[] = [
  ...BASE_SECTIONS,
  { id: "decisions", label: "Decisions" },
];

/** Decisions is the autonomous-trading audit trail — it only makes sense for one bot account at a
 *  time, never the "All accounts" aggregate or a human account (Eric: "tied to autonomous
 *  trading... currently only bot accounts"). */
function sectionsFor(kind: "human" | "bot" | undefined): readonly PageSection<AccountsSection>[] {
  return kind === "bot" ? ALL_SECTIONS : BASE_SECTIONS;
}

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
  accountId,
  considerations,
}: {
  readonly stats: NetWorthStatsView | null;
  readonly allAccounts: boolean;
  readonly roster: readonly AccountNetWorthView[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly accountId: string;
  readonly considerations: readonly ConsiderationChip[];
}): ReactElement {
  if (loading) return <p className="note">Reading your net worth…</p>;
  if (error || !stats) return <p className="note">Net worth is unreachable right now.</p>;
  return (
    <div className="networth-detail">
      <p className="desk-note">
        {stats.cashKnown ? `cash ${stats.cash} dry powder` : "cash —"} · {stats.positionCount} open
        positions
      </p>
      {/* One account at a time (#3186 slices 2 & 3) — the "All accounts" aggregate curve/rail is a
          fast-follow, not bundled into these slices; the roster table covers that view instead. */}
      {allAccounts ? (
        <NetWorthRoster accounts={roster} />
      ) : (
        <>
          <HeroChart accountId={accountId} />
          <ConsiderationsRail chips={considerations} />
        </>
      )}
    </div>
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
  return <ActivityTable events={activity.data.events} />;
}

const asId = (raw: unknown): string | undefined =>
  typeof raw === "string" && raw.length > 0 && raw.length <= 100 ? raw : undefined;

function AccountsPage(): ReactElement {
  const navigate = Route.useNavigate();
  const { account: asked, section: askedSection, q } = Route.useSearch();
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  // URL-stateful positions filter — the same immediate-locally/debounced-replace discipline
  // `research.tsx` uses, ported from the retired `/u/:id` positions view.
  const [query, setQuery] = useState(q ?? "");
  const urlTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(urlTimer.current), []);
  const onFilterChange = (next: string) => {
    setQuery(next);
    clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      void navigate({
        search: (prev) => ({ ...prev, q: next.trim() === "" ? undefined : next }),
        replace: true,
      });
    }, 300);
  };

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
  const selectedKind =
    selected === ALL_ACCOUNTS ? undefined : accounts.find((a) => a.id === selected)?.kind;
  const sections = sectionsFor(selectedKind);
  const section = resolveSection(sections, askedSection);

  return (
    <AccountsBody
      accountId={selected as string}
      deskIds={deskIds}
      section={section}
      sections={sections}
      accounts={accounts}
      query={query}
      onFilterChange={onFilterChange}
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
  query,
  onFilterChange,
}: {
  readonly section: AccountsSection;
  readonly deskIds: readonly string[];
  readonly accountId: string;
  readonly query: string;
  readonly onFilterChange: (next: string) => void;
}): ReactElement {
  const allAccountsSelected = accountId === ALL_ACCOUNTS;
  const desks = useQuery({
    queryKey: ["desks", deskIds.join(",")],
    queryFn: () => fetchDesks(deskIds),
    // Summary reads net worth from `/api/accounts/networth`, not the desk — but the considerations
    // rail (#3186 slice 3) lives on Summary and needs the desk's own `considerations`, so the desk
    // fetch stays enabled there too, for a single account (the "All accounts" roster view has no
    // rail, same scope decision as the hero chart, so it skips the fetch same as before). Decisions
    // reads its own audit-trail endpoint, not the desk, so it skips this fetch entirely.
    enabled: section === "summary" ? !allAccountsSelected : section !== "decisions",
  });
  const networth = useQuery({ queryKey: ["accounts-networth"], queryFn: fetchNetWorth });

  if (section === "decisions") return <DecisionsSection deskId={accountId} />;
  if (section === "summary") {
    const { stats, allAccounts, roster } = resolveNetWorth(networth.data, accountId);
    const considerations = desks.data?.[0]?.desk.considerations ?? [];
    return (
      <SummaryDetail
        stats={stats}
        allAccounts={allAccounts}
        roster={roster}
        loading={networth.isPending}
        error={networth.isError}
        accountId={accountId}
        considerations={considerations}
      />
    );
  }
  if (desks.isPending) return <p className="note">Reading accounts…</p>;
  if (desks.isError) return <p className="note">This account is unreachable.</p>;
  if (!desks.data) return <p className="note">No data.</p>;
  if (section === "positions")
    return (
      <AccountsPositionsSection desks={desks.data} query={query} onFilterChange={onFilterChange} />
    );
  return <ActivitySection deskIds={deskIds} />;
}

function AccountsBody({
  deskIds,
  accountId,
  section,
  sections,
  accounts,
  query,
  onFilterChange,
  onSelectAccount,
  onSelectSection,
}: {
  readonly deskIds: readonly string[];
  readonly accountId: string;
  readonly section: AccountsSection;
  readonly sections: readonly PageSection<AccountsSection>[];
  readonly accounts: Parameters<typeof AccountSwitcher>[0]["accounts"];
  readonly query: string;
  readonly onFilterChange: (next: string) => void;
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
            sections={sections}
            current={section}
            onSelect={onSelectSection}
            variant="horizontal"
          />
        </div>
        <CockpitBody
          section={section}
          deskIds={deskIds}
          accountId={accountId}
          query={query}
          onFilterChange={onFilterChange}
        />
      </div>
    </PageFrame>
  );
}

export const Route = createFileRoute("/accounts")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(asId(search.account) ? { account: asId(search.account) } : {}),
    ...(typeof search.section === "string" && ALL_SECTIONS.some((s) => s.id === search.section)
      ? { section: search.section as AccountsSection }
      : {}),
    ...(typeof search.q === "string" && search.q.length > 0 && search.q.length <= 100
      ? { q: search.q }
      : {}),
  }),
  component: AccountsPage,
});
