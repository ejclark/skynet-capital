import type { CapitalFlow } from "../../src/observatory/capital-flow.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { standingsBoardView } from "../../src/observatory/standings-board-view.js";

// #4563 slice 2 — a member who refunded their paper balance from $700k to $1M sits above honest
// $900k rows on the default board. The row keeps its place (nothing is hidden or penalized) and
// says what happened.

const snap = (id: string, equity: number): ParticipantSnapshot => ({
  id,
  displayName: id,
  kind: "human",
  cash: equity,
  equity,
  positions: [],
});

const board: DashboardData = {
  generatedAt: "2026-10-05T15:00:00.000Z",
  participants: [snap("refunded", 1_000_000), snap("honest", 900_000)],
  collisions: [],
};

const topUp: CapitalFlow = {
  participantId: "refunded",
  from: "2026-10-05T14:00:00.000Z",
  at: "2026-10-05T14:05:00.000Z",
  amount: 300_000,
  direction: "added",
  unexplainedCash: 300_000,
  basis: "inferred",
};

const flowsFor = (id: string): readonly CapitalFlow[] => (id === "refunded" ? [topUp] : []);

describe("standingsBoardView with recorded capital flows", () => {
  it("marks the row that carries a flow, naming the amount and that it is not a gain", () => {
    const row = standingsBoardView(board, "equity", flowsFor).rows.find(
      (r) => r.key === "refunded",
    );
    expect(row?.flow).toMatchObject({
      direction: "added",
      text: "Capital added $300,000 on Oct 5 — not a gain · inferred",
    });
  });

  it("never hides, refuses or re-ranks a row for carrying a flow", () => {
    const plain = standingsBoardView(board, "equity");
    const marked = standingsBoardView(board, "equity", flowsFor);
    expect(marked.rows.map((r) => [r.key, r.value, r.sortValue])).toEqual(
      plain.rows.map((r) => [r.key, r.value, r.sortValue]),
    );
  });

  it("renders a row with no flow exactly as it does today — no key, no empty mark", () => {
    const row = standingsBoardView(board, "equity", flowsFor).rows.find((r) => r.key === "honest");
    const today = standingsBoardView(board, "equity").rows.find((r) => r.key === "honest");
    expect(row).toEqual(today);
    expect(row && "flow" in row).toBe(false);
  });

  it("leaves the flow-adjusted 1M return's math untouched", () => {
    const withMonth: DashboardData = {
      ...board,
      participants: board.participants.map((p) => ({ ...p, monthReturnPct: 1.5 })),
    };
    const plain = standingsBoardView(withMonth, "month");
    const marked = standingsBoardView(withMonth, "month", flowsFor);
    expect(marked.rows.map((r) => [r.value, r.sortValue])).toEqual(
      plain.rows.map((r) => [r.value, r.sortValue]),
    );
  });
});
