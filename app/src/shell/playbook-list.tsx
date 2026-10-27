import { type ReactElement, useState } from "react";
import type { PairRowView, PlaybookStoreCardView, StrategyCardView } from "../live/playbook-store";
import type { OwnedAccount } from "../live/settings";
import { readyPair } from "./playbook-evidence";
import { bareStatus, capitalized } from "./playbook-strategy-cards";
import { SubscribeBots } from "./playbook-subscribe-bots";
import { StrategyThumb } from "./playbook-thumbs";

/**
 * THE LIST OF THE PLAYS (#5435, Eric's Build pick on #5163 round 5, option B: "Ready ones first, the
 * rest folded"). R&D → Playbooks opens on every strategy in the first phone screens: the ones a bot
 * can run today each get a row with a small picture of its play, and the rest fold into one line,
 * so the reader learns how many there are before reading any one of them.
 *
 * Grouping is computed, never a typed list: a strategy is ready when one of its pairs is runnable
 * today (`readyPair`: researched or a conviction, not past its shelf date). A row says its name, the
 * plain line under it (#5445), what it trades and where in mono, and its evidence as a glyph and a
 * word; tapping it opens that strategy's card (scrolled to on a phone, opened beside the list on a
 * wide screen, #5448). A ready row also carries the + that subscribes the viewer's bots (#5442),
 * drawn only for a member who owns a bot.
 *
 * Colour never alone (docs/BRAND.md → Accessibility): the status is glyph + word, the folded row is
 * dashed and says how many it holds and why, the selected row is outlined.
 */

export const isReady = (strategy: StrategyCardView): boolean => strategy.pairs.some(readyPair);

/** "shares · NVDA · GOOG" — what it trades and where; ten or more read as a count. */
export function tradesLine(strategy: StrategyCardView): string {
  const tickers = [...new Set(strategy.pairs.flatMap((pair) => pair.symbols))];
  const where =
    tickers.length === 0
      ? "no ticker"
      : tickers.length >= 10
        ? `${tickers.length} tickers`
        : tickers.join(" · ");
  return `${strategy.instrument} · ${where}`;
}

/** The status a strategy's row wears: its best ready pair's glyph and word ("✓ researched"), or,
 *  for a strategy that can't run yet, its first pair's ("⊘ can't run"). Qualifiers stay on the card. */
export function statusWord(strategy: StrategyCardView): string {
  const ready = strategy.pairs.filter(readyPair);
  const best = ready.find((pair) => pair.status === "researched" && !pair.qualifier) ?? ready[0];
  if (best) return bareStatus(best.statusLabel);
  // Not runnable: say why, keeping a stale verdict's "past its shelf date" (it is the reason).
  const first = strategy.pairs[0];
  if (!first) return "";
  return first.stale
    ? `${bareStatus(first.statusLabel)} · past its shelf date`
    : bareStatus(first.statusLabel);
}

/** "3 more can't run yet or aren't studied" — the fold says how many and why, in words. */
export function foldWhy(strategies: readonly StrategyCardView[]): string {
  const pairs = strategies.flatMap((s) => s.pairs);
  const has = (test: (p: PairRowView) => boolean) => pairs.some(test);
  const why = [
    ...(has((p) => p.status === "cant-run") ? ["can't run yet"] : []),
    ...(has((p) => p.status === "not-studied") ? ["aren't studied"] : []),
    ...(has((p) => p.status === "screened" || p.status === "stand-aside") ? ["aren't backed"] : []),
    ...(has((p) => p.stale) ? ["need fresh research"] : []),
  ];
  return `${strategies.length} more ${why.length > 0 ? why.join(" or ") : "can't run yet"}`;
}

