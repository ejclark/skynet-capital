import type { ReactElement, ReactNode } from "react";

/**
 * The page frame (#738, live-review round): the TOPBAR is the app-level navigation dimension;
 * the left rail is a second, per-view dimension — each route hands in its own sub-navigation, or
 * none and takes the full width. Two nav dimensions, each with one clear job (Eric, live review:
 * "the top bar as the top level navigation… enables the left rail for sub navigation").
 *
 * DIMENSIONAL PRECEDENCE (Eric, live review 2026-08-28): the layout is three ordered dimensions —
 * the TOPBAR is the first (app-level navigation), the LEFT RAIL the second (a view's sub-nav OR
 * its controls — a control here drives the content beside it), and the VIEW CONTENT the third.
 * Higher dimensions steer lower ones, never the reverse: content never reaches up to reconfigure
 * the rail, and the rail never adds app-level destinations — those belong to the topbar.
 */
export function PageFrame({
  rail,
  children,
}: {
  readonly rail?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className={rail ? "frame" : "frame frame-full"}>
      {rail ? (
        <nav className="rail" aria-label="Section">
          {rail}
        </nav>
      ) : null}
      <main id="main" className="stage">
        {children}
      </main>
    </div>
  );
}
