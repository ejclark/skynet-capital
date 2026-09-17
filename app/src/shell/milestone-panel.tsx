import type { ReactElement, ReactNode } from "react";

/**
 * THE MILESTONE PANEL TEMPLATE (#1740 follow-up) — one bordered card carrying a milestone's title,
 * done/total count, and progress bar, with the milestone's own content nested inside. Onboarding's
 * `ob-panel` was the first instance; this promotes that shape so every milestone page groups its
 * content the same way instead of listing loose sections — the portable unit a future consolidated
 * milestones view would render per milestone, without redesigning each page's markup.
 */
export function MilestonePanel({
  title,
  done,
  total,
  children,
}: {
  readonly title: string;
  readonly done: number;
  readonly total: number;
  readonly children: ReactNode;
}): ReactElement {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <section className="ms-panel">
      <div className="ms-panel-head">
        <h2 className="ms-panel-title">{title}</h2>
        <span className="ms-panel-count num">
          {done} / {total} complete
        </span>
      </div>
      <div className="course-bar ms-panel-bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      {children}
    </section>
  );
}
