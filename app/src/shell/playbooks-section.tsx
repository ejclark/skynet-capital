import { type UseQueryResult, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import { fetchPlaybookPerformance, type PlaybookMetricsView } from "../live/playbook-performance";
import {
  fetchPlaybookStore,
  type PlaybookStoreView,
  type StrategyCardView,
} from "../live/playbook-store";
import { fetchSettings, type OwnedAccount } from "../live/settings";
import { YourPlaybooks } from "./playbook-drafts";
import { isReady, PlaybookList } from "./playbook-list";
import type { MetricsScope } from "./playbook-metrics";
import { StrategyCard, strategyAnchor } from "./playbook-strategy-cards";
import { YourConvictions } from "./your-convictions";

/**
 * R&D → PLAYBOOKS (#3623) — the one home for house playbooks, and the one build that folded five
 * queued ones into a single path (#5494 step 1: #5435, #5442, #5444, #5445, #5448).
 *
 * The page is the catalog. It opens on Eric's mission line and the list of the plays (#5435), with
 * no how-to anywhere (#5451: "If we have to instruct how to subscribe, the design has already
 * failed"). Subscribing happens on a play: a + on each ready row opens the viewer's own bots
 * (#5442); there is no page-wide "Subscribe as" picker any more. Each strategy's card follows: its
 * name and a plain line (#5445), and per ticker the evidence as a call (#5444) and how it trades.
 *
 * A WIDE SCREEN ADDS ROOM, NEVER CONCEPTS (#5448): the section is a size container, so it reads the
 * width the shell gives it, never the viewport. With room for two columns, the list sits beside the
 * open strategy (a row selects it instead of scrolling to it); with room for three, each ticker's
 * evidence and how it trades sit side by side as well. While the 3D rail takes its space (#5207),
 * the third column simply doesn't fit and how it trades stays under the evidence.
 *
 * "Your playbooks" sits between the mission line and the catalog (#5457 slice 1): the member's own
 * drafts and the form to write one (`playbook-drafts.tsx`). It is one more kind of entry in the
 * catalog, not a screen — a draft is saved and does not trade. "Your convictions" follows it
 * (#5482 slice 6b, `your-convictions.tsx`): the member's stated views of the market, beside the
 * pairs they steer, each a draft until its owner hands it to their bots (slice 6c).
 *
 * The closed-trades scoreboard that used to sit folded at the foot of this page ("Who started the
 * bots' closed trades") lives on the book's Balance section now (#5493 slice 3, #5451 P3): it is a
 * metrics view, not part of the catalog. The cards keep their own per-playbook numbers.
 *
 * `?account=` is kept as the address a bot's own Playbooks page links to for changing what it runs
 * (`playbook-cards.tsx` → "Change"): with it, an account the viewer owns gets its subscriptions,
 * Edit, Pause and allocations on the cards, as before. Profile → Playbooks takes that over (#5168).
 * The server re-checks ownership on every read and write; a hand-typed `?account=` for someone
 * else's account renders the plain catalog.
 */

export function usePlaybooksSection(active: boolean, accountId: string | undefined) {
  const accounts = useQuery({ queryKey: ["settings"], queryFn: fetchSettings, enabled: active });
  const store = useQuery<PlaybookStoreView>({
    queryKey: ["playbook-store", accountId ?? ""],
    queryFn: () => fetchPlaybookStore(accountId ?? ""),
    enabled: active,
  });
  return { accounts: accounts.data?.accounts ?? [], accountsReady: accounts.isSuccess, store };
}

/** Eric's mission line (#5451 round 1: "This is the mission, everything after this serves the
 *  mission: Create scenarios, develop strategies, track results; playbooks."). */
export const MISSION = "Create scenarios, develop strategies, track results.";

/** Ready strategies first, then the rest; an owner's held strategies lead their account's view. */
function deckOrder(strategies: readonly StrategyCardView[], manages: boolean) {
  const holds = (s: StrategyCardView) =>
    manages && s.pairs.some((pair) => pair.subscription !== undefined) ? 1 : 0;
  return [...strategies].sort(
    (a, b) => holds(b) - holds(a) || Number(isReady(b)) - Number(isReady(a)),
  );
}

/** A tap on a list row, once the picked card has rendered: the page goes to it only when its top is
 *  out of sight — always on a phone (the cards sit under the list), and on a wide screen only when
 *  the reader had scrolled down a long card, so the list beside it never jumps for nothing. */
function scrollToCard(strategy: string) {
  requestAnimationFrame(() => {
    const card = document.getElementById(strategyAnchor(strategy));
    if (!card) return;
    const top = card.getBoundingClientRect().top;
    if (top >= 0 && top < window.innerHeight / 2) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    card.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
}

export function PlaybooksSection({
  store,
  accountId,
  accountName,
  accounts = [],
  accountsReady = true,
}: {
  readonly store: UseQueryResult<PlaybookStoreView>;
  readonly accountId?: string;
  readonly accountName?: string;
  /** The viewer's own accounts (`/api/settings`); its bots are who the + subscribes. */
  readonly accounts?: readonly OwnedAccount[];
  /** False while `accounts` is still being read, so "you have no bot" is never said early. */
  readonly accountsReady?: boolean;
}): ReactElement {
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<string | undefined>();
  const onChanged = () => void queryClient.invalidateQueries({ queryKey: ["playbook-store"] });
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
  const funnel = performance.data?.funnel;
  const houseFor = (playbookId: string): MetricsScope | undefined => {
    if (performance.isPending) return undefined;
    const scope = pick(performance.data?.house, playbookId);
    if (scope.kind !== "read" || !funnel) return scope;
    const row = funnel.playbooks.find((r) => r.playbookId === playbookId);
    return { ...scope, funnel: { sessions: funnel.sessions.length, ...(row ? { row } : {}) } };
  };

  const head = (
    <header className="page-header">
      <h1>Playbooks</h1>
      <p className="pb-mission">{MISSION}</p>
    </header>
  );
  if (store.isPending)
    return (
      <>
        {head}
        <p className="note">Opening the playbooks…</p>
      </>
    );
  if (store.isError)
    return (
      <>
        {head}
        <p className="note">The playbooks are unreachable.</p>
      </>
    );

  const view = store.data;
  const human = view.botsOnly?.locked === true;
  const bots = accounts.filter((account) => account.kind === "bot");
  const strategies = deckOrder(view.strategies, manages);
  // A pick the catalog no longer holds falls back, so the wide layout never shows an empty column.
  const kept = strategies.some((s) => s.strategy === picked) ? picked : undefined;
  const selected = kept ?? strategies.find(isReady)?.strategy ?? strategies[0]?.strategy;
  const cardsById = new Map(view.cards.map((card) => [card.id, card]));
  const open = (strategy: string) => {
    setPicked(strategy);
    scrollToCard(strategy);
  };
  return (
    <div className="pb-section">
      {head}
      <YourPlaybooks accounts={accounts} ready={accountsReady} />
      <YourConvictions />
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
      ) : accountId ? (
        // An address naming an account that isn't the viewer's: said, so missing controls aren't a mystery.
        <p className="note">That account isn't one of yours, so this is the catalog alone.</p>
      ) : null}
      <div className="pb-layout">
        <PlaybookList
          strategies={strategies}
          cardsById={cardsById}
          {...(selected ? { selected } : {})}
          onOpen={open}
          bots={bots}
          onChanged={onChanged}
        />
        <div className="pb-deck">
          {strategies.map((strategy) => (
            <StrategyCard
              key={strategy.strategy}
              accountId={accountId ?? ""}
              strategy={strategy}
              cardsById={cardsById}
              canManage={manages}
              delegation={view.delegation}
              {...(view.botsOnly ? { botsOnly: view.botsOnly } : {})}
              onChanged={onChanged}
              accountName={accountName ?? accountId ?? ""}
              metricsFor={metricsFor}
              houseFor={houseFor}
              selected={strategy.strategy === selected}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
