import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/u/$id/decisions` → `/u/$id/playbooks` with the check log open (#5073's IA call). The bot's
 * Playbooks section lived here through two renames (Decisions → Heartbeat, #3687 → Playbooks,
 * #5037 round 2); its address now follows its name. A saved link here was asking for the bot's
 * checks, so it lands with that log unfolded, the same rule the Profile page's
 * `?section=decisions` alias follows (`profile-sections.ts`). A fill's `#cycle-…` hash rides
 * along, so an old "the whole pass" link still opens on its round. Search (the root's
 * `?on=&span=`) rides along too — one hop, never two.
 */
export const Route = createFileRoute("/u/$id/decisions")({
  beforeLoad: ({ params, search, location }) => {
    throw redirect({
      to: "/u/$id/playbooks",
      params,
      search: { ...search, checks: "open" },
      hash: location.hash,
    });
  },
});
