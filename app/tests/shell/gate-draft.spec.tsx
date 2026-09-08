import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { PlayInfo } from "../../src/live/options";
import { OptionGate } from "../../src/shell/option-gate";
import { TradeGate } from "../../src/shell/trade-gate";

/**
 * The pre-trade gate's idle draft step (#738 phase 2e amendment) — the "Draft — nothing is sent
 * until every check passes" head said nothing the Review order button didn't already say, so both
 * tickets now render no status head while drafting. The `.gate` `aria-live="polite"` wrapper
 * itself STAYS mounted on the draft step, empty — a live region has to already exist in the DOM
 * before content lands in it, or assistive tech commonly won't announce the draft →
 * "Reviewing against the desk…" transition; only its chrome (border/shadow/margin) is suppressed
 * via `.gate:empty` in gate.css. Every other step is covered by rendering the components live and
 * driving them — this spec only pins the one step that changed: fresh mount, before any review
 * has happened.
 */

const unlockedCallPlay: PlayInfo = {
  code: "201",
  id: "201",
  name: "Buy Call",
  tldr: "",
  kind: "option",
  side: "buy",
  optionType: "call",
  gloss: "",
  locked: false,
  earned: true,
};

const DRAFT_TEXT = "nothing is sent until every check passes";

describe("the gate's idle draft step", () => {
  it("TradeGate renders no status head on fresh mount", () => {
    render(<TradeGate deskId="desk-1" />);

    expect(screen.queryByText(DRAFT_TEXT, { exact: false })).not.toBeInTheDocument();
  });

  it("TradeGate keeps the aria-live region mounted but empty on fresh mount", () => {
    const { container } = render(<TradeGate deskId="desk-1" />);

    const gate = container.querySelector(".gate");
    expect(gate).not.toBeNull();
    expect(gate?.childElementCount).toBe(0);
    expect(gate?.getAttribute("aria-live")).toBe("polite");
  });

  it("OptionGate renders no status head on fresh mount", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <OptionGate deskId="desk-1" play={unlockedCallPlay} />
      </QueryClientProvider>,
    );

    expect(screen.queryByText(DRAFT_TEXT, { exact: false })).not.toBeInTheDocument();
  });

  it("OptionGate keeps the aria-live region mounted but empty on fresh mount", () => {
    const client = new QueryClient();
    const { container } = render(
      <QueryClientProvider client={client}>
        <OptionGate deskId="desk-1" play={unlockedCallPlay} />
      </QueryClientProvider>,
    );

    const gate = container.querySelector(".gate");
    expect(gate).not.toBeNull();
    expect(gate?.childElementCount).toBe(0);
    expect(gate?.getAttribute("aria-live")).toBe("polite");
  });

  it("OptionGate labels the underlying field Symbol and the quantity field Contracts (100 shares)", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <OptionGate deskId="desk-1" play={unlockedCallPlay} />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText("Symbol")).toBeInTheDocument();
    expect(screen.getByLabelText("Contracts (100 shares)")).toBeInTheDocument();
  });
});
