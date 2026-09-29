import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/onboarding` → the Milestones section's Onboarding chapter (#3807 slice 2b). M·01 moved as it
 * was into `shell/onboarding-chapter.tsx`. Safe to redirect only because the Profile page's
 * zero-account door exists: a member with no linked account gets the Profile page opened on this
 * chapter, never an early return that linked back here (the loop the design panel's tiger found).
 * Its old `?moneypenny=intro` is dropped (#3816 slice 8): nothing produced it, and the chapter's
 * own "Meet Moneypenny ›" button opens her rail.
 */
export const Route = createFileRoute("/onboarding")({
  beforeLoad: () => {
    throw redirect({
      to: "/accounts",
      search: { section: "milestones", chapter: "onboarding" },
    });
  },
});
