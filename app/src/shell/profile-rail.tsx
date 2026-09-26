import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * THE PROFILE LINKS ON SETTINGS (#1119's left rail, shrunk by #3807 slice 2b): Accounts (the
 * Profile page — the book, one account or all, #2321; its Milestones and Feedback are sections of it)
 * and Settings (Eric, 2026-09-04: a user-geared page, so it belongs beside its sibling rather than
 * reachable only through the topbar's gear, which stays as a global fast path). `current` marks
 * the page you're on.
 *
 * WHY ONLY TWO: the Profile page's section switch is the map now (docs/IA.md §8 — a group's sub-nav
 * becomes its home page's section switch), so `/accounts` renders no link row at all, and
 * Milestones · its three chapters · Feedback are `?section=`/`?chapter=` of that page, their old
 * routes redirects. Settings keeps this list inside its own stage (Eric's carve-out, #3807 2a).
 *
 * The cross-user standings board is its own top-level Leaderboard destination (#2321) — Profile is
 * user-centric, a leaderboard spanning every player/bot is not.
 * @category navigation
 */
export type ProfileChapter = "accounts" | "settings";

const ITEMS: readonly {
  readonly id: ProfileChapter;
  readonly glyph: string;
  readonly label: string;
  readonly to: "/accounts" | "/settings";
}[] = [
  { id: "accounts", glyph: "≣", label: "Accounts", to: "/accounts" },
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
        // recreates it instead — in a horizontal row that remount reflows every sibling after it,
        // reading as the icons shifting left then back right on each click. `__root.tsx`'s own
        // topnav avoids exactly this by staying one `<Link>` throughout.
        const cls = `rail-item${isCurrent ? " rail-current" : ""}`;
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
