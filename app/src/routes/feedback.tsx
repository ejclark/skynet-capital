import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/feedback` → the Profile page's Feedback section (#3807 slice 2b; #888, viewer-level). The
 * member's own filings ledger moved as it was into `shell/feedback-section.tsx`. Filing itself is
 * Moneypenny's rail; `/feedback/coach` and `/feedback/preview` are server JSON, never this route.
 */
export const Route = createFileRoute("/feedback")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/accounts", search: { ...search, section: "feedback" } });
  },
});
