import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/learn` → the Profile page's Milestones section (#3807 slice 2b; #888, viewer-level). The table
 * of contents moved as it was into `shell/milestones-section.tsx`; this route stays only so a
 * bookmark or an in-app link lands there, search (the root's `?on=&span=`) riding along. The
 * server's twin is `src/server/legacy-redirects.ts` — one hop, never two.
 */
export const Route = createFileRoute("/learn")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/accounts", search: { ...search, section: "milestones" } });
  },
});
