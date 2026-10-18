import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import { positionAnchor } from "./position-anchor";

/**
 * WHICH POSITION'S FULL PAGE IS OPEN — `?position=<symbol>` (#5070 slice 6; round 2 of #5037, R2's
 * depth ladder step 4). "Full page ›" sits only inside a row's opened guidance, and the page's one
 * way back, "← Positions", returns to that row, still open (Eric's More 5, 9cda6977). The URL holds
 * both halves, so the browser's back does what "← Positions" does and a page is linkable:
 *  - `?open=<symbol>#pos-<symbol>` on the list's own entry: that row's guidance starts open, and
 *    the blotter lands on it (`position-anchor.ts`);
 *  - `?position=<symbol>` on the page's entry, pushed on top of it.
 * Opening REPLACES the list's entry with the first, then PUSHES the second — the same two steps
 * `use-order-detail.ts` takes for an order's full detail — so stepping back is one step in history
 * and the list's filter, sort and lens come back as they were. A page that arrived by link, with
 * nothing pushed in this visit, goes back by replacing its URL with the list's, never by leaving
 * the site.
 *
 * The list unmounts while the page shows, so which entry this visit pushed is kept here, beside the
 * hook, rather than in a component's ref.
 */

/** The page's own URL as this visit pushed it, so "← Positions" knows the step back is ours. */
let pushedHref: string | undefined;

const MAX_SYMBOL = 32;

/** A symbol from the URL, bounded: tickers and OCC contracts only. */
export function symbolParam(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim().toUpperCase();
  return text.length > 0 && text.length <= MAX_SYMBOL && /^[A-Z0-9.]+$/.test(text)
    ? text
    : undefined;
}

/** `?position=` and `?open=`, each a bounded symbol or no param. */
export function positionPageFromSearch(search: Record<string, unknown>): {
  readonly position?: string;
  readonly open?: string;
} {
  const position = symbolParam(search.position);
  const open = symbolParam(search.open);
  return { ...(position ? { position } : {}), ...(open ? { open } : {}) };
}

export function usePositionPage(): {
  /** The symbol whose full page is open. */
  readonly page: string | undefined;
  /** The symbol whose row's guidance starts open on the list. */
  readonly open: string | undefined;
  readonly openPage: (symbol: string) => void;
  readonly closePage: () => void;
} {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const { position: page, open } = positionPageFromSearch(search);

  const openPage = useCallback(
    (symbol: string) => {
      void navigate({
        search: (prev: Record<string, unknown>) => ({ ...prev, open: symbol }) as never,
        hash: positionAnchor(symbol),
        replace: true,
        resetScroll: false,
        hashScrollIntoView: false,
      })
        .then(() =>
          navigate({
            search: (prev: Record<string, unknown>) => ({ ...prev, position: symbol }) as never,
            hash: "",
          }),
        )
        .then(() => {
          pushedHref = window.location.href;
        });
    },
    [navigate],
  );

  const closePage = useCallback(() => {
    if (page === undefined) return;
    if (pushedHref !== undefined && pushedHref === window.location.href) {
      pushedHref = undefined;
      window.history.back();
      return;
    }
    pushedHref = undefined;
    void navigate({
      search: (prev: Record<string, unknown>) =>
        ({ ...prev, position: undefined, open: page }) as never,
      hash: positionAnchor(page),
      replace: true,
      // The list lands on the row itself (`position-anchor.ts`); no jump to the top first.
      resetScroll: false,
    });
  }, [navigate, page]);

  return { page, open, openPage, closePage };
}
