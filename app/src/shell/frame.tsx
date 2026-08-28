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
