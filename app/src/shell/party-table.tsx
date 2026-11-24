import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { BoardParty, PartySeat } from "../live/board";

/**
 * THE PARTY'S TABLE (#8253) — the Scoreboard's opening: the members together against the house
 * bot. Shape 5 of #8161 (picked 2026-11-24) made it co-op, so no member is ranked against another:
 * seats sort A to Z, with no bar, no ramp and no placing.
 *
 * Every string is the server's (`src/observatory/standings-party.ts`); this file places them and
 * derives nothing. Order at 390, top to bottom (the capsule's constraint): the lead line · the
 * party's figure beside the house bot's · the viewer's seat line when they have none · the seats ·
 * the open-seat count · where the numbers come from. Desktop adds room, never a new concept.
 *
 * Hue never carries meaning alone: the lead line is words with a glyph and a signed figure, and the
 * viewer's row carries a glyph and the word "you". When the house bot leads, the line says so
 * plainly, with no red spectacle — a loss is honest, not punished.
 */

/** The line a member without a seat reads — here and on the home's Scoreboard tile. */
export const SEAT_LINE = "Your seat opens with your first filled paper order";

/** True when one of the viewer's own accounts sits at the table. */
export const ownsSeat = (party: BoardParty, ownedIds: readonly string[]): boolean =>
  party.seats.some((s) => ownedIds.includes(s.key));

/** The one plain line the home's Scoreboard tile shows (criterion 10): the seat line before the
 *  viewer's first fill, the lead line (or why there is none) after it. */
export function scoreboardTileLine(
  party: BoardParty | undefined,
  ownedIds: readonly string[],
): { readonly line: string; readonly lit: boolean } {
  if (!(party && ownsSeat(party, ownedIds))) return { line: SEAT_LINE, lit: false };
  return {
    line: party.lead ? party.lead.line : (party.leadNote ?? "The party's table"),
    lit: true,
  };
}

function SeatRow({ seat, mine }: { readonly seat: PartySeat; readonly mine: boolean }) {
  return (
    <li className={`party-seat${mine ? " party-seat-mine" : ""}`}>
      <span className="party-seat-name">
        {seat.name}
        {mine ? (
          <span className="party-you">
            <span aria-hidden="true">◆ </span>you
          </span>
        ) : null}
      </span>
      <span className="party-seat-fig">
        <span className={`num tone-${seat.monthReturnTone}`}>{seat.monthReturn}</span>
        {seat.monthReturnNote ? (
          <span className="party-fig-note">{seat.monthReturnNote}</span>
        ) : (
          <span className="party-fig-note">1M return</span>
        )}
      </span>
      <span className="party-seat-fig">
        <span className={`num tone-${seat.bookedTone}`}>{seat.booked}</span>
        <span className="party-fig-note">booked</span>
      </span>
    </li>
  );
}

export function PartyTable({
  party,
  ownedIds,
}: {
  readonly party: BoardParty;
  /** The viewer's own account ids (`["settings"]`); empty while they load or when there are none. */
  readonly ownedIds: readonly string[];
}): ReactElement {
  const seated = ownsSeat(party, ownedIds);
  return (
    <section className="party" aria-labelledby="party-title">
      <h2 id="party-title" className="party-eyebrow">
        The party against the house bot
      </h2>
      {party.lead ? (
        <p className={`party-lead party-lead-${party.lead.tone}`}>
          <span className="party-lead-glyph" aria-hidden="true">
            {party.lead.glyph}
          </span>
          <span className="party-lead-line">{party.lead.line}</span>
          <span className="party-lead-fig num">{party.lead.figure}</span>
        </p>
      ) : (
        <p className="party-lead party-lead-none">{party.leadNote}</p>
      )}
      <dl className="party-sides">
        <div>
          <dt>The party</dt>
          <dd className={`num tone-${party.partyReturnTone}`}>{party.partyReturn}</dd>
          <dd className="party-fig-note">{party.partyCount}</dd>
        </div>
        <div>
          <dt>The house bot</dt>
          <dd className={`num tone-${party.houseReturnTone}`}>{party.houseReturn}</dd>
          <dd className="party-fig-note">{party.houseNote ?? "its own 1M return"}</dd>
        </div>
      </dl>
      {seated ? null : (
        <p className="party-seat-line">
          <span aria-hidden="true">◇ </span>
          <Link to="/trade">{SEAT_LINE}</Link>
        </p>
      )}
      {party.seats.length > 0 ? (
        <ul className="party-seats" aria-label="Seated members, A to Z">
          {party.seats.map((s) => (
            <SeatRow key={s.key} seat={s} mine={ownedIds.includes(s.key)} />
          ))}
        </ul>
      ) : null}
      <p className="party-open">{party.openLine}</p>
      <p className="party-foot">{party.footnote}</p>
    </section>
  );
}
