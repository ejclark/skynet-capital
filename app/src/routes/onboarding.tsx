import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/onboarding` → the Milestones section's Onboarding chapter (#3807 slice 2b). M·01 moved as it
 * was into `shell/onboarding-chapter.tsx`. Safe to redirect only because the Profile page's
 * zero-account door exists: a member with no linked account gets the Profile page opened on this
 * chapter, never an early return that linked back here (the loop the design panel's tiger found).
 * `?moneypenny=intro` rides along — the Profile page opens her rail with the intro.
 */
export const Route = createFileRoute("/onboarding")({
  validateSearch: (search: Record<string, unknown>) =>
    search.moneypenny === "intro" ? { moneypenny: "intro" as const } : {},
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/accounts",
      search: { ...search, section: "milestones", chapter: "onboarding" },
    });
  },
});
