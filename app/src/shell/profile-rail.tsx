import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * THE PROFILE RAIL (#1119, the canvas's left rail under the Profile tab): Accounts (the standings
 * board — every desk, bots and humans), Milestones (the table of contents), its three chapters —
 * Onboarding · Trading Desk · Playbooks — Feedback (Eric, 2026-09-03: the ledger of filings that
 * became GitHub issues lives under Profile now that filing itself is Moneypenny's rail), and
 * Settings (Eric, 2026-09-04: it's a user-geared page, so it belongs in the Profile rail like its
 * siblings rather than reachable only through the topbar's icon-only gear shortcut, which stays
 * as a global fast path). One component so every profile page shows the same map; `current` marks
 * the page you're on. Every link here is a profile sub-view of the Profile tab (dimensional
 * precedence, `frame.tsx`).
 * @category navigation
 */
export type ProfileChapter =
  | "accounts"
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
    | "/"
    | "/learn"
    | "/onboarding"
    | "/learn/trading"
    | "/playbooks"
    | "/feedback"
    | "/settings";
  readonly sub?: true;
}[] = [
  { id: "accounts", glyph: "≣", label: "Accounts", to: "/" },
  { id: "milestones", glyph: "◆", label: "Milestones", to: "/learn" },
  { id: "onboarding", glyph: "▦", label: "Onboarding", to: "/onboarding", sub: true },
  { id: "ladder", glyph: "⇄", label: "Trading Desk", to: "/learn/trading", sub: true },
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
        ) : item.to === "/" ? (
          <Link key={item.id} to="/" search={{ by: "equity" }} className={cls}>
            {body}
          </Link>
        ) : (
          <Link key={item.id} to={item.to} className={cls}>
            {body}
          </Link>
        );
      })}
    </>
  );
}
