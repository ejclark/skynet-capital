import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/u/$id/activity` → `/u/$id/ledger` (#5281's IA call). The account's list of orders was named
 * Activity until it grew into the ledger the code already called it; Activity is the league's
 * feed in the top nav. A saved link keeps working: its narrowing and `?order=` ride along, and so
 * does an order's `#act-<orderId>` hash, so a Thesis marker or a bot's pass link still lands on
 * its row. One hop, never two.
 */
export const Route = createFileRoute("/u/$id/activity")({
  beforeLoad: ({ params, search, location }) => {
    throw redirect({ to: "/u/$id/ledger", params, search, hash: location.hash });
  },
});
