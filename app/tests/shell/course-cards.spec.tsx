import { render, screen } from "@testing-library/react";
import type { Journey } from "../../src/live/learn";
import { Hud, ladderProgress, MilestoneRow } from "../../src/shell/course-cards";

// The ladder's cards moved out of the /learn route (#1119). Same honesty rule: an earned row
// shows its proof (fill date + order id); an unearned one shows the ticket link and never a tick.
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

describe("MilestoneRow", () => {
  it("shows the proof on an earned row, no ticket link", () => {
    render(
      <ul>
        <MilestoneRow
          milestone={{
            id: "first-buy",
            title: "Buy your first stock",
            detail: "",
            points: 25,
            ticket: "/app/trade?play=101",
            earned: { on: "2026-09-01", orderId: "ord-1" },
          }}
        />
      </ul>,
    );
    expect(screen.getByText(/filled 2026-09-01 · order ord-1/)).toBeInTheDocument();
    expect(screen.queryByText("open the ticket →")).not.toBeInTheDocument();
  });

  it("offers the ticket on an unearned row", () => {
    render(
      <ul>
        <MilestoneRow
          milestone={{
            id: "first-sell",
            title: "Sell",
            detail: "",
            points: 25,
            ticket: "/app/trade?play=102",
          }}
        />
      </ul>,
    );
    expect(screen.getByRole("link", { name: "open the ticket →" })).toHaveAttribute(
      "href",
      "/app/trade?play=102",
    );
  });
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
