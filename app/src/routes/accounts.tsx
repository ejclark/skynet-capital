import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  type DeskActivityEvent,
  type DeskSnapshot,
  fetchDesk,
  fetchDeskActivity,
} from "../live/desk";
import { parseOn } from "../live/horizon-params";
import { meetMoneypenny } from "../live/moneypenny";
import { fetchNetWorth } from "../live/networth";
import { fetchSettings, type OwnedAccount } from "../live/settings";
import { ALL_ACCOUNTS } from "../shell/account-switcher";
import { OverviewSection } from "../shell/accounts-overview-section";
import { ActivityTable } from "../shell/activity-table";
import { CockpitHead, resolveNetWorth } from "../shell/cockpit-head";
import { useDefaultAccount } from "../shell/default-account";
import { EventsSection } from "../shell/events-section";
import { FeedbackSection } from "../shell/feedback-section";
import { PageFrame } from "../shell/frame";
import { HeartbeatSection } from "../shell/heartbeat";
import type { MilestoneChapter } from "../shell/milestone-card";
import { MilestonesSection } from "../shell/milestones-section";
import { parseLens } from "../shell/positions-lens";
import {
  type AccountsSection,
  chapterFromSearch,
  defaultSection,
  sectionFromSearch,
  sectionsFor,
} from "../shell/profile-sections";
import type { PageSection } from "../shell/sections";
import { resolveSection } from "../shell/sections";
import { ThesisDrawer } from "../shell/thesis-drawer";

/**
 * THE PROFILE PAGE (#2321, the Cockpit): a unified per-account view whose sticky head carries the
 * net-worth at-a-glance and a horizontal section switch that stay visible while the section
 * detail scrolls below. One owned account or "All accounts" combined, human and bot alike —
 * Alpaca has no such distinction, so this page never branches on `kind` beyond the switcher's own
 * label and which bot-only sections appear. The head is `shell/cockpit-head.tsx`; the section
 * list, its order and its default are `shell/profile-sections.ts`.
 *
 * SECTIONS: **Overview** (cash/position note, chart/roster, considerations, then the positions
 * blotter), **Activity** and **Events** (#3807 slice 2c — the book's calendar: the grid beside an
 * agenda of what falls on each day for the tickers held; its grid head is the page's one range
 * control there, a picked day is `?events=`) apply to every account; **Heartbeat** and **Thesis**
 * are bot-only (#3345/#3350/#3687). **Milestones** and **Feedback** are the VIEWER's (#3807 slice
 * 2b, #888): what `/learn` (+ its chapters `/onboarding`, `/learn/trading`, `/playbooks`, now
 * `?chapter=`) and `/feedback` were, moved as they were — those routes are redirects now, and the
 * Profile link row is gone from this page because the switch is the map. PROGRESSIVE DISCLOSURE:
 * the sticky {@link CockpitHead} is the always-visible summary layer; the switch reveals one
 * section's full detail at a time. The net-worth payload is one `/api/accounts/networth` fetch that
 * carries every owned account plus the aggregate, so the switcher never triggers a re-fetch.
 *
 * THE ZERO-ACCOUNT DOOR (#3807 slice 2b — no fold before its door is written): a member with no
 * linked account gets this same page, never an early return — the head says "No account linked
 * yet", and the page opens on Milestones with the Onboarding chapter (the connect guide) open.
 * The topbar's Profile tab always lands here; the page opens on Milestones while nothing is
 * linked and on the Overview once an account is (`defaultSection` says why that is narrower).
 */

type ProfileSearch = ReturnType<typeof Route.useSearch>;

