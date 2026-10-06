import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { WirePnl } from "../live/wire";

/**
 * BOOKED P&L AS A SUMMARY STRIP (#784 slice 3) — the page's standing snapshot, no longer one of its
 * sections.
 *
 * Why it moved: a section is a different SHAPE of data you page TO (`frame.tsx`'s three-word rule),
 * and booked P&L is not a shape you visit — it is the running total of what the feed below it is a
 * record of. Making it a section put a figure that is always true behind a click, and made it
 * compete with the feed for the one "section" slot (#784's own acceptance criterion: "never as a
 * fourth item competing for the same section concept"). As a strip it is always on screen and
 * always answers one question — who is up, who is down, right now.
 *
 * Mobile-first (`CLAUDE.md`): at 390px it is one scrollable row of cells, the ranking the strip
 * exists for readable without a tap; wider viewports let the same cells wrap into rows rather than
 * adding anything new. Each cell is name · desk chip · signed figure — the sign carries the
 * direction in a character, so the tone colour is reinforcement and never the only signal
 * (`docs/BRAND.md` → Accessibility).
 */
export function PnlStrip({ rows }: { readonly rows: readonly WirePnl[] }): ReactElement {
  return (
    <section className="pnl-strip" aria-labelledby="pnl-strip-h">
      <h2 className="wire-h" id="pnl-strip-h">
        Booked P&amp;L
      </h2>
      {rows.length === 0 ? (
        <p className="note">Nothing booked yet — realized P&amp;L shows up on the first close.</p>
      ) : (
        <ul className="pnl-cells">
          {rows.map((row) => (
            <li key={row.whoId}>
              <Link to="/u/$id" params={{ id: row.whoId }}>
                {row.who}
              </Link>
              <span className={`chip chip-${row.kind}`}>
                {row.kind === "bot" ? "BOT" : "HUMAN"}
              </span>
              <span className={`num tone-${row.tone}`}>{row.realized}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
