import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/playbooks` → the Milestones section's Playbooks chapter (#3807 slice 2b). M·03 moved as it was
 * into `shell/playbooks-chapter.tsx` — still not R&D's Playbook Store (#3622 parked, #3527).
 */
export const Route = createFileRoute("/playbooks")({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/accounts",
      search: { ...search, section: "milestones", chapter: "playbooks" },
    });
  },
});
