import type { ReactElement, ReactNode } from "react";
import {
  type BotPlaybooks,
  CARD_WORDS,
  type CountedState,
  cardFact,
  type PlaybookCard,
  plainReason,
} from "../live/bot-playbooks";
import { type RollCallLine, sinceText, UNMANAGED_WORDS } from "../live/heartbeat";

/**
 * THE PLAYBOOK CARDS (#5073) — one per playbook, under the bot's checks strip
 * (`bot-playbooks.tsx`). Progressive reveal, per Eric's 0e71d5f8 ("too many icons"): a closed card
 * shows its name, its one state (a glyph and a word) and one fact; it opens in place to its mode,
 * how long it has held that state, the whole reason, and the one way to change it. Changing or
 * pausing stays on R&D → Playbooks (#4642: "configure on R&D → Playbooks; observe on Activity +
 * Heartbeat") — there is no per-playbook address there yet, so every link lands on this bot's
 * playbooks in the Store.
 *
 * Not yet here, each a later slice of #5073: a lane per playbook on the strip's week, trade marks
 * on it, the rule drawn as a picture, and what it holds.
 */

function changeHref(deskId: string): string {
  return `/app/research?section=playbooks&account=${encodeURIComponent(deskId)}`;
}

/** "● 1 trading on live signals · ◷ 4 waiting for a window · ⊘ 2 can't fire" — counted from the
 *  cards' own words, in the order the cards follow. */
export function CountedLine({
  counts,
}: {
  readonly counts: readonly CountedState[];
}): ReactElement | null {
  if (counts.length === 0) return null;
  return (
    <p className="pbb-count">
      {counts.map(({ state, count }) => (
        <span key={state} data-state={state}>
          <span aria-hidden="true">{CARD_WORDS[state].glyph}</span> {count}{" "}
          {CARD_WORDS[state].counted(count)}
        </span>
      ))}
    </p>
  );
}

/** Mode and how long it has held its state. "since" belongs to the verdict, so a card whose word
 *  came from the roll call instead (can't fire, paused) never borrows the verdict's clock. */
function metaOf(card: PlaybookCard, named: boolean): string {
  const since =
    card.verdict && card.verdict.state === card.state ? sinceText(card.verdict) : undefined;
  return [named ? card.mode : undefined, since].filter(Boolean).join(" · ");
}

/** A playbook's name, or on a bot the viewer does not own (#885) the mode it runs in. */
function titleOf(card: PlaybookCard, named: boolean): string {
  if (named && card.playbookId) return card.playbookId;
  const mode = card.mode ?? "unnamed";
  return `${mode.charAt(0).toUpperCase()}${mode.slice(1)} mode`;
}

function StateWord({ glyph, word }: { readonly glyph: string; readonly word: string }) {
  return (
    <span className="pbb-state">
      <span aria-hidden="true">{glyph}</span> <b>{word}</b>
    </span>
  );
}

/** One card: a `<details>` whose summary is the closed card, so it opens in place with the
 *  keyboard and a screen reader for free. A card with nothing more to say is a plain row. */
function Card({
  name,
  state,
  glyph,
  word,
  wide,
  fact,
  children,
}: {
  readonly name: string;
  readonly state: string;
  readonly glyph: string;
  readonly word: string;
  /** Beside the state from the bench width up; on a phone it waits in the opened card. */
  readonly wide?: string;
  readonly fact?: string;
  readonly children?: ReactNode;
}): ReactElement {
  const head = (
    <>
      <span className="pbb-name">{name}</span>
      <span className="pbb-word">
        <StateWord glyph={glyph} word={word} />
        {wide ? <span className="pbb-meta pbb-wide"> · {wide}</span> : null}
      </span>
      {fact ? <span className="pbb-fact">{fact}</span> : null}
    </>
  );
  return (
    <li className="pbb-card" data-state={state}>
      {children ? (
        <details>
          <summary className="pbb-row pbb-sum">
            {head}
            <span className="pbb-chev" aria-hidden="true">
              ›
            </span>
          </summary>
          <div className="pbb-open">{children}</div>
        </details>
      ) : (
        <div className="pbb-row">{head}</div>
      )}
    </li>
  );
}

