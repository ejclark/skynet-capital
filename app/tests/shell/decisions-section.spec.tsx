import { fireEvent, render, screen } from "@testing-library/react";
import type { DecisionCycle } from "../../src/live/desk";
import { CycleRow } from "../../src/shell/decisions-section";

/** `CycleRow`/`OutcomeLine`'s rendering of the context fields `decision-json-view.ts` already
 *  captures (momentum, sentiment, playbook mode, guard delta) — present-only, matching the house
 *  honesty rule that an absent field renders nothing rather than a placeholder. A "placed" cycle
 *  arrives collapsed (only halted/rejected/refused arrive open), so every case opens it first. */
function open() {
  fireEvent.click(screen.getByRole("button"));
}

const cycle = (over: Partial<DecisionCycle> = {}): DecisionCycle => ({
  at: "2026-09-22T00:00:00Z",
  mode: "live",
  status: "placed",
  headline: "1 placed",
  rawCount: 1,
  guardedCount: 1,
  outcomes: [
    {
      symbol: "NVDA",
      side: "buy",
      quantity: 10,
      action: "placed",
      reason: "panic fade",
    },
  ],
  ...over,
});

describe("CycleRow", () => {
  it("renders momentum and sentiment together when both are present", () => {
    render(
      <CycleRow
        cycle={cycle({
          outcomes: [
            {
              symbol: "NVDA",
              side: "buy",
              quantity: 10,
              action: "placed",
              reason: "panic fade",
              momentum: 0.42,
              sentiment: -0.15,
            },
          ],
        })}
      />,
    );
    open();
    expect(screen.getByText("momentum 0.42 · sentiment -0.15")).toBeInTheDocument();
  });

  it("omits the context line entirely when neither momentum nor sentiment is present", () => {
    render(<CycleRow cycle={cycle()} />);
    open();
    expect(screen.queryByText(/momentum/)).not.toBeInTheDocument();
    expect(screen.queryByText(/sentiment/)).not.toBeInTheDocument();
  });

  it("appends playbook mode to the playbook chip, never standalone", () => {
    render(
      <CycleRow
        cycle={cycle({
          outcomes: [
            {
              symbol: "NVDA",
              side: "buy",
              quantity: 10,
              action: "placed",
              reason: "panic fade",
              playbook: "S2-NVDA",
              playbookMode: "aggressive",
            },
          ],
        })}
      />,
    );
    open();
    expect(screen.getByText("S2-NVDA · aggressive")).toBeInTheDocument();
  });

  it("renders guardDelta as its own line when the outcome was clamped", () => {
    render(
      <CycleRow
        cycle={cycle({
          outcomes: [
            {
              symbol: "NVDA",
              side: "buy",
              quantity: 20,
              action: "placed",
              reason: "panic fade",
              guardDelta: "persona asked for 60, risk guards sized it to 20",
            },
          ],
        })}
      />,
    );
    open();
    expect(
      screen.getByText("persona asked for 60, risk guards sized it to 20"),
    ).toBeInTheDocument();
  });

  it("renders none of the new fields when the outcome carries none of them", () => {
    render(<CycleRow cycle={cycle()} />);
    open();
    expect(screen.queryByText(/momentum|sentiment/)).not.toBeInTheDocument();
    expect(screen.queryByText("persona asked for", { exact: false })).not.toBeInTheDocument();
  });

  it("renders a collapsed quiet run's full idle span, oldest–newest, when quietSince is present", () => {
    render(
      <CycleRow
        cycle={cycle({
          status: "quiet",
          headline: "no signals fired for 37 cycles — watching",
          at: "2026-09-22T18:59:00Z",
          quietSince: "2026-09-22T18:22:00Z",
          outcomes: [],
        })}
      />,
    );
    expect(screen.getByText("no signals fired for 37 cycles — watching")).toBeInTheDocument();
    // Both ends of the range render as "<from> – <to>", not just the run's newest cycle — locale
    // formatting of the timestamps themselves is `toLocaleString`'s concern, not this test's.
    expect(screen.getByText(/–/)).toBeInTheDocument();
  });

  it("renders only the single timestamp when quietSince is absent — the ordinary case", () => {
    render(<CycleRow cycle={cycle()} />);
    expect(screen.queryByText(/–/)).not.toBeInTheDocument();
  });

  it("badges a cycle recorded by another persona pooled onto this account (found live, 2026-09-24)", () => {
    render(<CycleRow cycle={cycle({ authorPersona: "beta-scout" })} />);
    expect(screen.getByText("via beta-scout")).toBeInTheDocument();
  });

  it("renders no persona badge for the account's own cycles — the ordinary case", () => {
    render(<CycleRow cycle={cycle()} />);
    expect(screen.queryByText(/^via /)).not.toBeInTheDocument();
  });
});
