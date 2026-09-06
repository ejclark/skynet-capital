import type { ReactElement, ReactNode } from "react";

/**
 * The page frame (#738, live-review rounds): the TOPBAR is the app-level navigation dimension;
 * the left rail is a second, per-view dimension — each route hands in its own sub-navigation or
 * controls.
 *
 * DIMENSIONAL PRECEDENCE (Eric, live review 2026-08-28): the layout is three ordered dimensions —
 * the TOPBAR is the first (app-level navigation), the LEFT RAIL the second (a view's sub-nav OR
 * its controls — a control here drives the content beside it), and the VIEW CONTENT the third.
 * Higher dimensions steer lower ones, never the reverse: content never reaches up to reconfigure
 * the rail, and the rail never adds app-level destinations — those belong to the topbar.
 *
 * CONSTANT GEOMETRY (Eric, same review: "content shift greatly degrades user experience"): the
 * rail column is the SAME width on every view — reserved even when a view has nothing to put in
 * it yet — so the content column never shifts left or right as you navigate. A view without rail
 * content gets an empty column, not a wider stage.
 *
 * THREE WORDS FOR "A PAGE HAS SEVERAL THINGS ON IT" (#1740, the tabs wargame). A page that holds
 * more than one thing picks one of these, and the word decides the mechanism — there is no fourth
 * dimension, and no tab strip:
 *   - a KIND is a filter over ONE list — a query qualifier the bar accepts as text, mirrored by a
 *     rail toggle (`is:bot` on Activity, `lens:` on Research). Several may be on at once.
 *   - a SECTION is a different SHAPE of data on the same page — the rail's section switch
 *     (`section-switch.tsx`), exactly one current, URL-stateful via a `section` search param.
 *     Booked P&L beside a trade feed is a section; "bot trades" is not.
 *   - a SUB-VIEW is a full view of its own — a nested route plus rail sub-nav (`profile-rail.tsx`).
 *     A section that outgrows its page graduates here, the way `?tab=performance` became
 *     `/u/$id/pulse` (`src/server/legacy-redirects.ts`).
 * A section switch is the rail's CONTROL role, never a new dimension: it drives the content beside
 * it and adds no app-level destinations. Nothing is both a kind and a section — if a rail toggle
 * and a section switch would offer the same thing, one of them is noise and gets deleted.
 * `docs/PATTERNS.md` keeps the ledger these three words live in, one row per named pattern.
 * @category navigation
 */
export function PageFrame({
  rail,
  children,
}: {
  readonly rail?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="frame">
      {rail ? (
        <nav className="rail" aria-label="Section">
          {rail}
        </nav>
      ) : (
        <div className="rail rail-empty" aria-hidden="true" />
      )}
      <main id="main" className="stage">
        {children}
      </main>
    </div>
  );
}
