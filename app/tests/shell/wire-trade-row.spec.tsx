import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { WireTrade } from "../../src/live/wire";
import { TradeRow } from "../../src/shell/wire-trade-row";

// `TradeRow` renders a `<Link to="/u/$id">` per row — no route tree is mounted in this
// component-level spec, so `Link` is stubbed to a plain anchor (mirrors wire-row.spec.tsx).
rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    params,
    children,
    ...rest
  }: {
    readonly params?: { readonly id?: string };
    readonly children?: ReactNode;
  }) => (
    <a href={`/u/${params?.id ?? ""}`} {...rest}>
      {children}
    </a>
  ),
}));

/**
 * `TradeRow` (PR 6, issue #2287) — the activity row's expandable "why + vitals" detail. Collapsed
 * by default, disabled/inert when there's nothing to expand, and every gauge word/number renders
 * regardless of measurement state so hue never carries meaning alone.
 */

const trade = (overrides: Partial<WireTrade> = {}): WireTrade => ({
  key: "k-1",
  side: "buy",
  symbol: "NVDA",
  quantity: 10,
  price: "$176.42",
  who: "Sauron",
  whoId: "sauron",
  kind: "bot",
  reconstructed: false,
  when: "2:30p",
  ...overrides,
});

function renderRow(overrides: Partial<WireTrade> = {}) {
  return render(
    <ul>
      <TradeRow trade={trade(overrides)} />
    </ul>,
  );
}

describe("TradeRow", () => {
  it("renders the collapsed row exactly as before — no detail visible", () => {
    renderRow();
    expect(screen.getByText("NVDA")).toBeInTheDocument();
    expect(screen.getByText("Sauron")).toBeInTheDocument();
    expect(screen.queryByText(/"/)).not.toBeInTheDocument();
  });

  it("disables the toggle when there is nothing to expand — never a dead-end affordance", () => {
    renderRow();
    const toggle = screen.getByRole("button");
    expect(toggle).toBeDisabled();
    expect(toggle).not.toHaveAttribute("aria-expanded");
  });

  it("expands to show the persona's reasoning on click", () => {
    renderRow({ reasoning: { reason: "panic fade", strategy: "sauron-panic-claim" } });
    const toggle = screen.getByRole("button");
    expect(toggle).toBeEnabled();
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText('"panic fade"')).toBeInTheDocument();
    expect(screen.getByText("sauron-panic-claim")).toBeInTheDocument();
  });

  it("shows the guard-delta line only when the guards resized the ask", () => {
    renderRow({
      reasoning: { reason: "x", guardDelta: "persona asked for 60, risk guards sized it to 20" },
    });
    fireEvent.click(screen.getByRole("button"));
    expect(
      screen.getByText("persona asked for 60, risk guards sized it to 20"),
    ).toBeInTheDocument();
  });

  it("says plainly when no decision was recorded for a bot fill", () => {
    renderRow({ vitals: undefined, reasoning: undefined, kind: "bot" });
    // Nothing to expand at all when both are absent — the toggle itself is disabled and inert.
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders every vitals gauge with its word and number, measured or not", () => {
    renderRow({
      vitals: {
        lossHeadroom: {
          label: "Loss headroom",
          measured: true,
          fraction: 0.62,
          valueText: "62% left",
        },
        edgeVsHold: { label: "Edge vs. hold", measured: false, valueText: "not yet measured" },
        proof: { label: "Proof", measured: false, valueText: "unproven" },
        breadth: { label: "Breadth", measured: false, valueText: "not yet measured" },
      },
    });
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("62% left")).toBeInTheDocument();
    expect(screen.getByText("unproven")).toBeInTheDocument();
    expect(screen.getAllByText("not yet measured")).toHaveLength(2);
    // A measured gauge gets a real progressbar value; an unmeasured one never fakes one.
    const bars = screen.getAllByRole("progressbar");
    expect(bars[0]).toHaveAttribute("aria-valuenow", "62");
    expect(bars[1]).not.toHaveAttribute("aria-valuenow");
  });

  it("never lets a human trade's row claim reasoning that isn't there", () => {
    renderRow({ kind: "human", who: "Eric", whoId: "eric" });
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
