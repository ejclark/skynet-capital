import { useQuery } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { fetchDeskActivity } from "../live/desk";
import { ActivityFilterBar } from "./activity-filter-bar";
import { ActivityLedger } from "./activity-ledger";
import { type ActivityPages, useActivityPages } from "./use-activity-pages";
import { useMediaQuery } from "./use-media";
import { useOrderDetail } from "./use-order-detail";
import { TABLET_QUERY } from "./widths";

/**
 * ONE ACCOUNT'S ORDER LEDGER, PAGED AND NARROWED — the list both homes render: the any-account
 * page's Activity (`routes/u.$id.activity.tsx`) and the owner's Profile → Activity with one account
 * picked (`routes/accounts.tsx`, #5165 — it read only the newest 30 and simply stopped). The route
 * owns the URL (`?symbol=` · `?playbook=`); this owns the read, the walk back and the box's typing.
 *
 * OLDER ORDERS AND NARROWING (#4650, plan #4642): the ledger arrives 30 orders at a time and "Load
 * older orders" walks back (`use-activity-pages.ts`, which also walks to a linked order on its
 * own). A symbol box and the owner's playbook chips narrow it. The server narrows before it cuts a
 * page, so a filtered first page is 30 matching orders and "load older" continues the filtered
 * list. Once the walk reaches the end, the list says so (#5165) — a list that just stops reads the
 * same as one that was cut. Mobile-first: at 390px the box, the chips and the rows stack; a wider
 * screen only gives them room.
 */

export interface ActivityNarrowing {
  readonly symbol?: string | undefined;
  readonly playbook?: string | undefined;
}

const MAX_SYMBOL = 32;
const MAX_PLAYBOOK = 80;

/** `?symbol=` and `?playbook=`, each optional and bounded; the symbol upper-cased so "nvda" and
 *  "NVDA" are one read. Anything else (a non-string, an over-long value) is no filter at all. */
export function narrowingFromSearch(search: Record<string, unknown>): {
  readonly symbol?: string;
  readonly playbook?: string;
} {
  const text = (value: unknown, max: number): string | undefined =>
    typeof value === "string" && value.trim() !== "" && value.length <= max
      ? value.trim()
      : undefined;
  const symbol = text(search.symbol, MAX_SYMBOL)?.toUpperCase();
  const playbook = text(search.playbook, MAX_PLAYBOOK);
  return { ...(symbol ? { symbol } : {}), ...(playbook ? { playbook } : {}) };
}

/** What is narrowed, in words — so an empty result names the filter that emptied it. */
function narrowedTo({ symbol, playbook }: ActivityNarrowing): string {
  return [symbol ? `on ${symbol}` : "", playbook ? `from the ${playbook} playbook` : ""]
    .filter(Boolean)
    .join(" ");
}

function Ledger({
  pages,
  narrowing,
  refreshing,
  showPlaybook,
  deskId,
  onClear,
  detail,
  onDetail,
  paging,
}: {
  readonly pages: ActivityPages;
  readonly narrowing: ActivityNarrowing;
  /** A new filter's first page is on its way; the rows on screen are the last filter's. */
  readonly refreshing: boolean;
  readonly showPlaybook: boolean;
  readonly deskId: string;
  readonly onClear: () => void;
  readonly detail: string | undefined;
  readonly onDetail: (orderId: string | undefined) => void;
  /** An order's full detail is open as a page (#5101): the list's own controls step aside too. */
  readonly paging: boolean;
}): ReactElement {
  const narrowed = narrowedTo(narrowing);
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
  // The ledger keeps one place in the tree whether or not a page stands in for the list, so the
  // row a page steps back to is the same component, still holding which row to reopen.
  return (
    <>
      {pages.missing && !paging ? (
        <p className="note">
          {pages.missing === "older"
            ? `The order this link points to is older than the ${pages.rows.length} loaded here — load older orders to reach it.`
            : "The order this link points to isn't in this list."}
        </p>
      ) : null}
      <div className={refreshing ? "ledger-refreshing" : undefined} aria-busy={refreshing}>
        <ActivityLedger
          events={pages.rows}
          showPlaybook={showPlaybook}
          deskId={deskId}
          detail={detail}
          onDetail={onDetail}
        />
      </div>
      {pages.loadOlder && !paging ? (
        <button
          type="button"
          className="btn wire-load-more"
          onClick={pages.loadOlder}
          disabled={pages.loading}
        >
          {pages.loading ? "Loading…" : "Load older orders"}
        </button>
      ) : null}
      {pages.failed && !paging ? (
        <p className="set-err">Couldn't load older orders — try again.</p>
      ) : null}
      {!(pages.loadOlder || refreshing || paging) ? (
        <p className="note activity-end">
          That's the oldest order{narrowed ? ` ${narrowed}` : ""} in this account's ledger.
        </p>
      ) : null}
    </>
  );
}

export function AccountActivity({
  id,
  narrowing,
  onNarrow,
  showPlaybook,
  header,
}: {
  readonly id: string;
  /** The narrowing the URL holds. */
  readonly narrowing: ActivityNarrowing;
  /** Writes a new narrowing to the URL (replaced, keeping the page's place — the route's job). */
  readonly onNarrow: (next: ActivityNarrowing) => void;
  /** A bot's playbook is its owner's to see (#885) — the server withholds it from anyone else. */
  readonly showPlaybook: boolean;
  /** The route's own heading, stepped aside with the list when an order's detail is a page. */
  readonly header?: ReactNode;
}): ReactElement {
  const { symbol, playbook } = narrowing;
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
  const typeSymbol = (next: string) => {
    setSymbolText(next);
    clearTimeout(urlTimer.current);
    const clean = next.trim().toUpperCase();
    urlTimer.current = setTimeout(
      () => onNarrow({ symbol: clean === "" ? undefined : clean }),
      300,
    );
  };
  const clear = () => {
    clearTimeout(urlTimer.current);
    setSymbolText("");
    onNarrow({ symbol: undefined, playbook: undefined });
  };

  // An order's full detail (#5101): at tablet width and below it is a page in the list's place, so
  // the heading and the filter step aside with the list; wider, it is a panel beside them.
  const { detail, setDetail } = useOrderDetail();
  const stacked = useMediaQuery(TABLET_QUERY);
  const paging =
    stacked && detail !== undefined && pages.rows.some((r) => r.orderId === detail && !r.lifecycle);

  return (
    <>
      {paging ? null : header}
      {activity.isPending ? (
        <p className="note">Reading the ledger…</p>
      ) : activity.isError ? (
        <p className="note">The ledger is unreachable.</p>
      ) : !activity.data.available ? (
        <p className="note">No durable activity ledger is wired in this deployment.</p>
      ) : (
        <>
          {paging ? null : (
            <ActivityFilterBar
              symbol={symbolText}
              onSymbol={typeSymbol}
              playbooks={activity.data.playbooks}
              playbook={playbook}
              onPlaybook={(next) => onNarrow({ playbook: next })}
            />
          )}
          <Ledger
            pages={pages}
            narrowing={narrowing}
            refreshing={activity.isPlaceholderData}
            showPlaybook={showPlaybook}
            deskId={id}
            onClear={clear}
            detail={detail}
            onDetail={setDetail}
            paging={paging}
          />
        </>
      )}
    </>
  );
}
