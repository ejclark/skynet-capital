import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/u/$id/playbooks` → R&D → Playbooks with that account pre-selected (#3623). The Playbook Store
 * (#885) used to render here, on each account's desk; Eric retired the placement on 2026-09-23
 * ("the legacy route should not have the playbook store view"), so this route keeps only the
 * redirect — old bookmarks land on the one home for playbooks, subscribing as the same account.
 */
export const Route = createFileRoute("/u/$id/playbooks")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/research", search: { section: "playbooks", account: params.id } });
  },
});
