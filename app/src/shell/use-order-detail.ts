import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useCallback, useRef } from "react";

/**
 * WHICH ORDER'S FULL DETAIL IS OPEN — `?order=<orderId>#act-<orderId>` (#5101). The URL holds it, so
 * a decision is linkable (F-6b1caebc9e) and the browser's back does what "‹ Activity" does.
 *
 * Opening first REPLACES the list's own entry with `#act-<orderId>`, then PUSHES the detail. So the
 * one way back — "‹ Activity", Close, or the browser's back, which here are the same step back in
 * history — returns to the list at `#act-<orderId>`, and the ledger lands on that row
 * (`landing.ts`). A detail that arrived by link, with nothing pushed in this visit, closes by
 * replacing its URL with the list's, never by leaving the site.
 *
 * Both writes keep the scroll (`resetScroll: false`, #4944): the list beside a panel must not jump,
 * and a page moves its own view to its title (`order-deep-dive.tsx`).
 *
 * A desktop panel is not modal: the list beside it stays live, so its filter can change and a
 * second order's "Full detail ›" can be pressed while one is open. So the list's entry never
 * carries an `order`, and stepping back off a detail this hook pushed rewrites that entry as the
 * page reads now (`stepBack`): a second detail takes the first one's place rather than stacking on
 * it — else Close would step back onto the first order's panel — and a filter changed beside the
 * panel survives Close.
 */
export function useOrderDetail(): {
  readonly detail: string | undefined;
  readonly setDetail: (orderId: string | undefined) => void;
} {
  const navigate = useNavigate();
  const router = useRouter();
  const search = useSearch({ strict: false }) as { readonly order?: unknown };
  const detail = typeof search.order === "string" ? search.order : undefined;
  const pushed = useRef(false);
  const setDetail = useCallback(
    (orderId: string | undefined) => {
      const { history } = router;
      /** The page's search as it reads now, less the detail — what the list's entry should hold. */
      const listSearch = (): Record<string, unknown> => {
        const { order: _open, ...rest } = router.latestLocation.search as Record<string, unknown>;
        return rest;
      };
      /** Take back the step this hook pushed, write the list's entry as the page reads now with
       *  the hash on `hash`'s row, then `next`. */
      const stepBack = (hash: string, next?: () => void) => {
        pushed.current = false;
        const here = listSearch();
        const stop = history.subscribe(() => {
          stop();
          void navigate({
            search: () => here as never,
            hash,
            replace: true,
            resetScroll: false,
            hashScrollIntoView: false,
          }).then(next);
        });
        history.back();
      };

      if (orderId !== undefined) {
        if (orderId === detail) return;
        const hash = `act-${orderId}`;
        // The row is where the member just tapped: no hash jump moves the list under them.
        const push = () => {
          pushed.current = true;
          void navigate({
            search: (prev: Record<string, unknown>) => ({ ...prev, order: orderId }) as never,
            hash,
            resetScroll: false,
            hashScrollIntoView: false,
          });
        };
        // Another order's detail sits on the step this hook pushed: back to the list, then open
        // this one from there. (With no detail open, a `pushed` left by the browser's own back
        // names no step of ours, and stepping back would leave the list.)
        if (detail !== undefined && pushed.current) {
          stepBack(hash, push);
          return;
        }
        void navigate({
          search: () => listSearch() as never,
          hash,
          replace: true,
          resetScroll: false,
          hashScrollIntoView: false,
        }).then(push);
        return;
      }
      if (detail !== undefined && pushed.current) {
        stepBack(`act-${detail}`);
        return;
      }
      void navigate({
        search: () => listSearch() as never,
        hash: true,
        replace: true,
        resetScroll: false,
      });
    },
    [navigate, router, detail],
  );
  return { detail, setDetail };
}
