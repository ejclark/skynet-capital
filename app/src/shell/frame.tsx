import type { ReactElement, ReactNode } from "react";

/**
 * The page frame (#738, live-review round): the TOPBAR is the app-level navigation dimension;
 * the left rail is a second, per-view dimension — each route hands in its own sub-navigation, or
 * none and takes the full width. Two nav dimensions, each with one clear job (Eric, live review:
 * "the top bar as the top level navigation… enables the left rail for sub navigation").
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
