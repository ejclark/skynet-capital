import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { fetchDesk, fetchDeskActivity } from "../live/desk";
import { useRefineSearch } from "../live/refine-search";
import { AccountPage, useOwnsAccount } from "../shell/account-head";
import { ActivityFilterBar } from "../shell/activity-filter-bar";
import { ActivityTable } from "../shell/activity-table";
import { PageFrame } from "../shell/frame";
import { type ActivityPages, useActivityPages } from "../shell/use-activity-pages";

/**
 * THE ANY-ACCOUNT PAGE'S ACTIVITY (#3807 slice 2d, dead end 5) — the account's order ledger, the
 * same `ActivityTable` the Profile page's Activity renders, fed by the same per-account read
 * (`/api/desk/:id/activity`). Each row carries `id="act-<orderId>"`, so the Thesis markers and a
 * bot's "passes that did trade" land on a row that exists. Reads are public inside the invite
 * gate by design; nothing here writes. One exception: a bot's decision names its playbook only for
 * the bot's owner (#885: "at this time, we do not show what playbooks others are using") — the
 * server withholds it from anyone else and the table is told not to draw it.
 *
 * OLDER ORDERS AND NARROWING (#4650, plan #4642): the ledger arrives 30 orders at a time and "Load
 * older orders" walks back (`use-activity-pages.ts`, which also walks to a linked order on its
 * own). A symbol box and the owner's playbook chips narrow it (`?symbol=` · `?playbook=`, URL state
 * like the league Activity page's filter: the box is immediate, the URL a beat behind). The server
 * narrows before it cuts a page, so a filtered first page is 30 matching orders and "load older"
 * continues the filtered list. Mobile-first: at 390px the box, the chips and the rows stack; a wider
 * screen only gives them room.
 */

const MAX_SYMBOL = 32;
const MAX_PLAYBOOK = 80;

interface ActivitySearch {
  readonly symbol?: string;
  readonly playbook?: string;
}

/** What is narrowed, in words — so an empty result names the filter that emptied it. */
function narrowedTo({ symbol, playbook }: ActivitySearch): string {
  return [symbol ? `on ${symbol}` : "", playbook ? `from the ${playbook} playbook` : ""]
    .filter(Boolean)
    .join(" ");
}

