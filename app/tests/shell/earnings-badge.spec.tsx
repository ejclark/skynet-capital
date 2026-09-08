import { render, screen } from "@testing-library/react";
import { EarningsBadge } from "../../src/shell/earnings-badge";

/**
 * `EarningsBadge` (#2017 Phase 1 slice 11) — React port of `earnings-chain-badge.ts`'s
 * `earningsBadge`. Reuses the real `UPCOMING_PRINTS` table (no calendar-override prop — the
 * component's public contract stays `{ symbol, now? }`, matching the legacy function's own
 * `symbol`/`asOfIso` shape, and `earningsProximity`'s `calendar` override is an internal escape
 * hatch the pure-logic specs in `tests/observatory/earnings-chain-badge.spec.ts` already exercise
 * directly — no need to thread it through a second surface just for test isolation). MU's
 * confirmed print is 2026-09-30 (`src/domain/earnings-calendar.ts`); `entryFlatDays` is 2, so a
 * `now` one day out lands in the flat zone.
 */

describe("EarningsBadge", () => {
  it("renders nothing when no symbol is committed", () => {
    const { container } = render(<EarningsBadge symbol={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a symbol with no print anywhere near `now`", () => {
    // NVDA's only table entry is 2026-08-26 — this `now` is neither pre- nor post-print inside
    // any of the PRINT_WINDOWS horizons.
    const { container } = render(
      <EarningsBadge symbol="NVDA" now={new Date("2026-07-01T14:00:00Z")} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the flat-zone badge with the ⚡, the headline and the tone class", () => {
    render(<EarningsBadge symbol="MU" now={new Date("2026-09-29T14:00:00Z")} />);

    expect(screen.getByText("⚡")).toBeInTheDocument();
    expect(screen.getByText("Earnings tomorrow")).toBeInTheDocument();
    const badge = screen.getByTitle(/investors\.micron\.com/);
    expect(badge).toHaveClass("ec-badge", "ec-badge-flat-zone");
  });

  it("hedges an estimate-status print's headline with 'expected'", () => {
    // AVGO's table entry (2026-09-02) is status "estimate" — two days out from 2026-08-31 is
    // still inside the flat zone (entryFlatDays: 2); the honesty rule under test is the headline
    // wording, not the nearness.
    render(<EarningsBadge symbol="AVGO" now={new Date("2026-08-31T14:00:00Z")} />);

    expect(screen.getByText(/Earnings expected/)).toBeInTheDocument();
  });
});
