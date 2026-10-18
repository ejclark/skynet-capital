import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useRefineSearch } from "../live/refine-search";
import { AccountActivity, narrowingFromSearch } from "../shell/account-activity";
import { useOwnsAccount } from "../shell/account-head";

/**
 * THE ANY-ACCOUNT PAGE'S LEDGER (#3807 slice 2d, dead end 5; named Activity until #5281) — the
 * account's orders, the same paged, narrowed list the Profile page's Ledger renders for one account
 * (`shell/account-activity.tsx`: cards on a phone, the table above it), fed by the same
 * per-account read (`/api/desk/:id/activity`). Each row carries `id="act-<orderId>"`, so the
 * Thesis markers and a bot's "passes that did trade" land on a row that exists. Reads are public
 * inside the invite gate by design; nothing here writes. One exception: a bot's decision names its
 * playbook only for the bot's owner (#885: "at this time, we do not show what playbooks others are
 * using") — the server withholds it from anyone else and the table is told not to draw it.
 *
 * This route owns only the URL: `?symbol=` · `?playbook=` (#4650, plan #4642) and `?order=`. The old
 * address, `/u/<id>/activity`, redirects here (`u.$id.activity.tsx`).
 */

const MAX_ORDER = 100;

interface ActivitySearch {
  readonly symbol?: string;
  readonly playbook?: string;
  /** The order whose full detail is open (#5101, `use-order-detail.ts`). */
  readonly order?: string;
}

function ActivityPage(): ReactElement {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const refine = useRefineSearch<typeof search>();
  const isOwn = useOwnsAccount(id);
  // The frame and head are the layout's (`u.$id.tsx`, #4951) — only the ledger reads here.
  return (
    <AccountActivity
      id={id}
      narrowing={search}
      onNarrow={(next) => refine((prev) => ({ ...prev, ...next }))}
      showPlaybook={isOwn}
      header={
        <header className="page-header">
          <h2>Ledger</h2>
          <p>
            Every order this account placed, newest first — what it did, at what price, and why.
          </p>
        </header>
      }
    />
  );
}

/** The narrowing (`narrowingFromSearch`) and `?order=`, bounded; anything else is no param. */
function readSearch(search: Record<string, unknown>): ActivitySearch {
  const order =
    typeof search.order === "string" &&
    search.order.trim() !== "" &&
    search.order.length <= MAX_ORDER
      ? search.order.trim()
      : undefined;
  return { ...narrowingFromSearch(search), ...(order ? { order } : {}) };
}

export const Route = createFileRoute("/u/$id/ledger")({
  validateSearch: readSearch,
  component: ActivityPage,
});
