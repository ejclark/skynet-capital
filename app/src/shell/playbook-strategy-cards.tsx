import type { ReactElement } from "react";
import type {
  BotsOnlyGateView,
  DelegationGateView,
  PairRowView,
  PlaybookStoreCardView,
  StrategyCardView,
} from "../live/playbook-store";
import type { MetricsScope } from "./playbook-metrics";
import { PairRow, pairTitle } from "./playbook-store-cards";
import { SubscriptionRow } from "./playbook-subscription-row";

/**
 * THE STORE BY STRATEGY (#4469 slice 3b) — one card per strategy, a row per pair (a strategy on a
 * ticker). Eric, 2026-10-06: "The intent of the playbooks was to be agnostic with the stock symbols
 * as configuration option." So the wheel is one card and CRWV is a row on it, not a card of its own.
 *
 * Phone order, curated at 390px first (the plan's constraint; a desktop gives the rows room, never
 * another concept): the owner's own pairs lead — state · ticker · mode · capital, with Pause, Edit
 * and Unsubscribe — then the strategy in one line, then its tickers by evidence, then each row's
 * rules. ✓ researched, ◆ conviction and subscribed rows stay open; everything else (~ ✗ ? –) folds
 * into one counted line, because a ticker we cannot back is a row to find, not one to scroll past.
 *
 * Every join keys on the row's pair id (criterion 8): the rules and numbers come from `cards` by
 * `pair.id`, and a subscription posts that same id — "the wheel on CRWV" still posts `CRWV-WHEEL`.
 * The client never builds an id from a strategy and a ticker, or splits one.
 */

/** "the wheel" → "The wheel": how a strategy's name heads its card. */
const capitalized = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1);

/** A row stays open when it is the pair to look at: researched, an owner's conviction, or held. */
const staysOpen = (pair: PairRowView): boolean =>
  pair.subscription !== undefined || pair.status === "researched" || pair.status === "conviction";

/** "3 more: ? 2 not studied · – 1 can't run" — the folded rows counted by the word each one wears,
 *  so a fold never hides how many rows it holds or why they are there. */
function foldedLine(pairs: readonly PairRowView[]): string {
  const counts = new Map<string, number>();
  for (const pair of pairs) {
    const label = pair.statusLabel.replace(/,.*| ·.*/, "");
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const parts = [...counts].map(([label, n]) => {
    const [glyph, ...word] = label.split(" ");
    return `${glyph} ${n} ${word.join(" ")}`;
  });
  return `${pairs.length} more: ${parts.join(" · ")}`;
}

export function StrategyCard({
  accountId,
  strategy,
  cardsById,
  canManage,
  delegation,
  botsOnly,
  onChanged,
  accountName,
  metricsFor,
  houseFor,
}: {
  readonly accountId: string;
  readonly strategy: StrategyCardView;
  /** Every pair's rules and numbers, by pair id. */
  readonly cardsById: ReadonlyMap<string, PlaybookStoreCardView>;
  readonly canManage: boolean;
  readonly delegation: DelegationGateView;
  readonly botsOnly?: BotsOnlyGateView;
  readonly onChanged: () => void;
  readonly accountName: string;
  readonly metricsFor: (pairId: string) => MetricsScope | undefined;
  readonly houseFor: (pairId: string) => MetricsScope | undefined;
}): ReactElement {
  const rows = strategy.pairs.flatMap((pair) => {
    const card = cardsById.get(pair.id);
    return card ? [{ pair, card }] : [];
  });
  const mine = canManage ? rows.filter(({ pair }) => pair.subscription !== undefined) : [];
  const open = rows.filter(({ pair }) => staysOpen(pair));
  const folded = rows.filter(({ pair }) => !staysOpen(pair));
  const human = botsOnly?.locked === true;
  const row = ({ pair, card }: (typeof rows)[number]) => {
    const metrics = metricsFor(pair.id);
    const house = houseFor(pair.id);
    return (
      <PairRow
        key={pair.id}
        accountId={accountId}
        card={card}
        pair={pair}
        canManage={canManage}
        delegation={delegation}
        {...(botsOnly ? { botsOnly } : {})}
        onChanged={onChanged}
        accountName={accountName}
        {...(metrics ? { metrics } : {})}
        {...(house ? { house } : {})}
      />
    );
  };
  return (
    <section className="pb-card pb-strategy" data-subscribed={mine.length > 0 || undefined}>
      <h2 className="pb-card-h">
        <span className="pb-card-id">{capitalized(strategy.name)}</span>{" "}
        <span className="pb-card-symbols">trades {strategy.instrument}</span>
      </h2>
      {mine.map(({ pair, card }) => (
        // An existing subscription keeps every exit it had, on every account — pausing and
        // leaving are never gated. Behind the fog an edit may only lower exposure; the server
        // refuses anything that delegates more.
        <div className="pb-yours" key={pair.id}>
          <p className="pb-yours-h num">{pairTitle(pair.symbols)}</p>
          <SubscriptionRow
            accountId={accountId}
            card={{ ...card, ...(pair.subscription ? { subscription: pair.subscription } : {}) }}
            human={human}
            reduceOnly={delegation.locked}
            onChanged={onChanged}
          />
        </div>
      ))}
      <p className="pb-card-description">{strategy.summary}</p>
      <div className="pb-pairs">{open.map(row)}</div>
      {folded.length > 0 ? (
        <details className="pb-folded">
          <summary>{foldedLine(folded.map(({ pair }) => pair))}</summary>
          <div className="pb-pairs">{folded.map(row)}</div>
        </details>
      ) : null}
    </section>
  );
}
