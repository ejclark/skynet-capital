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
 * WHERE INFORMATION GOES (#1740, 2026-09-06 — the wargame on "tabs as an organic boundary"): three
 * words, each with a live instance. A KIND is a filter over one list — a query qualifier plus a
 * rail chip, one model, never a tab (Activity's `is:buy`). A SECTION is a different shape of data
 * on the same page — the rail's "On this page" switch (`settings-toc.tsx`), URL-stateful, paging
 * on a phone and sitting beside on desktop. A SUB-VIEW is a full view of its own — a nested route
 * plus rail sub-nav (`profile-rail.tsx`); a section that outgrows its page graduates here. There is
 * no fourth band: at phone width the topbar and the rail already each wrap into a horizontal row,
 * so a tab strip under the header would be a third band before any content. docs/PATTERNS.md
 * keeps the ledger.
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