function PlaybookRow({
  card,
  named,
  deskId,
}: {
  readonly card: PlaybookCard;
  readonly named: boolean;
  readonly deskId: string;
}): ReactElement {
  const { glyph, word } = CARD_WORDS[card.state];
  const meta = metaOf(card, named);
  const fact = cardFact(card);
  // A non-owner's card has no reason to read: its mode and since are the fact, and there is
  // nothing behind it to open.
  if (!named) {
    return (
      <Card
        name={titleOf(card, named)}
        state={card.state}
        glyph={glyph}
        word={word}
        {...(meta ? { fact: meta } : {})}
      />
    );
  }
  return (
    <Card
      name={titleOf(card, named)}
      state={card.state}
      glyph={glyph}
      word={word}
      {...(meta ? { wide: meta } : {})}
      {...(fact.short ? { fact: fact.short } : {})}
    >
      {fact.more ? <p className="pbb-why">{fact.more}</p> : null}
      {meta ? <p className="pbb-meta pbb-narrow">{meta}</p> : null}
      <a className="hb-link" href={changeHref(deskId)}>
        Change or pause it in R&amp;D ›
      </a>
    </Card>
  );
}

/** "BETA-SCOUT is off" · "A and B are off" · "A, B and C are off" — on this bot. */
function offSentence(off: readonly RollCallLine[]): string {
  const ids = off.map((l) => l.playbookId);
  const names =
    ids.length === 1 ? ids[0] : `${ids.slice(0, -1).join(", ")} and ${ids[ids.length - 1]}`;
  return `${names} ${ids.length === 1 ? "is" : "are"} off on this bot`;
}

/** The footer: every house playbook nobody switched on for this bot, named once, opening to why
 *  (some "off" lines say more than off — exits only, or a second option play on one ticker), and
 *  the way to change any of them. */
function OffFooter({
  off,
  deskId,
}: {
  readonly off: readonly RollCallLine[];
  readonly deskId: string;
}): ReactElement {
  return (
    <div className="pbb-foot">
      {off.length > 0 ? (
        <details className="pbb-off">
          <summary className="pbb-sum">
            <span aria-hidden="true">○</span> {offSentence(off)}{" "}
            <span className="pbb-chev" aria-hidden="true">
              ›
            </span>
          </summary>
          <ul>
            {off.map((line) => (
              <li key={line.playbookId}>
                <span className="num">{line.playbookId}</span> {plainReason(line.reason)}
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <span />
      )}
      <a className="hb-link" href={changeHref(deskId)}>
        Change in R&amp;D ›
      </a>
    </div>
  );
}

export function PlaybookCards({
  deskId,
  merged,
  named,
  unmanaged,
  none,
}: {
  readonly deskId: string;
  readonly merged: BotPlaybooks;
  readonly named: boolean;
  /** Held tickers nothing on this bot will sell (#4777) — after the playbooks, by ticker. */
  readonly unmanaged: readonly string[];
  /** No verdict and no roll call came at all — nothing has been recorded to draw. */
  readonly none: boolean;
}): ReactElement {
  if (none) return <p className="note">No playbook has answered a check yet.</p>;
  const empty = merged.cards.length === 0 && unmanaged.length === 0;
  return (
    <div className="pbb-cards">
      {named ? null : (
        <p className="pbb-private">
          Which playbooks these are is the bot owner's to see — each reads here by its state.
        </p>
      )}
      {empty ? (
        <p className="pbb-private">None of this bot's playbooks is on.</p>
      ) : (
        <ul>
          {merged.cards.map((card) => (
            <PlaybookRow key={card.key} card={card} named={named} deskId={deskId} />
          ))}
          {unmanaged.map((symbol) => (
            <Card
              key={`unmanaged:${symbol}`}
              // "shares", so a ticker never reads as one more playbook id in this list.
              name={`${symbol} shares`}
              state="unmanaged"
              glyph={UNMANAGED_WORDS.glyph}
              word={UNMANAGED_WORDS.word}
              fact={UNMANAGED_WORDS.fact}
            >
              <p className="pbb-why">{UNMANAGED_WORDS.reason}</p>
            </Card>
          ))}
        </ul>
      )}
      {named ? <OffFooter off={merged.off} deskId={deskId} /> : null}
    </div>
  );
}
