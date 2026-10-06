import { type UseQueryResult, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import { fetchPlaybookPerformance, type PlaybookMetricsView } from "../live/playbook-performance";
import { fetchPlaybookStore, type PlaybookStoreView } from "../live/playbook-store";
import { fetchSettings, type OwnedAccount } from "../live/settings";
import type { MetricsScope } from "./playbook-metrics";
import { PlaybookCard } from "./playbook-store-cards";

/**
 * R&D → PLAYBOOKS (#3623) — the one home for house playbooks. The Playbook Store (#885) used to
 * live on each account's desk (`/u/$id/playbooks`); Eric retired that placement on 2026-09-23 ("the
 * legacy route should not have the playbook store view"), so the catalog is studied and switched on
 * in one place and the account becomes a parameter of the action, chosen under "Subscribe as" —
 * a row in the section's own head since the rail left the frame (#3807 slice 2a).
 *
 * The picker lists only the viewer's OWN accounts (`/api/settings`, the session's owned ids), and
 * the server re-checks ownership on every read and write — a hand-typed `?account=` for someone
 * else's account renders the catalog with no controls, exactly as the old desk route did.
 */

export function usePlaybooksSection(active: boolean, accountId: string | undefined) {
  const accounts = useQuery({ queryKey: ["settings"], queryFn: fetchSettings, enabled: active });
  const store = useQuery<PlaybookStoreView>({
    queryKey: ["playbook-store", accountId ?? ""],
    queryFn: () => fetchPlaybookStore(accountId ?? ""),
    enabled: active,
  });
  return { accounts: accounts.data?.accounts ?? [], store };
}

export function SubscribeAs({
  accounts,
  currentId,
  onSelect,
}: {
  readonly accounts: readonly OwnedAccount[];
  readonly currentId?: string;
  readonly onSelect: (id: string | undefined) => void;
}): ReactElement {
  return (
    <fieldset className="pb-subscribe">
      <legend className="rail-label">Subscribe as</legend>
      <button
        type="button"
        className="railctl"
        aria-pressed={currentId === undefined}
        onClick={() => onSelect(undefined)}
      >
        Catalog only
      </button>
      {accounts.map((account) => (
        <button
          key={account.id}
          type="button"
          className="railctl"
          aria-pressed={account.id === currentId}
          onClick={() => onSelect(account.id)}
        >
          {account.profile?.displayName ?? account.name}
          <span className="num"> · {account.kind}</span>
        </button>
      ))}
    </fieldset>
  );
}

export function PlaybooksSection({
  store,
  accountId,
  accountName,
  subscribeAs,
}: {
  readonly store: UseQueryResult<PlaybookStoreView>;
  readonly accountId?: string;
  readonly accountName?: string;
  /** The account picker (`SubscribeAs`), seated in the section's head under its heading. */
  readonly subscribeAs?: ReactNode;
}): ReactElement {
  const queryClient = useQueryClient();
  const onChanged = () =>
    void queryClient.invalidateQueries({ queryKey: ["playbook-store", accountId ?? ""] });
  // One read, two groupings (#3665): `mine` is the selected account's own closed trades — only for
  // an account the viewer manages, and the server re-scopes `?accounts=` to owned ids regardless —
  // and `house` is every account's, drawn on every card even in catalog-only mode. Unmanaged views
  // ask without `?accounts=`; their `mine` (all owned accounts) is never rendered.
  const manages = Boolean(accountId && store.data?.canManage);
  const scopeId = manages ? (accountId ?? "") : "";
  const performance = useQuery({
    queryKey: ["playbook-performance", scopeId],
    queryFn: () => fetchPlaybookPerformance(scopeId || undefined),
    enabled: store.isSuccess,
  });
  const pick = (
    rows: readonly PlaybookMetricsView[] | null | undefined,
    id: string,
  ): MetricsScope => {
    if (!rows) return { kind: "unreadable" };
    const row = rows.find((r) => r.playbookId === id);
    return row ? { kind: "read", row } : { kind: "read" };
  };
  const metricsFor = (playbookId: string): MetricsScope | undefined =>
    manages && !performance.isPending ? pick(performance.data?.mine, playbookId) : undefined;
  const houseFor = (playbookId: string): MetricsScope | undefined =>
    performance.isPending ? undefined : pick(performance.data?.house, playbookId);

  if (store.isPending) return <p className="note">Opening the playbooks…</p>;
  if (store.isError) return <p className="note">The playbooks are unreachable.</p>;

  const view = store.data;
  const human = view.botsOnly?.locked === true;
  // An owner who opens an account is asking what it runs, so its subscriptions lead the deck
  // (#4649). A stable sort: the catalog's own order holds inside each group.
  const cards = manages
    ? [...view.cards].sort(
        (a, b) => Number(b.subscription !== undefined) - Number(a.subscription !== undefined),
      )
    : view.cards;
  return (
    <>
      <header className="page-header">
        <h1>Playbooks</h1>
        <p>
          Every house playbook: what it does, when it enters, both exits. Pick one of your bot
          accounts under <b>Subscribe as</b>, then back one playbook — or several, as separate
          experiments — with that bot's own capital. A subscription never touches another account's
          capital.
        </p>
      </header>
      {subscribeAs}
      {manages && human ? (
        // The rule once, at the top, before the cards each draw their disabled control (#4610).
        <p className="note">
          <b>{accountName ?? accountId}</b> — {view.botsOnly?.note}
        </p>
      ) : manages ? (
        <p className="note">
          <b>{accountName ?? accountId}</b> — capital under management across active subscriptions:
          ${view.capitalUnderManagement.toLocaleString()}
        </p>
      ) : (
        <p className="note">
          {accountId
            ? "Viewing the catalog — subscribing is only available on your own accounts."
            : "Viewing the catalog — pick a bot account under Subscribe as to subscribe."}
        </p>
      )}
      <div className="pb-deck">
        {cards.map((card) => (
          <PlaybookCard
            key={card.id}
            accountId={accountId ?? ""}
            card={card}
            canManage={manages}
            delegation={view.delegation}
            {...(view.botsOnly ? { botsOnly: view.botsOnly } : {})}
            onChanged={onChanged}
            accountName={accountName ?? accountId ?? ""}
            metrics={metricsFor(card.id)}
            house={houseFor(card.id)}
          />
        ))}
      </div>
    </>
  );
}
