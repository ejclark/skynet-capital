import { render, screen } from "@testing-library/react";
import type { PlaybookMetricsView } from "../../src/live/playbook-performance";
import {
  AccountPlaybookMetrics,
  cycleLabel,
  HousePlaybookMetrics,
  holdLabel,
  mixLabel,
} from "../../src/shell/playbook-metrics";

/**
 * The selected account's own numbers on a playbook card (#3665 slice 3). The server does the
 * scoping and the math (`tests/server/playbook-performance.spec.ts`, `tests/trading/trade-stats.
 * spec.ts`); these pin what the card is allowed to say about them — above all that an absent read
 * and a zero-trade read never print as numbers.
 */

const HOUR = 3_600_000;

const row: PlaybookMetricsView = {
  playbookId: "S1-NVDA",
  trades: 4,
  wins: 3,
  losses: 1,
  winRate: 75,
  netRealized: 420,
  returnPct: 3.5,
  capitalCommitted: 12_000,
  avgHoldMs: 30 * HOUR,
  longestHold: { holdMs: 76 * HOUR },
  shortestHold: { holdMs: 2 * HOUR + 15 * 60_000 },
  byDirection: { long: 3, short: 1 },
  byInstrument: { stock: 0, call: 4, put: 0 },
  byCycle: { weekly: 1, monthly: 3, quarterly: 0 },
};

describe("AccountPlaybookMetrics", () => {
  it("names the account and marks the numbers as simulated", () => {
    render(<AccountPlaybookMetrics accountName="Uncle Joe" scope={{ kind: "read", row }} />);
    expect(screen.getByRole("heading", { name: /Uncle Joe on this playbook/ })).toBeInTheDocument();
    expect(screen.getByText("SIM")).toBeInTheDocument();
  });

  it("renders the trade count with only the directions and instruments that happened", () => {
    render(<AccountPlaybookMetrics accountName="Joe" scope={{ kind: "read", row }} />);
    expect(screen.getByText("3 long · 1 short · 4 call")).toBeInTheDocument();
  });

  it("shows the expiration-cycle mix, shortest-dated first", () => {
    render(<AccountPlaybookMetrics accountName="Joe" scope={{ kind: "read", row }} />);
    expect(screen.getByText("Expiration cycle")).toBeInTheDocument();
    expect(screen.getByText("1 weekly · 3 monthly")).toBeInTheDocument();
  });

  it("says a share-only playbook has no expirations rather than printing zeros", () => {
    const shares = {
      ...row,
      byInstrument: { stock: 4, call: 0, put: 0 },
      byCycle: { weekly: 0, monthly: 0, quarterly: 0 },
    };
    render(<AccountPlaybookMetrics accountName="Joe" scope={{ kind: "read", row: shares }} />);
    expect(screen.getByText(/shares carry no expiration/)).toBeInTheDocument();
  });

  it("spells out the sign on P/L in dollars and percent, never by colour alone", () => {
    render(<AccountPlaybookMetrics accountName="Joe" scope={{ kind: "read", row }} />);
    expect(screen.getByText("+$420.00")).toBeInTheDocument();
    expect(screen.getByText("+3.5% of capital committed")).toBeInTheDocument();
    expect(screen.getByText("$12,000.00")).toBeInTheDocument();
  });

  it("prints an unmeasurable win rate and return as a dash, not zero", () => {
    const scratched = { ...row, wins: 0, losses: 0, winRate: null, returnPct: null };
    render(<AccountPlaybookMetrics accountName="Joe" scope={{ kind: "read", row: scratched }} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("— of capital committed")).toBeInTheDocument();
  });

  it("says in words when the account has no closed trades on the playbook", () => {
    render(<AccountPlaybookMetrics accountName="Joe" scope={{ kind: "read" }} />);
    expect(screen.getByText(/No closed trades on this playbook yet/)).toBeInTheDocument();
    expect(screen.queryByText("Closed trades")).not.toBeInTheDocument();
  });

  it("says the history is unreadable rather than showing zero trades", () => {
    render(<AccountPlaybookMetrics accountName="Joe" scope={{ kind: "unreadable" }} />);
    expect(screen.getByText(/isn't readable right now/)).toBeInTheDocument();
    expect(screen.queryByText(/No closed trades/)).not.toBeInTheDocument();
  });
});

describe("HousePlaybookMetrics", () => {
  it("names every account as its scope and marks the numbers as simulated", () => {
    render(<HousePlaybookMetrics scope={{ kind: "read", row }} />);
    expect(screen.getByRole("heading", { name: /House — every account/ })).toBeInTheDocument();
    expect(screen.getByText("SIM")).toBeInTheDocument();
    expect(screen.getByText("+$420.00")).toBeInTheDocument();
  });

  it("says in words when no account has closed a trade on the playbook", () => {
    render(<HousePlaybookMetrics scope={{ kind: "read" }} />);
    expect(
      screen.getByText(/No account has closed a trade on this playbook yet/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Closed trades")).not.toBeInTheDocument();
  });

  it("says the house history is unreadable rather than showing zero trades", () => {
    render(<HousePlaybookMetrics scope={{ kind: "unreadable" }} />);
    expect(screen.getByText(/house-wide trade history isn't readable/)).toBeInTheDocument();
  });
});

describe("holdLabel", () => {
  it("uses the two coarsest units that matter", () => {
    expect(holdLabel(76 * HOUR)).toBe("3d 4h");
    expect(holdLabel(2 * HOUR + 15 * 60_000)).toBe("2h 15m");
    expect(holdLabel(12 * 60_000)).toBe("12m");
  });

  it("prints a dash for a hold that was never measured", () => {
    expect(holdLabel(null)).toBe("—");
    expect(holdLabel(undefined)).toBe("—");
  });
});

describe("mixLabel", () => {
  it("drops the zero counts", () => {
    expect(mixLabel({ stock: 2, call: 0, put: 1 })).toBe("2 stock · 1 put");
  });
});

describe("cycleLabel", () => {
  it("lists only the cycles that were traded, shortest-dated first", () => {
    expect(cycleLabel({ weekly: 2, monthly: 0, quarterly: 1 })).toBe("2 weekly · 1 quarterly");
  });

  it("says why there is nothing to show when no option was traded", () => {
    expect(cycleLabel({ weekly: 0, monthly: 0, quarterly: 0 })).toBe(
      "no option trades — shares carry no expiration",
    );
  });
});
