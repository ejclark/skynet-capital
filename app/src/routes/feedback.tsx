import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/feedback` → the Profile page's Journal section (#3807 slice 2b; #888, viewer-level; renamed
 * from Feedback in #8190). The member's own filings ledger moved into `shell/journal-section.tsx`,
 * beside their wishes and private notes. A chat filing is Moneypenny's; `/feedback/coach` and `/feedback/preview` are server JSON, never this route.
 */
export const Route = createFileRoute("/feedback")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/accounts", search: { ...search, section: "feedback" } });
  },
});
