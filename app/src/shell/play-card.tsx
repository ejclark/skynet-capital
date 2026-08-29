import type { ReactElement } from "react";
import type { PlayCard as PlayCardData } from "../live/outpost";

/**
 * A PLAY, AS A TRADING CARD (#809 slice 1) — the persona `ClassPicker` grammar (name, id, thesis)
 * promoted into a collectible frame: a header band carrying the play's mark and its author, the
 * thesis, the derived window, its traits as pills, and the receipt along the bottom edge.
 *
 * Honesty rules the card is built around:
 *  - **Every attribute is the server's, derived by walking the play** — nothing here is decorative
 *    stat-filler, and there is no "power level" a card could invent.
 *  - **Size is target exposure, and says so.** Risk guards clamp on top; the card never implies the
 *    number is what will actually be traded.
 *  - **The author is stated, with its kind.** A house play is marked as the house's, so a
 *    member-authored play can never be mistaken for a vetted one (or the reverse).
 */

const pct = (fraction: number): string => `${(fraction * 100).toFixed(1)}%`;

export function PlayCard({
  card,
  onPickAuthor,
  onPickTrait,
}: {
  readonly card: PlayCardData;
  readonly onPickAuthor: (id: string) => void;
  readonly onPickTrait: (id: string) => void;
}): ReactElement {
  return (
    <article className="pc" aria-label={`${card.id} — ${card.symbol}`}>
      <header className="pc-band">
        <span className="pc-mark num">{card.id}</span>
        <span className="pc-sym num">{card.symbol}</span>
      </header>
      <button
        type="button"
        className={`pc-author pc-author-${card.author.kind}`}
        onClick={() => onPickAuthor(card.author.id)}
        title={`Show only plays by ${card.author.name}`}
      >
        <span className="pc-author-by">by</span> {card.author.name}
        <span className="pc-author-kind">
          {card.author.kind === "house" ? "house roster" : "member-authored"}
        </span>
      </button>
      <p className="pc-thesis">{card.thesis}</p>
      <dl className="pc-stats">
        <div>
          <dt>Window</dt>
          <dd className="num">{card.window}</dd>
        </div>
        <div>
          <dt>Target exposure</dt>
          <dd className="num">
            {pct(card.size.conservative)} · {pct(card.size.standard)} · {pct(card.size.aggressive)}
          </dd>
          {/* Three numbers mean nothing unnamed — and the honest caveat rides with them. */}
          <dd className="pc-modes">conservative · standard · aggressive, before risk guards</dd>
        </div>
      </dl>
      {card.traits.length > 0 ? (
        <ul className="pc-traits">
          {card.traits.map((trait) => (
            <li key={trait.id}>
              <button
                type="button"
                className="pc-trait"
                title={trait.claim}
                onClick={() => onPickTrait(trait.id)}
              >
                {trait.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <footer className="pc-foot">
        <span className="pc-evidence num">{card.evidence}</span>
        {card.href ? (
          <a className="pc-study" href={card.href}>
            the study behind it →
          </a>
        ) : null}
      </footer>
    </article>
  );
}
