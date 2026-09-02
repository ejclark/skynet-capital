import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * THE PROFILE RAIL (#1119) — the second dimension for the member's own chapters: Settings is the
 * profile, Milestones is its table of contents, and Onboarding · Trading ladder · Playbooks are
 * the three chapters under it. One component so every chapter shows the same map; `current` marks
 * the page you're on. Adds no app-level destination the topbar lacks (dimensional precedence,
 * `frame.tsx`) — every link here is a profile sub-view or an existing view.
 * @category navigation
 */
export type ProfileChapter = "milestones" | "onboarding" | "ladder" | "playbooks";

const ITEMS: readonly {
  readonly id: ProfileChapter;
  readonly label: string;
  readonly to: string;
  readonly sub?: true;
}[] = [
  { id: "milestones", label: "Milestones", to: "/learn" },
  { id: "onboarding", label: "Onboarding", to: "/onboarding", sub: true },
  // "Trading ladder" (/learn/trading) and "Playbooks" (/playbooks) join this list with slice 3 of
  // #1119 — a rail link to a route that doesn't exist yet would be a dead end, not a map.
];

export function ProfileRail({ current }: { readonly current: ProfileChapter }): ReactElement {
  return (
    <>
      <p className="rail-label">Profile</p>
      <Link to="/settings">Settings</Link>
      {ITEMS.map((item) =>
        item.id === current ? (
          <span
            key={item.id}
            className={`rail-current${item.sub ? " rail-sub" : ""}`}
            aria-current="page"
          >
            {item.label}
          </span>
        ) : (
          <Link key={item.id} to={item.to} className={item.sub ? "rail-sub" : undefined}>
            {item.label}
          </Link>
        ),
      )}
      <hr />
      <Link to="/join">Add an account</Link>
    </>
  );
}
