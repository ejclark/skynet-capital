import { render, screen } from "@testing-library/react";
import type { Journey } from "../../src/live/learn";
import { Hud, ladderProgress } from "../../src/shell/course-cards";

// The journey's HUD and ladder count. The level cards that lived beside them retired into the
// trading chapter's one ladder list (#5242) — its rows are pinned in ladder-list.spec.tsx.
const journey = (points: number): Journey => ({
  linked: true,
  points,
  totalPoints: 200,
  rank: "Apprentice",
  courses: [
    {
      level: 100,
      title: "Stock basics",
      subtitle: "",
      locked: false,
      done: 1,
      total: 2,
      milestones: [],
    },
    {
      level: 200,
      title: "The Wheel",
      subtitle: "",
      locked: true,
      done: 0,
      total: 2,
      milestones: [],
    },
  ],
  celebrating: [],
  engagementCelebrating: [],
  pendingChecks: 0,
});

describe("Hud", () => {
  it("shows the ladder's own points by default, and folds onboarding in when asked", () => {
    const { rerender } = render(<Hud journey={journey(25)} />);
    expect(screen.getByText("25 / 200")).toBeInTheDocument();
    rerender(<Hud journey={journey(25)} extraPoints={10} extraTotal={30} />);
    expect(screen.getByText("35 / 230")).toBeInTheDocument();
  });
});

describe("ladderProgress", () => {
  it("sums done and total across courses", () => {
    expect(ladderProgress(journey(0))).toEqual({ done: 1, total: 4 });
  });
});
