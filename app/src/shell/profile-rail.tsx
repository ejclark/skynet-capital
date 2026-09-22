import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * THE PROFILE RAIL (#1119, the canvas's left rail under the Profile tab): Accounts (your own book —
 * one account or all, #2321), Milestones (the table of contents), its three chapters — Onboarding ·
 * Trading · Playbooks — Feedback (Eric, 2026-09-03: the ledger of filings that became GitHub issues
 * lives under Profile now that filing itself is Moneypenny's rail), and Settings (Eric, 2026-09-04:
 * it's a user-geared page, so it belongs in the Profile rail like its siblings rather than reachable
 * only through the topbar's icon-only gear shortcut, which stays as a global fast path). One
 * component so every profile page shows the same map; `current` marks the page you're on. Every
 * link here is a profile sub-view of the Profile tab (dimensional precedence, `frame.tsx`).
 *
 * The cross-user standings board moved OUT to its own top-level Leaderboard destination (#2321) —
 * Profile is user-centric, a leaderboard spanning every player/bot is not. "Accounts" here is the
 * unified per-account Summary/Positions/Activity view instead, human and bot alike.
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
    | "/accounts"
    | "/learn"
    | "/onboarding"
    | "/learn/trading"
    | "/playbooks"
    | "/feedback"
    | "/settings";
  readonly sub?: true;
}[] = [
  { id: "accounts", glyph: "≣", label: "Accounts", to: "/accounts" },
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
        const isCurrent = item.id === current;
        // Always the same element (a Link, never a Link-or-span ternary): with the same `key`
        // but a different tag, React can't reuse the DOM node across navigations and destroys +
        // recreates it instead — in the mobile rail's horizontal row that remount reflows every
        // sibling after it, reading as the icons shifting left then back right on each click.
        // `__root.tsx`'s own topnav avoids exactly this by staying one `<Link>` throughout.
        const cls = `rail-item${item.sub ? " rail-sub" : ""}${isCurrent ? " rail-current" : ""}`;
        return (
          <Link
            key={item.id}
            to={item.to}
            className={cls}
            aria-current={isCurrent ? "page" : undefined}
          >
            <span className="rail-glyph" aria-hidden="true">
              {item.glyph}
            </span>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
