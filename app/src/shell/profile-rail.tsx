import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * THE PROFILE RAIL (#1119, the canvas's left rail under the Profile tab): Milestones (the table of
 * contents), its three chapters — Onboarding · Trading · Playbooks — Feedback (Eric, 2026-09-03:
 * the ledger of filings that became GitHub issues lives under Profile now that filing itself is
 * Moneypenny's rail), and Settings (Eric, 2026-09-04: it's a user-geared page, so it belongs in
 * the Profile rail like its siblings rather than reachable only through the topbar's icon-only
 * gear shortcut, which stays as a global fast path). One component so every profile page shows the
 * same map; `current` marks the page you're on. Every link here is a profile sub-view of the
 * Profile tab (dimensional precedence, `frame.tsx`).
 *
 * Accounts (the cross-user standings board) moved out to its own top-level Leaderboard destination
 * (#2321) — Profile is user-centric, a leaderboard spanning every player/bot is not. A real
 * per-account Accounts view returns here once built.
 * @category navigation
 */
export type ProfileChapter =
  | "milestones"
  | "onboarding"
  | "ladder"
  | "playbooks"
  | "feedback"
  | "settings";

const ITEMS: readonly {
  readonly id: ProfileChapter;
  readonly glyph: string;
  readonly label: string;
  readonly to:
    | "/learn"
    | "/onboarding"
    | "/learn/trading"
    | "/playbooks"
    | "/feedback"
    | "/settings";
  readonly sub?: true;
}[] = [
  { id: "milestones", glyph: "◆", label: "Milestones", to: "/learn" },
  { id: "onboarding", glyph: "▦", label: "Onboarding", to: "/onboarding", sub: true },
  { id: "ladder", glyph: "⇄", label: "Trading", to: "/learn/trading", sub: true },
  { id: "playbooks", glyph: "⛁", label: "Playbooks", to: "/playbooks", sub: true },
  { id: "feedback", glyph: "✎", label: "Feedback", to: "/feedback" },
  { id: "settings", glyph: "⚙", label: "Settings", to: "/settings" },
];

export function ProfileRail({ current }: { readonly current: ProfileChapter }): ReactElement {
  return (
    <>
      <p className="rail-label">Profile</p>
      {ITEMS.map((item) => {
        const cls = `rail-item${item.sub ? " rail-sub" : ""}`;
        const body = (
          <>
            <span className="rail-glyph" aria-hidden="true">
              {item.glyph}
            </span>
            {item.label}
          </>
        );
        return item.id === current ? (
          <span key={item.id} className={`rail-current ${cls}`} aria-current="page">
            {body}
          </span>
        ) : (
          <Link key={item.id} to={item.to} className={cls}>
            {body}
          </Link>
        );
      })}
    </>
  );
}
