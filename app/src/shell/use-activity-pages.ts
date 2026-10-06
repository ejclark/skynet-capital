import { useCallback, useEffect, useRef, useState } from "react";
import { type DeskActivity, type DeskActivityEvent, fetchDeskActivity } from "../live/desk";
import { targetedActivityRow } from "./activity-table";

/**
 * AN ACCOUNT'S OLDER ORDERS (#4650) — `/api/desk/:id/activity` hands back 30 orders and a cursor;
 * this walks back from it, the league Activity page's "load older" state kept beside react-query's
 * first page rather than merged into its cache, so a window-focus refetch of the first page simply
 * starts the walk over. Older pages are asked for under the same filter as the first, and the
 * server narrows before it cuts a page, so the walk continues the filtered list.
 *
 * A LINK TO ONE ORDER (`#act-<orderId>` — a Thesis marker, a Heartbeat pass's trade) may point
 * further back than the first page. The walk then loads older pages on its own until the row is
 * there, at most `FIND_PAGES` of them, and the row scrolls itself in when it mounts
 * (`activity-table.tsx`). Past that bound it stops and `missing` says the order is further back:
 * one link never reads the whole ledger.
 */

/** How many older pages a link to one order loads by itself before leaving it to the button. */
export const FIND_PAGES = 5;

export interface ActivityPages {
  /** The first page and every older one loaded since, newest first. */
  readonly rows: readonly DeskActivityEvent[];
  /** Absent when nothing older exists. */
  readonly loadOlder?: () => void;
  readonly loading: boolean;
  readonly failed: boolean;
  /** The linked order is not among the rows and the walk has stopped: `older` while more pages
   *  remain, `absent` once the list is exhausted. Undefined with no link, or once it is found. */
  readonly missing?: "older" | "absent";
}

const holds = (row: DeskActivityEvent, anchor: string): boolean =>
  `act-${row.orderId}` === anchor ||
  (row.legs ?? []).some((leg) => `act-${leg.orderId}` === anchor);

export function useActivityPages(
  id: string,
  symbol: string | undefined,
  playbook: string | undefined,
  first: DeskActivity | undefined,
  /** `first` is the last filter's page, kept up while the new filter's arrives: nothing older is
   *  asked for under the new filter from the old page's cursor. */
  stale = false,
): ActivityPages {
  const [base, setBase] = useState(first);
  const [older, setOlder] = useState<readonly DeskActivityEvent[]>([]);
  const [cursor, setCursor] = useState(first?.nextCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [walked, setWalked] = useState(0);
  // A fresh first page (a refetch, a new filter) starts the walk over — set during render, so no
  // frame ever pairs the new first page with the old one's older rows or cursor.
  if (base !== first) {
    setBase(first);
    setOlder([]);
    setCursor(first?.nextCursor);
    setLoading(false);
    setFailed(false);
    setWalked(0);
  }
  // The first page the screen shows now: a page asked for under an older one is dropped on arrival.
  const current = useRef(first);
  // A ref, not state: StrictMode's doubled effect must not fetch the same page twice.
  const busy = useRef(false);
  useEffect(() => {
    current.current = first;
    busy.current = false;
  }, [first]);

  const loadOlder = useCallback((): boolean => {
    if (!cursor || stale || busy.current) return false;
    busy.current = true;
    setLoading(true);
    setFailed(false);
    const settle = (apply: () => void) => {
      if (current.current !== first) return;
      busy.current = false;
      setLoading(false);
      apply();
    };
    void fetchDeskActivity(id, { before: cursor, symbol, playbook }).then(
      (page) =>
        settle(() => {
          setOlder((prev) => [...prev, ...page.activity]);
          setCursor(page.nextCursor);
        }),
      () => settle(() => setFailed(true)),
    );
    return true;
  }, [id, symbol, playbook, cursor, first, stale]);

  const rows = first ? [...first.activity, ...older] : [];
  const target = targetedActivityRow();
  const found = target === undefined || rows.some((row) => holds(row, target));
  const live = first !== undefined && !stale;
  const walking = live && !found && cursor !== undefined && !failed && walked < FIND_PAGES;
  useEffect(() => {
    if (walking && !loading && loadOlder()) setWalked((n) => n + 1);
  }, [walking, loading, loadOlder]);

  const stopped = live && !found && !walking && !loading;
  return {
    rows,
    ...(cursor && !stale ? { loadOlder: () => void loadOlder() } : {}),
    loading,
    failed,
    ...(stopped ? { missing: cursor ? ("older" as const) : ("absent" as const) } : {}),
  };
}