function fetchDesks(ids: readonly string[]): Promise<DeskSnapshot[]> {
  return Promise.all(ids.map((id) => fetchDesk(id)));
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
    enabled: deskIds.length > 0,
  });
  if (deskIds.length === 0)
    return <p className="note">No account linked yet — its orders will be listed here.</p>;
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
  const search = Route.useSearch();
  const { account: asked, q, moneypenny } = search;
  const queryClient = useQueryClient();
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

  // `?moneypenny=intro` — the deep link every "Meet Moneypenny ›" uses (M·01's step 2, once
  // `/onboarding`'s): open her rail with the intro, then drop the param so a remount can't refire.
  useEffect(() => {
    if (moneypenny !== "intro") return;
    void meetMoneypenny();
    void navigate({ search: (prev) => ({ ...prev, moneypenny: undefined }), replace: true });
  }, [moneypenny, navigate]);

  if (settings.isPending || settings.isError)
    return (
      <PageFrame>
        <p className="note">
          {settings.isError ? "Accounts are unreachable." : "Reading your accounts…"}
        </p>
      </PageFrame>
    );

  const { accounts } = settings.data;
  const linked = accounts.length > 0;
  // The default account (shell/default-account.ts) is a viewer-chosen FALLBACK, never trusted
  // once it no longer names an owned account — a removed account can't strand the page.
  const storedDefaultId = defaultAccount.id;
  const fallbackId =
    storedDefaultId !== undefined && accounts.some((a) => a.id === storedDefaultId)
      ? storedDefaultId
      : (accounts[0]?.id ?? "");
  const selected =
    asked === ALL_ACCOUNTS || accounts.some((a) => a.id === asked) ? (asked as string) : fallbackId;
  const deskIds = !linked ? [] : selected === ALL_ACCOUNTS ? accounts.map((a) => a.id) : [selected];
  const selectedKind =
    selected === ALL_ACCOUNTS ? undefined : accounts.find((a) => a.id === selected)?.kind;
  const sections = sectionsFor(selectedKind, linked);
  const opening = defaultSection(linked);
  const section = resolveSection(sections, search.section ?? opening);
  // The zero-account door opens its Milestones on the connect guide.
  const chapter =
    search.chapter ?? (!linked && section === "milestones" ? "onboarding" : undefined);

  return (
    <AccountsBody
      accountId={selected}
      deskIds={deskIds}
      section={section}
      sections={sections}
      chapter={chapter}
      accounts={accounts}
      query={query}
      onFilterChange={onFilterChange}
      isDefault={linked && storedDefaultId === selected}
      onToggleDefault={() =>
        storedDefaultId === selected
          ? defaultAccount.clearDefault()
          : defaultAccount.setDefault(selected)
      }
      onSelectAccount={(id) =>
        void navigate({
          search: (prev) => ({ ...prev, account: id === fallbackId ? undefined : id }),
          replace: true,
        })
      }
      onJoined={() => void queryClient.invalidateQueries({ queryKey: ["settings"] })}
      pinnedDay={search.events}
      onPickDay={(day) =>
        void navigate({ search: (prev) => ({ ...prev, events: day }), replace: true })
      }
      onSelectSection={(next) => {
        // Overview's filter means nothing on Events, and a stale one must not resurface on the
        // way back (the switch spec proves the blotter's count survives the round trip): crossing
        // into or out of Events drops `q` — the pending debounce too — and the picked day.
        const crossing = next === "events" || section === "events";
        if (crossing) {
          clearTimeout(urlTimer.current);
          setQuery("");
        }
        void navigate({
          search: (prev: ProfileSearch) => ({
            ...prev,
            // The page's own default rides no param — so the default is written out whenever
            // the member picks anything else, and omitted when they pick it back.
            section: next === opening ? undefined : next,
            // A chapter belongs to Milestones; leaving it closes the chapter.
            chapter: next === "milestones" ? prev.chapter : undefined,
            ...(crossing ? { q: undefined, events: undefined } : {}),
          }),
          replace: true,
        });
      }}
    />
  );
}

/** The scrollable section content — owns the desks query (only the book's sections read it) and
 *  reads the shared net-worth query for the Overview. React Query deduplicates the net-worth fetch
 *  that {@link CockpitHead} already started for the sticky head. */
