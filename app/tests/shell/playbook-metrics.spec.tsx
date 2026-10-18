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

describe("HousePlaybookMetrics' funnel line (#4450 slices 5a–5b)", () => {
  const counts = { checks: 1240, asked: 4, refused: 3, placed: 1, filled: 1 };
  const funnelRow = {
    playbookId: "S1-NVDA",
    totals: counts,
    days: [],
    askedOn: 2,
    refusals: [
      { label: "blocked by S2 (flat through the print)", count: 2 },
      { label: "no live quote for the symbol", count: 1 },
    ],
  };

  it("walks checks to fills across every bot, and names the guard that refused most", () => {
    render(
      <HousePlaybookMetrics scope={{ kind: "read", funnel: { sessions: 10, row: funnelRow } }} />,
    );
    expect(screen.getByText("Last 10 sessions, every bot")).toBeInTheDocument();
    expect(
      screen.getByText("1,240 checks → 4 orders asked for → 3 refused → 1 placed → 1 filled"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "asked on 2 of 10 sessions · most refused: blocked by S2 (flat through the print)",
      ),
    ).toBeInTheDocument();
  });

  it("draws beside the closed-trade numbers, never instead of them", () => {
    render(
      <HousePlaybookMetrics
        scope={{ kind: "read", row, funnel: { sessions: 10, row: funnelRow } }}
      />,
    );
    expect(screen.getByText("Closed trades")).toBeInTheDocument();
    expect(screen.getByText("Last 10 sessions, every bot")).toBeInTheDocument();
  });

  it("stops the chain at no orders for a checked playbook that never asked", () => {
    const quiet = {
      ...funnelRow,
      totals: { ...counts, asked: 0, refused: 0, placed: 0, filled: 0 },
      askedOn: 0,
      refusals: [],
    };
    render(<HousePlaybookMetrics scope={{ kind: "read", funnel: { sessions: 10, row: quiet } }} />);
    expect(screen.getByText("1,240 checks → no orders asked for")).toBeInTheDocument();
    expect(screen.getByText("asked on 0 of 10 sessions")).toBeInTheDocument();
  });

  it("puts the signals stage between checks and orders where a check measures the signal (slice 5b)", () => {
    const counted = {
      ...funnelRow,
      totals: { ...counts, signals: 18 },
      passSignal: "counted" as const,
      signalledOn: 3,
    };
    render(
      <HousePlaybookMetrics scope={{ kind: "read", funnel: { sessions: 10, row: counted } }} />,
    );
    expect(
      screen.getByText(
        "1,240 checks → 18 signals → 4 orders asked for → 3 refused → 1 placed → 1 filled",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "signal on 3 of 10 sessions · asked on 2 of 10 sessions · most refused: blocked by S2 (flat through the print)",
      ),
    ).toBeInTheDocument();
  });

  it("says no signals in words when a counted playbook raised none", () => {
    const quiet = {
      ...funnelRow,
      totals: { ...counts, signals: 0, asked: 0, refused: 0, placed: 0, filled: 0 },
      passSignal: "counted" as const,
      signalledOn: 0,
      askedOn: 0,
      refusals: [],
    };
    render(<HousePlaybookMetrics scope={{ kind: "read", funnel: { sessions: 10, row: quiet } }} />);
    expect(screen.getByText("1,240 checks → no signals → no orders asked for")).toBeInTheDocument();
    expect(
      screen.getByText("signal on 0 of 10 sessions · asked on 0 of 10 sessions"),
    ).toBeInTheDocument();
  });

  it.each([
    ["unmeasured" as const, "its signal is measured by research runs, not by a check"],
    ["none" as const, "declares no research signal"],
  ])("skips the stage and says why for a %s playbook, never 0 signals", (passSignal, note) => {
    const skipped = {
      ...funnelRow,
      totals: { ...counts, signals: null },
      passSignal,
      signalledOn: null,
    };
    render(
      <HousePlaybookMetrics scope={{ kind: "read", funnel: { sessions: 10, row: skipped } }} />,
    );
    expect(
      screen.getByText("1,240 checks → 4 orders asked for → 3 refused → 1 placed → 1 filled"),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`^${note} · asked on 2 of 10`))).toBeInTheDocument();
    expect(screen.queryByText(/signal on/)).not.toBeInTheDocument();
  });

  it("says no bot checked a playbook that isn't on any bot's roster", () => {
    render(<HousePlaybookMetrics scope={{ kind: "read", funnel: { sessions: 10 } }} />);
    expect(screen.getByText("Last 10 sessions: no bot checked this playbook.")).toBeInTheDocument();
  });

  it("draws no funnel where the server has none", () => {
    render(<HousePlaybookMetrics scope={{ kind: "read" }} />);
    expect(screen.queryByText(/Last 10 sessions/)).not.toBeInTheDocument();
  });
});
