import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import {
  type DeskActivityEvent,
  type DeskSnapshot,
  fetchDesk,
  fetchDeskActivity,
} from "../live/desk";
import { fetchNetWorth, type NetWorthStatsView } from "../live/networth";
import { fetchSettings } from "../live/settings";
import { AccountSwitcher, ALL_ACCOUNTS } from "../shell/account-switcher";
import { PageFrame } from "../shell/frame";
import { NetWorthSummary } from "../shell/networth-summary";
import { PositionsTable } from "../shell/positions-table";
import { ProfileRail } from "../shell/profile-rail";
import { SectionSwitch } from "../shell/section-switch";
import { type PageSection, resolveSection } from "../shell/sections";
import { EventLine } from "../shell/timeline-drawer";

/**
 * PROFILE > ACCOUNTS (#2321) — the unified per-account view: Summary / Positions / Activity for
 * one owned account, or "All accounts" combined. Human and bot accounts render through the exact
 * same path — Alpaca has no such distinction, so this page never branches on `kind` beyond the
 * switcher's own label.
 *
 * The Summary section is the NET WORTH view: total value (± the day's move) and flow-adjusted ROI
 * over 7D/1M/3M/1Y, served as one `/api/accounts/networth` payload that carries every owned
 * account plus the aggregate — so one fetch serves both the single-account view (pick the row) and
 * "All accounts" (use the total), and the switcher never triggers a re-fetch. The windows' returns
 * come straight from Alpaca's own portfolio history (flow-adjusted, so a deposit never reads as a
 * gain); the aggregate per window is `Σend / Σbase − 1` across the accounts that reported one.
 * Positions and Activity still run through `fetchDesk` / `PositionsTable` as before.
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

function SummarySection({ accountId }: { readonly accountId: string }): ReactElement {
  const networth = useQuery({ queryKey: ["accounts-networth"], queryFn: fetchNetWorth });
  if (networth.isPending) return <p className="note">Reading your net worth…</p>;
  if (networth.isError || !networth.data)
    return <p className="note">Net worth is unreachable right now.</p>;
  const all = accountId === ALL_ACCOUNTS;
  const row = all ? null : (networth.data.accounts.find((a) => a.id === accountId) ?? null);
  const stats: NetWorthStatsView | null = all ? networth.data.total : row;
  if (!stats) return <p className="note">No account selected.</p>;
  const caption = all ? "all accounts" : (row?.name ?? "this account");
  return (
    <NetWorthSummary stats={stats} caption={caption} roster={all ? networth.data.accounts : []} />
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
      rail={
        <>
          <ProfileRail current="accounts" />
          <hr />
          <SectionSwitch
            sections={SECTIONS}
            current={section}
            onSelect={(next) =>
              void navigate({
                search: (prev) => ({ ...prev, section: next === "summary" ? undefined : next }),
                replace: true,
              })
            }
          />
        </>
      }
      accounts={accounts}
      onSelectAccount={(id) =>
        void navigate({
          search: (prev) => ({ ...prev, account: id === first.id ? undefined : id }),
          replace: true,
        })
      }
    />
  );
}

function AccountsBody({
  deskIds,
  accountId,
  section,
  rail,
  accounts,
  onSelectAccount,
}: {
  readonly deskIds: readonly string[];
  readonly accountId: string;
  readonly section: AccountsSection;
  readonly rail: ReactElement;
  readonly accounts: Parameters<typeof AccountSwitcher>[0]["accounts"];
  readonly onSelectAccount: (id: string) => void;
}): ReactElement {
  const desks = useQuery({
    queryKey: ["desks", deskIds.join(",")],
    queryFn: () => fetchDesks(deskIds),
    // Summary reads from `/api/accounts/networth`, not the desk — skip the blotter fetch until the
    // visitor opens Positions or Activity (the desk endpoint is cheap and cached, but a wasted
    // fetch on every summary view is still a wasted fetch).
    enabled: section !== "summary",
  });

  return (
    <PageFrame rail={rail}>
      <header className="page-header">
        <h1>Accounts</h1>
        <p>Your book — one account or all of them, the same way every time.</p>
      </header>
      <AccountSwitcher
        accounts={accounts}
        selectedId={accountId}
        onSelect={onSelectAccount}
        allowAll
      />
      {section === "summary" ? (
        <SummarySection accountId={accountId} />
      ) : desks.isPending ? (
        <p className="note">Reading the desk…</p>
      ) : desks.isError ? (
        <p className="note">This account is unreachable.</p>
      ) : desks.data ? (
        section === "positions" ? (
          <PositionsSection desks={desks.data} />
        ) : (
          <ActivitySection deskIds={deskIds} />
        )
      ) : null}
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