function CockpitBody({
  section,
  deskIds,
  accountId,
  accounts,
  chapter,
  query,
  onFilterChange,
  pinnedDay,
  onPickDay,
  onJoined,
}: {
  readonly section: AccountsSection;
  readonly deskIds: readonly string[];
  readonly accountId: string;
  /** Every account the session owns — the league card highlights all of them (#3689). */
  readonly accounts: readonly OwnedAccount[];
  readonly chapter: MilestoneChapter | undefined;
  readonly query: string;
  readonly onFilterChange: (next: string) => void;
  readonly pinnedDay: string | undefined;
  readonly onPickDay: (day: string | undefined) => void;
  readonly onJoined: () => void;
}): ReactElement {
  const desks = useQuery({
    queryKey: ["desks", deskIds.join(",")],
    queryFn: () => fetchDesks(deskIds),
    // Overview needs the desk snapshot both for the considerations rail and for the positions
    // blotter it carries; Heartbeat, Thesis and the viewer's sections read their own endpoints.
    enabled:
      deskIds.length > 0 &&
      (section === "overview" || section === "activity" || section === "events"),
  });
  const networth = useQuery({
    queryKey: ["accounts-networth"],
    queryFn: fetchNetWorth,
    enabled: accounts.length > 0,
  });

  if (section === "milestones")
    return (
      <MilestonesSection
        chapter={chapter}
        ladderAccount={accounts.length > 1 ? accounts[0]?.name : undefined}
        onJoined={onJoined}
      />
    );
  if (section === "feedback") return <FeedbackSection />;
  if (section === "heartbeat") return <HeartbeatSection deskId={accountId} />;
  if (section === "thesis") return <ThesisDrawer id={accountId} />;
  if (section === "events")
    return (
      <EventsSection
        desks={deskIds.length === 0 ? [] : desks.data}
        desksLoading={deskIds.length > 0 && desks.isPending}
        desksError={desks.isError}
        day={pinnedDay}
        onPickDay={onPickDay}
      />
    );
  if (section === "overview") {
    const { stats, caption, allAccounts, roster } = resolveNetWorth(networth.data, accountId);
    return (
      <OverviewSection
        stats={stats}
        caption={caption}
        owned={accounts}
        allAccounts={allAccounts}
        roster={roster}
        loading={networth.isPending}
        error={networth.isError}
        accountId={accountId}
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
  sections,
  isDefault,
  onToggleDefault,
  onSelectAccount,
  onSelectSection,
  ...body
}: Parameters<typeof CockpitBody>[0] & {
  readonly sections: readonly PageSection<AccountsSection>[];
  readonly isDefault: boolean;
  readonly onToggleDefault: () => void;
  readonly onSelectAccount: (id: string) => void;
  readonly onSelectSection: (section: AccountsSection) => void;
}): ReactElement {
  return (
    <PageFrame>
      <h1 className="visually-hidden">Accounts</h1>
      <div className="cockpit">
        <CockpitHead
          accounts={body.accounts}
          accountId={body.accountId}
          section={body.section}
          sections={sections}
          onSelectSection={onSelectSection}
          onSelectAccount={onSelectAccount}
          isDefault={isDefault}
          onToggleDefault={onToggleDefault}
        />
        <CockpitBody {...body} />
      </div>
    </PageFrame>
  );
}

export const Route = createFileRoute("/accounts")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(asId(search.account) ? { account: asId(search.account) } : {}),
    ...sectionFromSearch(search.section),
    // The Milestones chapter open beneath the cards (#3807 slice 2b; once its own route, #1119).
    ...chapterFromSearch(search.chapter),
    ...(typeof search.q === "string" && search.q.length > 0 && search.q.length <= 100
      ? { q: search.q }
      : {}),
    // List · Map · Runway (#3689 slice 9): a lens on one positions list, not a route.
    ...(parseLens(search.lens) && search.lens !== "list" ? { lens: parseLens(search.lens) } : {}),
    // The Events section's picked day (#3807 slice 2c) — its own param, never the range's `?on=`.
    ...(parseOn(search.events) ? { events: parseOn(search.events) } : {}),
    // Moneypenny's intro deep link (M·01's step 2), consumed on arrival.
    ...(search.moneypenny === "intro" ? { moneypenny: "intro" as const } : {}),
  }),
  component: AccountsPage,
});
