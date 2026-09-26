import { type UseQueryResult, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import { fetchPlaybookStore, type PlaybookStoreView } from "../live/playbook-store";
import { fetchSettings, type OwnedAccount } from "../live/settings";
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

  if (store.isPending) return <p className="note">Opening the playbooks…</p>;
  if (store.isError) return <p className="note">The playbooks are unreachable.</p>;

  const view = store.data;
  return (
    <>
      <header className="page-header">
        <h1>Playbooks</h1>
        <p>
          Every house playbook: what it does, when it enters, both exits. Pick one of your accounts
          under <b>Subscribe as</b>, then back one playbook — or several, as separate experiments —
          with that account's own capital. A subscription never touches another account's capital.
        </p>
      </header>
      {subscribeAs}
      {accountId && view.canManage ? (
        <p className="note">
          <b>{accountName ?? accountId}</b> — capital under management across active subscriptions:
          ${view.capitalUnderManagement.toLocaleString()}
        </p>
      ) : (
        <p className="note">
          {accountId
            ? "Viewing the catalog — subscribing is only available on your own accounts."
            : "Viewing the catalog — pick an account under Subscribe as to subscribe."}
        </p>
      )}
      <div className="pb-deck">
        {view.cards.map((card) => (
          <PlaybookCard
            key={card.id}
            accountId={accountId ?? ""}
            card={card}
            canManage={Boolean(accountId) && view.canManage}
            delegation={view.delegation}
            onChanged={onChanged}
          />
        ))}
      </div>
    </>
  );
}
