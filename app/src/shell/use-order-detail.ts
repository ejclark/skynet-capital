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
 */
export function useOrderDetail(): {
  readonly detail: string | undefined;
  readonly setDetail: (orderId: string | undefined) => void;
} {
  const navigate = useNavigate();
  const { history } = useRouter();
  const search = useSearch({ strict: false }) as { readonly order?: unknown };
  const detail = typeof search.order === "string" ? search.order : undefined;
  const pushed = useRef(false);
  const setDetail = useCallback(
    (orderId: string | undefined) => {
      if (orderId !== undefined) {
        const hash = `act-${orderId}`;
        // The row is where the member just tapped: no hash jump moves the list under them.
        void navigate({
          search: true,
          hash,
          replace: true,
          resetScroll: false,
          hashScrollIntoView: false,
        }).then(() => {
          pushed.current = true;
          return navigate({
            search: (prev: Record<string, unknown>) => ({ ...prev, order: orderId }) as never,
            hash,
            resetScroll: false,
            hashScrollIntoView: false,
          });
        });
        return;
      }
      if (pushed.current) {
        pushed.current = false;
        history.back();
        return;
      }
      void navigate({
        search: (prev: Record<string, unknown>) => ({ ...prev, order: undefined }) as never,
        hash: true,
        replace: true,
        resetScroll: false,
      });
    },
    [navigate, history],
  );
  return { detail, setDetail };
}
