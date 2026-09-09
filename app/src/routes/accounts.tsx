import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { formatCurrency, formatSigned, pct, plClass } from "../../../src/observatory/render-atoms";
import {
  type DeskActivityEvent,
  type DeskSnapshot,
  fetchDesk,
  fetchDeskActivity,
} from "../live/desk";
import { fetchSettings } from "../live/settings";
import { AccountSwitcher, ALL_ACCOUNTS } from "../shell/account-switcher";
import { DeskTilesGrid } from "../shell/desk-tiles-grid";
import { PageFrame } from "../shell/frame";
import { PositionsTable } from "../shell/positions-table";
import { ProfileRail } from "../shell/profile-rail";
import { SectionSwitch } from "../shell/section-switch";
import { type PageSection, resolveSection } from "../shell/sections";
import { EventLine } from "../shell/timeline-drawer";

/**
 * PROFILE > ACCOUNTS (#2321) — the unified per-account view: Summary / Positions / Activity for
 * one owned account, or "All accounts" combined. Human and bot accounts render through the exact
 * same path (`fetchDesk`, `PositionsTable`, `DeskTilesGrid`) — Alpaca has no such distinction, so
 * this page never branches on `kind` beyond the switcher's own label.
 *
 * "All accounts" sums the RAW tile twins (`DeskTiles.*Raw`, added alongside this page) rather than
 * parsing the formatted strings a single account already carries — the one place this page departs
 * from "the server formats every number" is the aggregate itself, which no server endpoint
 * produces (#2321's interrogation: additive raw fields, not a new backend aggregate). The four
 * formatters here are the same pure functions `src/observatory/render-atoms.ts` uses server-side,
 * imported directly rather than re-implemented, so a single account and the aggregate can never
 * disagree about what "+$120" means.
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

/** The aggregate tile row for "All accounts" — summed raw twins, reformatted with the same
 *  functions the server uses, never a parse of an already-formatted string. */
function aggregateTiles(desks: readonly DeskSnapshot[]) {
  const openPositions = desks.reduce((sum, d) => sum + d.desk.tiles.openPositions, 0);
  const invested = desks.reduce((sum, d) => sum + d.desk.tiles.investedRaw, 0);
  const dayPlRaw = desks.reduce((sum, d) => sum + d.desk.tiles.dayPlRaw, 0);
  const unrealizedRaw = desks.reduce((sum, d) => sum + d.desk.tiles.unrealizedRaw, 0);
  const cash = desks.reduce((sum, d) => sum + d.desk.tiles.cashRaw, 0);
  const returnOnCost = invested > 0 ? (unrealizedRaw / invested) * 100 : 0;
  return {
    openPositions,
    invested: formatCurrency(invested),
    dayPl: formatSigned(dayPlRaw),
    dayTone: plClass(dayPlRaw),
    unrealized: formatSigned(unrealizedRaw),
    unrealizedNote: `${pct(returnOnCost)} on cost`,
    unrealizedTone: plClass(unrealizedRaw),
    cash: formatCurrency(cash),
  };
}

function SummarySection({ desks }: { readonly desks: readonly DeskSnapshot[] }): ReactElement {
  const tiles = desks.length === 1 ? desks[0]?.desk.tiles : aggregateTiles(desks);
  if (!tiles) return <p className="note">No account selected.</p>;
  return <DeskTilesGrid tiles={tiles} />;
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
      {desks.isPending ? <p className="note">Reading the desk…</p> : null}
      {desks.isError ? <p className="note">This account is unreachable.</p> : null}
      {desks.data ? (
        section === "summary" ? (
          <SummarySection desks={desks.data} />
        ) : section === "positions" ? (
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
