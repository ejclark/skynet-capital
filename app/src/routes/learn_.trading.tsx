import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/learn/trading` → the Milestones section's Trading chapter (#3807 slice 2b). M·02 moved as it
 * was into `shell/ladder-chapter.tsx`; a chapter is a `?chapter=` now, not a route (#1119's
 * Claude-derived fork, reversed — docs/PATTERNS.md, "Viewer-level section").
 */
export const Route = createFileRoute("/learn_/trading")({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/accounts",
      search: { ...search, section: "milestones", chapter: "trading" },
    });
  },
});