function Ledger({
  pages,
  search,
  refreshing,
  showPlaybook,
  deskId,
  onClear,
}: {
  readonly pages: ActivityPages;
  readonly search: ActivitySearch;
  /** A new filter's first page is on its way; the rows on screen are the last filter's. */
  readonly refreshing: boolean;
  readonly showPlaybook: boolean;
  readonly deskId: string;
  readonly onClear: () => void;
}): ReactElement {
  const narrowed = narrowedTo(search);
  if (pages.rows.length === 0) {
    return narrowed ? (
      <p className="note activity-no-match">
        No orders {narrowed} in this account's ledger.
        <button type="button" className="btn activity-clear" onClick={onClear}>
          Clear the filter
        </button>
      </p>
    ) : (
      <p className="note">No recorded orders in the ledger's window.</p>
    );
  }
  return (
    <>
      {pages.missing ? (
        <p className="note">
          {pages.missing === "older"
            ? `The order this link points to is older than the ${pages.rows.length} loaded here — load older orders to reach it.`
            : "The order this link points to isn't in this list."}
        </p>
      ) : null}
      <div className={refreshing ? "ledger-refreshing" : undefined} aria-busy={refreshing}>
        <ActivityTable events={pages.rows} showPlaybook={showPlaybook} deskId={deskId} />
      </div>
      {pages.loadOlder ? (
        <button
          type="button"
          className="btn wire-load-more"
          onClick={pages.loadOlder}
          disabled={pages.loading}
        >
          {pages.loading ? "Loading…" : "Load older orders"}
        </button>
      ) : null}
      {pages.failed ? <p className="set-err">Couldn't load older orders — try again.</p> : null}
    </>
  );
}

function ActivityPage(): ReactElement {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const { symbol, playbook } = search;
  const refine = useRefineSearch<typeof search>();
  const isOwn = useOwnsAccount(id);
  const desk = useQuery({ queryKey: ["desk", id], queryFn: () => fetchDesk(id) });
  const narrowed = symbol !== undefined || playbook !== undefined;
  const activity = useQuery({
    // Unnarrowed, the key every other reader of this ledger shares (the Trade page's strips).
    queryKey: narrowed ? ["desk-activity", id, { symbol, playbook }] : ["desk-activity", id],
    queryFn: () => fetchDeskActivity(id, { symbol, playbook }),
    refetchOnWindowFocus: true,
    // A new filter keeps the last rows up while its own arrive — never another account's rows.
    placeholderData: (previous, query) => (query?.queryKey[1] === id ? previous : undefined),
  });
  const pages = useActivityPages(id, symbol, playbook, activity.data, activity.isPlaceholderData);

  // The box is immediate locally; the URL (and so the read) follows a beat behind, replaced, never
  // pushed, and the page keeps its place (#4944) — the league Activity page's discipline.
  const [symbolText, setSymbolText] = useState(symbol ?? "");
  const urlTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(urlTimer.current), []);
  const narrow = (next: ActivitySearch) => refine((prev) => ({ ...prev, ...next }));
  const typeSymbol = (next: string) => {
    setSymbolText(next);
    clearTimeout(urlTimer.current);
    const clean = next.trim().toUpperCase();
    urlTimer.current = setTimeout(() => narrow({ symbol: clean === "" ? undefined : clean }), 300);
  };
  const clear = () => {
    clearTimeout(urlTimer.current);
    setSymbolText("");
    narrow({ symbol: undefined, playbook: undefined });
  };

  if (desk.isPending)
    return (
      <PageFrame>
        <p className="note">Reading the account…</p>
      </PageFrame>
    );
  if (desk.isError)
    return (
      <PageFrame>
        <p className="note">This account is unreachable.</p>
      </PageFrame>
    );

  const d = desk.data.desk;
  return (
    <AccountPage desk={d}>
      <header className="page-header">
        <h2>Activity</h2>
        <p>Every order this account placed, newest first — what it did, at what price, and why.</p>
      </header>
      {activity.isPending ? (
        <p className="note">Reading the ledger…</p>
      ) : activity.isError ? (
        <p className="note">The ledger is unreachable.</p>
      ) : !activity.data.available ? (
        <p className="note">No durable activity ledger is wired in this deployment.</p>
      ) : (
        <>
          <ActivityFilterBar
            symbol={symbolText}
            onSymbol={typeSymbol}
            playbooks={activity.data.playbooks}
            playbook={playbook}
            onPlaybook={(next) => narrow({ playbook: next })}
          />
          <Ledger
            pages={pages}
            search={search}
            refreshing={activity.isPlaceholderData}
            showPlaybook={isOwn}
            deskId={id}
            onClear={clear}
          />
        </>
      )}
    </AccountPage>
  );
}

/** `?symbol=` and `?playbook=`, each optional and bounded; the symbol upper-cased so "nvda" and
 *  "NVDA" are one read. Anything else (a non-string, an over-long value) is no filter at all. */
function readSearch(search: Record<string, unknown>): ActivitySearch {
  const text = (value: unknown, max: number): string | undefined =>
    typeof value === "string" && value.trim() !== "" && value.length <= max
      ? value.trim()
      : undefined;
  const symbol = text(search.symbol, MAX_SYMBOL)?.toUpperCase();
  const playbook = text(search.playbook, MAX_PLAYBOOK);
  return { ...(symbol ? { symbol } : {}), ...(playbook ? { playbook } : {}) };
}

export const Route = createFileRoute("/u/$id/activity")({
  validateSearch: readSearch,
  component: ActivityPage,
});
