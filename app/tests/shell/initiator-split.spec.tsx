import { render, screen, within } from "@testing-library/react";
import type { InitiatorSplitView } from "../../src/live/playbook-performance";
import { InitiatorSplit } from "../../src/shell/initiator-split";

/**
 * Who started the bots' closed trades (#4450 slice 4, EARS 4). WHEN trade stats are reported, the
 * split SHALL show a playbook's signal, the forced pick and a bot's own rules as separate rows,
 * the playbook row always present, and SHALL never fold untraced trips into any of them.
 */

const split = (over: Partial<InitiatorSplitView> = {}): InitiatorSplitView => ({
  rows: [
    { initiator: "playbook", trades: 0, wins: 0, losses: 0, winRate: null, netRealized: 0 },
    { initiator: "forced", trades: 12, wins: 5, losses: 7, winRate: 41.7, netRealized: -84.5 },
    { initiator: "persona", trades: 1, wins: 1, losses: 0, winRate: 100, netRealized: 12 },
  ],
  untraced: 0,
  ...over,
});

const cell = (label: string) => {
  const dt = screen.getByText(label);
  const div = dt.parentElement;
  if (!div) throw new Error(`no cell ${label}`);
  return within(div);
};

describe("InitiatorSplit", () => {
  it("leads with a playbook's own signal and says zero in words, never a blank", () => {
    render(<InitiatorSplit heading="Who started the bots' closed trades" split={split()} />);
    const labels = screen.getAllByRole("term").map((t) => t.textContent);
    expect(labels).toEqual([
      "A playbook's own signal",
      "The forced daily pick",
      "A bot's own rules",
    ]);
    expect(cell("A playbook's own signal").getByText("0 closed trades")).toBeInTheDocument();
    expect(cell("A playbook's own signal").getByText("nothing to measure yet")).toBeInTheDocument();
  });

  it("spells the sign out and keeps the forced pick's numbers on its own row", () => {
    render(<InitiatorSplit heading="Who started the bots' closed trades" split={split()} />);
    expect(cell("The forced daily pick").getByText("12 closed trades")).toBeInTheDocument();
    expect(cell("The forced daily pick").getByText(/net -\$84\.50 · 42% won/)).toBeInTheDocument();
    expect(cell("A bot's own rules").getByText("1 closed trade")).toBeInTheDocument();
  });

  it("marks the numbers as simulated", () => {
    render(<InitiatorSplit heading="Who started the bots' closed trades" split={split()} />);
    expect(screen.getByText("SIM")).toBeInTheDocument();
  });

  it("names untraced trips on a line of their own, and only when there are some", () => {
    const { rerender } = render(<InitiatorSplit heading="h" split={split()} />);
    expect(screen.queryByText(/no recorded decision accounts for/)).not.toBeInTheDocument();
    rerender(<InitiatorSplit heading="h" split={split({ untraced: 3 })} />);
    expect(
      screen.getByText(/3 more closed trades on bot accounts that no recorded decision/),
    ).toBeInTheDocument();
  });
});
