import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
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
import { OverviewSection } from "../shell/accounts-overview-section";
import { ActivityTable } from "../shell/activity-table";
import { DecisionsSection } from "../shell/decisions-section";
import { useDefaultAccount } from "../shell/default-account";
import { PageFrame } from "../shell/frame";
import { NetWorthCondensed } from "../shell/networth-summary";
import { ProfileRail } from "../shell/profile-rail";
import { SectionSwitch } from "../shell/section-switch";
import { type PageSection, resolveSection } from "../shell/sections";
import { ThesisDrawer } from "../shell/thesis-drawer";

/**
 * PROFILE > ACCOUNTS (#2321) — the Cockpit: a unified per-account view whose sticky header carries
 * the net-worth at-a-glance (total value, day move, ROI pills) and a horizontal section switch that
 * stay visible while the section detail scrolls below. One owned account or "All accounts"
 * combined, human and bot alike — Alpaca has no such distinction, so this page never branches on
 * `kind` beyond the switcher's own label and which bot-only sections appear.
 *
 * SECTIONS: **Overview** (cash/position note, chart/roster, considerations, then the positions
 * blotter — Summary and Positions merged into one scroll once it was clear how little Summary
 * carried on its own, Eric live) and **Activity** apply to every account; **Decisions** (the
 * autonomous-trading audit trail) and **Thesis** (a persona's standing call, ported from the
 * retired `/u/:id/thesis`) are bot-only, added by `sectionsFor` when a single bot account is
 * selected. PROGRESSIVE DISCLOSURE: the sticky {@link NetWorthCondensed} is the always-visible
 * summary layer; the section switch reveals one section's full detail at a time. The net-worth
 * payload is one `/api/accounts/networth` fetch that carries every owned account plus the
 * aggregate, so the switcher never triggers a re-fetch. Windows' returns come straight from
 * Alpaca's own portfolio history (flow-adjusted, so a deposit never reads as a gain); the
 * aggregate per window is `Σend / Σbase − 1` across the accounts that reported one.
 */

type AccountsSection = "overview" | "activity" | "decisions" | "thesis";

/** Overview merges what were once separate Summary and Positions tabs (Eric: "the summary page
 *  does very little atm... summary and positions should be merged into a single section/view").
 *  The net-worth-at-a-glance stats stay in the sticky header ({@link NetWorthCondensed}); Overview
 *  is everything below it — the cash/considerations/chart detail Summary carried, then the
 *  positions blotter Positions carried, in one scroll. */
const BASE_SECTIONS: readonly PageSection<AccountsSection>[] = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
];

/** The full candidate list `validateSearch` accepts from a URL — the *rendered* set narrows this
 *  per account (`sectionsFor` below); an unknown or now-inapplicable value falls back via
 *  `resolveSection`, never strands the reader. A stale `?section=summary` or `?section=positions`
 *  link (from before the Overview merge) resolves the same way — as an unrecognized value that
 *  falls back to the first section, which is Overview. */
const ALL_SECTIONS: readonly PageSection<AccountsSection>[] = [
  ...BASE_SECTIONS,
  { id: "decisions", label: "Decisions" },
  { id: "thesis", label: "Thesis" },
];

/** Decisions and Thesis only make sense for one bot account at a time, never the "All accounts"
 *  aggregate or a human account — Decisions is autonomous trading's audit trail (Eric: "tied to
 *  autonomous trading... currently only bot accounts"), and Thesis is a persona's own standing call
 *  (the same reasoning: it's the bot's, not the portfolio's). */
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
  const defaultAccount = useDefaultAccount();

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

  // The default account (shell/default-account.ts) is a viewer-chosen FALLBACK, never trusted
  // once it no longer names an owned account — a removed account can't strand the page.
  const storedDefaultId = defaultAccount.id;
  const fallbackId =
    storedDefaultId !== undefined && accounts.some((a) => a.id === storedDefaultId)
      ? storedDefaultId
      : first.id;
  const selected =
    asked === ALL_ACCOUNTS || accounts.some((a) => a.id === asked) ? asked : fallbackId;
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
      isDefault={storedDefaultId === selected}
      onToggleDefault={() =>
        storedDefaultId === selected
          ? defaultAccount.clearDefault()
          : defaultAccount.setDefault(selected as string)
      }
      onSelectAccount={(id) =>
        void navigate({
          search: (prev) => ({ ...prev, account: id === fallbackId ? undefined : id }),
          replace: true,
        })
      }
      onSelectSection={(next) =>
        void navigate({
          search: (prev) => ({ ...prev, section: next === "overview" ? undefined : next }),
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
  const desks = useQuery({
    queryKey: ["desks", deskIds.join(",")],
    queryFn: () => fetchDesks(deskIds),
    // Overview needs the desk snapshot both for the considerations rail and for the positions
    // blotter it now carries, so it always fetches. Decisions and Thesis read their own endpoints,
    // not the desk, so they skip this fetch entirely.
    enabled: section === "overview" || section === "activity",
  });
  const networth = useQuery({ queryKey: ["accounts-networth"], queryFn: fetchNetWorth });

  if (section === "decisions") return <DecisionsSection deskId={accountId} />;
  if (section === "thesis") return <ThesisDrawer id={accountId} />;
  if (section === "overview") {
    const { stats, caption, allAccounts, roster } = resolveNetWorth(networth.data, accountId);
    const considerations = desks.data?.[0]?.desk.considerations ?? [];
    return (
      <OverviewSection
        stats={stats}
        caption={caption}
        allAccounts={allAccounts}
        roster={roster}
        loading={networth.isPending}
        error={networth.isError}
        accountId={accountId}
        considerations={considerations}
        desks={desks.data}
        desksLoading={desks.isPending}
        desksError={desks.isError}
        query={query}
        onFilterChange={onFilterChange}
      />
    );
  }
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
  isDefault,
  onToggleDefault,
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
  readonly isDefault: boolean;
  readonly onToggleDefault: () => void;
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
            isDefault={isDefault}
            onToggleDefault={onToggleDefault}
          />
          {section === "overview" ? null : stats ? (
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