function Row({
  strategy,
  cardsById,
  selected,
  onOpen,
  bots,
  plusOpen,
  onPlus,
  onChanged,
  picture,
}: {
  readonly strategy: StrategyCardView;
  readonly cardsById: ReadonlyMap<string, PlaybookStoreCardView>;
  readonly selected: boolean;
  readonly onOpen: (strategy: string) => void;
  /** The viewer's own bots; empty draws no +. */
  readonly bots: readonly OwnedAccount[];
  readonly plusOpen: boolean;
  readonly onPlus?: () => void;
  readonly onChanged?: () => void;
  readonly picture: boolean;
}): ReactElement {
  const name = capitalized(strategy.name);
  const plus = onPlus && bots.length > 0;
  return (
    <li className="pbl-row" data-selected={selected || undefined} data-plus={plusOpen || undefined}>
      <button
        type="button"
        className="pbl-open"
        aria-current={selected || undefined}
        onClick={() => onOpen(strategy.strategy)}
      >
        {picture ? (
          <span className="pbl-pic">
            <StrategyThumb strategy={strategy} cardsById={cardsById} />
          </span>
        ) : null}
        <span className="pbl-text">
          <span className="pbl-name">{name}</span>
          {strategy.line ? <span className="pbl-line">{strategy.line}</span> : null}
          <span className="pbl-meta">
            <span className="num pbl-trades">{tradesLine(strategy)}</span>
            <span className="pbl-status">{statusWord(strategy)}</span>
          </span>
        </span>
        <span className="pbl-chev" aria-hidden="true">
          ›
        </span>
      </button>
      {plus ? (
        <button
          type="button"
          className="pbl-plus"
          aria-expanded={plusOpen}
          aria-label={`Subscribe your bots to ${strategy.name}`}
          onClick={onPlus}
        >
          <span aria-hidden="true">{plusOpen ? "×" : "+"}</span>
        </button>
      ) : null}
      {plus && plusOpen ? (
        <SubscribeBots strategy={strategy} bots={bots} {...(onChanged ? { onChanged } : {})} />
      ) : null}
    </li>
  );
}

export function PlaybookList({
  strategies,
  cardsById,
  selected,
  onOpen,
  bots,
  onChanged,
}: {
  readonly strategies: readonly StrategyCardView[];
  readonly cardsById: ReadonlyMap<string, PlaybookStoreCardView>;
  readonly selected?: string;
  readonly onOpen: (strategy: string) => void;
  /** The viewer's own bot accounts; with none, no + is drawn anywhere. */
  readonly bots: readonly OwnedAccount[];
  readonly onChanged?: () => void;
}): ReactElement {
  const [plusFor, setPlusFor] = useState<string | undefined>();
  const ready = strategies.filter(isReady);
  const notYet = strategies.filter((s) => !isReady(s));
  const notYetOpen = notYet.some((s) => s.strategy === selected);
  const row = (strategy: StrategyCardView, isReadyRow: boolean) => (
    <Row
      key={strategy.strategy}
      strategy={strategy}
      cardsById={cardsById}
      selected={strategy.strategy === selected}
      onOpen={onOpen}
      bots={bots}
      plusOpen={plusFor === strategy.strategy}
      picture={isReadyRow}
      {...(isReadyRow
        ? {
            onPlus: () =>
              setPlusFor((now) => (now === strategy.strategy ? undefined : strategy.strategy)),
          }
        : {})}
      {...(onChanged ? { onChanged } : {})}
    />
  );
  return (
    <nav className="pbl" aria-label="The playbooks">
      {ready.length > 0 ? (
        <>
          <h2 className="pbl-h">Ready for a bot · {ready.length}</h2>
          <ul className="pbl-rows">{ready.map((s) => row(s, true))}</ul>
        </>
      ) : null}
      {notYet.length > 0 ? (
        <>
          <h2 className="pbl-h">Not yet · {notYet.length}</h2>
          <details className="pbl-fold" open={notYetOpen || undefined}>
            <summary>
              <span className="pbl-fold-why">{foldWhy(notYet)}</span>
              <span className="pbl-fold-names">
                {notYet.map((s) => capitalized(s.name)).join(" · ")}
              </span>
            </summary>
            <ul className="pbl-rows">{notYet.map((s) => row(s, false))}</ul>
          </details>
        </>
      ) : null}
    </nav>
  );
}
