import { Link } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import type { MilestoneChapter } from "./milestone-card";

/**
 * THE CONNECT GUIDE'S ONE DOOR — every "this session isn't linked…" line carries it (#3807 slice
 * 3b-4; the persona crawl's `promise-no-target` probe): a note that names an action gets the
 * control for it, in its own words. Moved here from `cockpit-head.tsx` so the Milestones note, the
 * working-orders panel and the alerts strip share one link instead of three spellings of it.
 * @category navigation
 */

/** Scroll a chapter under the sticky cockpit head — an anchor, measured rather than a fixed
 *  `scroll-margin`, because the head's height differs at 390 and 1280. Also the door's own case,
 *  where the chapter is already open and nothing re-renders to fire the section's anchor. */
export function scrollToChapter(chapter: MilestoneChapter, el?: HTMLElement | null): void {
  const target = el ?? document.getElementById(`chapter-${chapter}`);
  if (!target || typeof window.scrollTo !== "function") return;
  const head = document.querySelector(".cockpit-head")?.getBoundingClientRect().bottom ?? 0;
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - head - 12 });
}

/** The connect guide (`/accounts?section=milestones&chapter=onboarding`), scrolled into view. A
 *  Link, so the URL names the chapter; from another page the section's own anchor scrolls it. */
export function ConnectLink({
  children = "connect one in Onboarding",
}: {
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <Link
      to="/accounts"
      search={{ section: "milestones", chapter: "onboarding" }}
      resetScroll={false}
      className="door-link"
      onClick={() => requestAnimationFrame(() => scrollToChapter("onboarding"))}
    >
      {children}
    </Link>
  );
}
