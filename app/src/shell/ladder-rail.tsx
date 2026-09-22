import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { PlayInfo } from "../live/options";

/**
 * THE LADDER RAIL (Eric, 2026-09-22: "the trading section also lost the trading milestone section
 * which helped preset trades… this design needed some attention but was a nice add that feels
 * helpful longterm… we just need to find a better design to more organically integrate the
 * behavior… I also want this section restored on the trade page"). Restores the CLICK-TO-PRESET
 * function the eight-rung `MilestoneStrip` had before it moved to `/learn/trading` (#3407 slice 5,
 * "B — keep") — but as the rail's own item list, not a second rail-width strip stacked above the
 * ticket, which is the exact "second header" problem that move was solving. Same `rail-item` /
 * `rail-glyph` shape `profile-rail.tsx` already uses, so it needs no new CSS: the reserved rail
 * column never competes with the ticket/chain/chart, and at ≤860px it becomes the same horizontal
 * chip row every other rail control already does (`rail.css`) — a phone-width strip for free.
 *
 * Same two rules `milestone-strip.tsx`'s `Rung` already proved: a reached rung PRESETS `?play=`
 * and lands on the ticket section (never a gate — the server refuses at review/submit regardless);
 * a locked rung routes to `/learn/trading` (more detail on what unlocks it), never to a ticket it
 * can't use. Nothing here decides earned or locked — both arrive from `/api/trade/plays`.
 *
 * Terse by design (code only, full name in `aria-label`/`title`): the rail's own convention is
 * one-word items (Accounts, Settings) — eight full play names ("Sell a cash-secured put") would
 * read as a different visual language mid-rail. `RungChip` on the ticket itself still carries the
 * full name, state word and count; this is the quick-switch, that's the narrative status — the two
 * aren't redundant, the same split `profile-rail.tsx` + its own page content already uses.
 * @category trading
 */
export function LadderRail({
  deskId,
  plays,
  current,
}: {
  readonly deskId: string;
  readonly plays: readonly PlayInfo[];
  readonly current: string;
}): ReactElement {
  return (
    <>
      <p className="rail-label">Ladder</p>
      {plays.map((play) => {
        const isCurrent = play.code === current;
        const state = play.earned ? "earned" : play.locked ? "locked" : "open";
        const cls = `rail-item rail-rung rail-rung-${state}${isCurrent ? " rail-current" : ""}`;
        const name = `${play.code} ${play.name}`;
        // A mark, never a repeat of the code the label already shows below it.
        const glyph = (
          <span className="rail-glyph num" aria-hidden="true">
            {play.earned ? "✓" : "·"}
          </span>
        );
        if (play.locked) {
          return (
            <Link
              key={play.code}
              to="/learn/trading"
              className={cls}
              title={name}
              aria-label={`${name} — locked, see what unlocks it`}
            >
              {glyph}
              {play.code}
            </Link>
          );
        }
        return (
          <Link
            key={play.code}
            to="/trade"
            // A rung is a TICKET action: it lands on the ticket section (the untyped default)
            // whatever section the page was on, so `section` is dropped rather than carried over —
            // same rule `milestone-strip.tsx`'s `Rung` already follows.
            search={(prev) => ({ ...prev, desk: deskId, play: play.code, section: undefined })}
            className={cls}
            title={name}
            aria-current={isCurrent ? "page" : undefined}
            aria-label={`${name}${play.earned ? " — earned" : ""}`}
          >
            {glyph}
            {play.code}
          </Link>
        );
      })}
    </>
  );
}
