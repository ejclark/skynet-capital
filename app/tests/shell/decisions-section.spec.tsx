import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { DecisionCycle } from "../../src/live/desk";
import { CycleRow, GUARDS_GLOSS } from "../../src/shell/decisions-section";

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

  // #885: "at this time, we do not show what playbooks others are using".
  it("draws no playbook chip on a bot the viewer does not own", () => {
    render(
      <CycleRow
        showPlaybooks={false}
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
    expect(screen.getByText("“panic fade”")).toBeInTheDocument();
    expect(screen.queryByText(/S2-NVDA/)).not.toBeInTheDocument();
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

  it("reads an option order by its contract line, and a limit's unfilled ending in words", () => {
    render(
      <CycleRow
        cycle={cycle({
          outcomes: [
            {
              symbol: "CRWV",
              side: "sell",
              quantity: 1,
              action: "placed",
              reason: "sell a put a month out",
              contract: "SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10",
              resultStatus: "unfilled",
              resultLabel: "limit not reached — canceled",
            },
          ],
        })}
      />,
    );
    open();
    expect(screen.getByText("SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10")).toBeInTheDocument();
    expect(screen.getByText("limit not reached — canceled")).toBeInTheDocument();
    expect(screen.queryByText("SELL 1 CRWV")).not.toBeInTheDocument();
    expect(screen.queryByText("unfilled")).not.toBeInTheDocument();
  });

  // #4650: what the broker said about the result, beside the label — the owner's alone.
  describe("the broker's words on a result", () => {
    const canceled = cycle({
      outcomes: [
        {
          symbol: "CRWV",
          side: "sell",
          quantity: 1,
          action: "placed",
          reason: "sell a put a month out",
          contract: "SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10",
          resultStatus: "unfilled",
          resultLabel: "limit not reached — canceled",
          brokerReason: "limit $2.10 not reached in 15s; canceled",
        },
      ],
    });

    it("says what the broker said beside the result label", () => {
      render(<CycleRow cycle={canceled} />);
      open();
      expect(screen.getByText("limit not reached — canceled")).toBeInTheDocument();
      expect(
        screen.getByText("broker said: limit $2.10 not reached in 15s; canceled"),
      ).toBeInTheDocument();
    });

    it("draws nothing on a bot the viewer does not own, or for a result with no words", () => {
      render(<CycleRow cycle={canceled} showPlaybooks={false} />);
      open();
      expect(screen.queryByText(/broker said/)).not.toBeInTheDocument();
      cleanup();
      render(<CycleRow cycle={cycle()} />);
      open();
      expect(screen.queryByText(/broker said/)).not.toBeInTheDocument();
    });
  });

  it("keeps a part-filled order's 'may still fill' warning beside its fill", () => {
    render(
      <CycleRow
        cycle={cycle({
          outcomes: [
            {
              symbol: "CRWV",
              side: "sell",
              quantity: 3,
              action: "placed",
              reason: "sell puts a month out",
              fill: "1 @ $2.10",
              resultStatus: "working",
              resultLabel: "may still fill — cancel not confirmed",
            },
          ],
        })}
      />,
    );
    open();
    expect(screen.getByText("1 @ $2.10")).toBeInTheDocument();
    expect(screen.getByText("may still fill — cancel not confirmed")).toBeInTheDocument();
  });

  it("names the check that refused an idea, beside the idea itself", () => {
    render(
      <CycleRow
        cycle={cycle({
          status: "refused",
          outcomes: [],
          refusedIntents: [
            {
              symbol: "CRWV",
              side: "sell",
              quantity: 1,
              reason: "sell a put a month out",
              contract: "SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10",
              guardReason: "not a well-formed option order — never sent",
            },
            { symbol: "NVDA", side: "buy", quantity: 60, reason: "panic fade" },
          ],
        })}
      />,
    );
    expect(screen.getByText("SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10")).toBeInTheDocument();
    expect(screen.getByText("not a well-formed option order — never sent")).toBeInTheDocument();
    expect(screen.getByText("BUY 60 NVDA")).toBeInTheDocument();
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

  // #3961: a fill's "why" links to the round that placed it. The row is addressable by that round's
  // timestamp, and the linked-to row arrives open — following the link IS the ask to see it.
  it("carries the round's anchor id, and arrives open when that anchor is the one linked to", () => {
    const at = "2026-09-22T18:59:00Z";
    const anchor = `cycle-${Date.parse(at)}`;
    const { container } = render(<CycleRow cycle={cycle({ at })} openCycle={anchor} />);
    expect(container.querySelector(`#${anchor}`)).not.toBeNull();
    // "placed" normally arrives collapsed; this one is open without a click.
    expect(screen.getByText("“panic fade”")).toBeInTheDocument();
    expect(screen.getByText("past the guards").closest("p")).toHaveTextContent(
      "1 intent from the persona → 1 past the guards",
    );
  });

  it("leaves a placed round collapsed when a DIFFERENT round is the one linked to", () => {
    render(<CycleRow cycle={cycle({ at: "2026-09-22T18:59:00Z" })} openCycle="cycle-1" />);
    expect(screen.queryByText("“panic fade”")).not.toBeInTheDocument();
  });

  it("glosses 'past the guards' in visible words beside the term (#3807 slice 3b-4)", () => {
    render(<CycleRow cycle={cycle({ rawCount: 3, guardedCount: 1 })} />);
    open();
    const term = screen.getByText("past the guards");
    expect(term.tagName).toBe("DFN");
    const line = term.closest("p");
    expect(line).toHaveTextContent(
      "3 intents from the persona → 1 past the guards — the risk checks",
    );
    expect(line).toHaveTextContent(GUARDS_GLOSS);
    expect(screen.getByText(/the risk checks every order must clear/)).toBeVisible();
  });
});
