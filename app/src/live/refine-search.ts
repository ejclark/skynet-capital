import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

/**
 * A SAME-PAGE REFINEMENT KEEPS YOUR PLACE (#4944). TanStack Router scrolls to the top on every
 * navigation unless the call says `resetScroll: false` — a search-param refinement included — so
 * a filter chip, a lens or a calendar step tapped halfway down a page jumped it to the top a beat
 * later (Eric, 2026-09-22, on Trade: it "has the same effect as extreme content shift"). That fix
 * stayed per call site; this is the one place every refinement goes through instead, and
 * `tests/arch/same-page-scroll.spec.ts` fails a same-route navigate that sets neither this nor an
 * entry in its ledger of deliberate resets (a section or account switch, a jump to a ticket).
 *
 * `replace: true` for the same reason a refinement never pushes history: it's the same page, not
 * a new one to land back on. `S` is the route's search (`ReturnType<typeof Route.useSearch>`);
 * `useNavigate()` without a `from` types it as `never`, and the write lands on whatever route is
 * current, which is the point. Stable across renders, so it can sit in an effect's deps.
 */
export type RefineSearch<S> = (next: S | ((prev: S) => S)) => void;

export function useRefineSearch<S extends object = Record<string, unknown>>(): RefineSearch<S> {
  const navigate = useNavigate();
  return useCallback<RefineSearch<S>>(
    (next) => void navigate({ search: next as never, replace: true, resetScroll: false }),
    [navigate],
  );
}
