import {
  cryptoExposure,
  cryptoHoldings,
  renderNightShift,
} from "../../src/observatory/night-shift.js";
import type {
  ParticipantSnapshot,
  PositionView,
} from "../../src/observatory/participant-snapshot.js";

const pos = (symbol: string, overrides: Partial<PositionView> = {}): PositionView => ({
  symbol,
  quantity: overrides.quantity ?? 10,
  avgPrice: overrides.avgPrice ?? 100,
  marketValue: overrides.marketValue ?? 1_000,
});

const snap = (overrides: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "neo",
  displayName: "Neo",
  kind: "human",
  cash: 10_000,
  equity: 20_000,
  positions: [],
  ...overrides,
});

const SATURDAY = new Date("2026-08-22T18:00:00Z"); // Sat 14:00 ET — the desk is dark
const WEDNESDAY = new Date("2026-08-26T14:00:00Z"); // Wed 10:00 ET — the desk is open

describe("the night shift panel", () => {
  it("picks the crypto out of a mixed book and leaves the rest alone", () => {
    const book = snap({
      positions: [
        pos("NVDA"),
        pos("BTCUSD", { quantity: 0.25, marketValue: 16_000 }),
        pos("MSFT260918P00420000"),
        pos("ETH/USD", { quantity: 2, marketValue: 6_000 }),
      ],
    });
    expect(cryptoHoldings(book).map((p) => p.symbol)).toEqual(["BTCUSD", "ETH/USD"]);
    expect(cryptoExposure(book)).toBe(22_000);
  });

  it("reads its headline numbers off the board instead of hardcoding them in copy", () => {
    expect(renderNightShift(snap(), { now: SATURDAY })).toContain("168 hours a week against 32.5");
  });

  it("shows both venues, and marks the equity session as scheduled when it is open", () => {
    const open = renderNightShift(snap(), { now: WEDNESDAY });
    expect(open).toContain("US stocks &amp; options");
    expect(open).toContain("ns-sched");
    const shut = renderNightShift(snap(), { now: SATURDAY });
    expect(shut).toContain("CLOSED");
    expect(shut).not.toContain("ns-sched");
  });

  it("renders real holdings with their decimals intact, humanized", () => {
    const html = renderNightShift(
      snap({ positions: [pos("BTCUSD", { quantity: 0.12345678, marketValue: 8_000 })] }),
      { now: SATURDAY, isSelf: true },
    );
    expect(html).toContain("BTC/USD");
    expect(html).toContain("0.12345678");
    expect(html).toContain("$8,000 of your book keeps trading after the bell.");
  });

  it("says nothing is trading when the account holds no crypto — never a demo coin", () => {
    const html = renderNightShift(snap({ positions: [pos("NVDA")] }), { now: SATURDAY });
    expect(html).toContain("No crypto in this book yet");
    expect(html).not.toContain("BTC");
  });

  it("says out loud that the desk cannot send a crypto order", () => {
    const html = renderNightShift(snap(), { now: SATURDAY });
    expect(html).toContain("can't send a crypto order yet");
    expect(html).toContain("Paper only");
  });

  it("escapes a hostile symbol rather than rendering it as markup", () => {
    const html = renderNightShift(
      snap({ positions: [pos("<script>alert(1)</script>"), pos("BTC/USD")] }),
      { now: SATURDAY },
    );
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
