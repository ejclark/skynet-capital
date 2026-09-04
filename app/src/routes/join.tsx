import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/join` → `/onboarding` (Eric, 2026-09-03: "keep the form in the onboarding section like we
 * designed"). The Alpaca connect form has one home — inside step 5 of the onboarding page's
 * five-step guide (`shell/alpaca-guide.tsx`) — so the standalone join page is gone and every old
 * link (`/add`, Settings' "Add an account", bookmarks) lands there. Admins adding a second account
 * (a bot) reopen the guide from the connected step; members never see a second door.
 */
export const Route = createFileRoute("/join")({
  beforeLoad: () => {
    throw redirect({ to: "/onboarding" });
  },
});
