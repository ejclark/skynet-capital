import { fireEvent, render, screen } from "@testing-library/react";
import type { DeskActivityEvent } from "../../src/live/desk";
import { ActivityTable } from "../../src/shell/activity-table";

/** The Decisions tab folded into its trades (#3687 slice 4): a bot row opens to the decision that
 *  placed it; a row with no decision (a human's, or one the trail never resolved) has no toggle. */

const event = (over: Partial<DeskActivityEvent> = {}): DeskActivityEvent => ({
  orderId: "ord-1",
  symbol: "MSFT",
  display: "MSFT",
  side: "buy",
  quantity: 9,
  filled: 9,
  price: "$428.10",
  status: "filled",
  at: "2026-09-23T19:02:00Z",
  backfilled: false,
  origin: "unknown",
  ...over,
});

const scouted = event({
  reasoning: {
    reason: "BETA-PHASE FORCED PICK — no organic trade fired today",
    personaId: "beta-scout",
    playbookId: "BETA-SCOUT",
    playbookMode: "conservative",
  },
});

describe("ActivityTable — each bot trade opens to its decision", () => {
  it("opens the decision beneath its row: why, who decided, and the playbook", () => {
    render(<ActivityTable events={[scouted]} />);
    expect(screen.queryByText(/BETA-PHASE FORCED PICK/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.getByText(/BETA-PHASE FORCED PICK/)).toBeInTheDocument();
    expect(screen.getByText("beta-scout")).toBeInTheDocument();
    expect(screen.getByText("BETA-SCOUT · conservative")).toBeInTheDocument();
  });

  it("gives a row with no resolved decision no toggle, in a table that has one", () => {
    render(<ActivityTable events={[scouted, event({ orderId: "ord-2" })]} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("adds no why column at all when no row carries a decision — a human account", () => {
    const { container } = render(<ActivityTable events={[event()]} />);
    expect(container.querySelector(".why-col")).toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
