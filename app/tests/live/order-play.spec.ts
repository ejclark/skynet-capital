import type { DeskActivityEvent } from "../../src/live/desk";
import { daysLeft, type OptionPlay, orderPlay, playTitle } from "../../src/live/order-play";

/** #5101 (the deep dive, R2-deep): an order's play at expiry is arithmetic on the contract — the
 *  strike, the premium a share, the count — drawn as zones and branches instead of paragraphs. */

const NOW = new Date("2026-10-08T19:00:00Z");

const order = (over: Partial<DeskActivityEvent> = {}): DeskActivityEvent => ({
  orderId: "o1",
  symbol: "CRWV261106P00080000",
  display: "CRWV $80 PUT · 6 NOV 26",
  side: "sell",
  quantity: 1,
  filled: 1,
  price: "$2.55",
  status: "filled",
  at: "2026-10-06T14:31:00Z",
  backfilled: false,
  origin: "unknown",
  ...over,
});

const option = (event: DeskActivityEvent): OptionPlay => {
  const play = orderPlay(event, NOW);
  if (play?.kind !== "option") throw new Error("expected an option play");
  return play;
};

describe("a sold put — the wheel's sale", () => {
  const put = option(order());

  it("breaks even at the strike less the premium, and holds the strike's cash aside", () => {
    expect(put.breakeven).toBe(77.45);
    expect(put.setAside).toBe(8000);
    expect(put.wrongIf).toEqual({ at: 80, words: "it ends below $80" });
  });

  it("loses below breakeven, is still ahead down to it, keeps the premium above the strike", () => {
    expect(put.zones).toEqual([
      { kind: "loses", to: 77.45, words: "loses below $77.45" },
      { kind: "ahead", from: 77.45, to: 80, words: "buys 100 at $80, still ahead" },
      { kind: "keeps", from: 80, words: "keeps $255 above $80" },
    ]);
  });

  it("branches at the strike: expires and keeps above, buys the shares below — wrong if below", () => {
    expect(put.branches).toEqual([
      { when: "above $80", kind: "keeps", wrong: false, outcome: "the put expires · keeps +$255" },
      {
        when: "below $80",
        kind: "ahead",
        wrong: true,
        outcome: "buys 100 CRWV at $80 (net $77.45 a share)",
      },
    ]);
  });

  it("titles the bet as a sentence with its expiry", () => {
    expect(playTitle(put, "Stays above $80")).toBe("CRWV stays above $80 until Nov 6");
  });
});

describe("the other single-leg options", () => {
  it("reads a sold call as kept below the strike and called away above it", () => {
    const call = option(order({ symbol: "CRWV261106C00095000", price: "$1.20" }));
    expect(call.breakeven).toBe(96.2);
    expect(call.setAside).toBeUndefined();
    expect(call.wrongIf?.words).toBe("it ends above $95");
    expect(call.branches[1]?.outcome).toBe("sells 100 CRWV at $95 (net $96.20 a share)");
  });

  it("reads a bought call as losing all it paid below the strike, gaining above breakeven", () => {
    const call = option(order({ symbol: "NVDA261113C00200000", side: "buy", price: "$3.40" }));
    expect(call.breakeven).toBe(203.4);
    expect(call.zones.map((z) => z.words)).toEqual([
      "loses all $340 below $200",
      "worth less than it paid",
      "gains above $203.40",
    ]);
    expect(call.branches.at(-1)).toEqual({
      when: "below $200",
      kind: "loses",
      wrong: true,
      outcome: "expires worthless · −$340",
    });
    expect(playTitle(call, "Rises above $200")).toBe("NVDA rises above $200 by Nov 13");
  });

  it("reads a bought put as gaining below breakeven and losing all above the strike", () => {
    const put = option(order({ side: "buy" }));
    expect(put.zones[0]).toEqual({ kind: "keeps", to: 77.45, words: "gains below $77.45" });
    expect(put.wrongIf?.words).toBe("it ends above $80");
  });
});

describe("shares, and the orders with no play to draw", () => {
  it("draws a bought share's line as above or below what it paid, no stop claimed", () => {
    const play = orderPlay(
      order({ symbol: "NVDA", display: "NVDA", side: "buy", price: "$226.10" }),
    );
    expect(play).toEqual({
      kind: "shares",
      symbol: "NVDA",
      fill: 226.1,
      zones: [
        { kind: "loses", to: 226.1, words: "below the $226.10 it paid" },
        { kind: "keeps", from: 226.1, words: "above the $226.10 it paid" },
      ],
    });
  });

  it("draws nothing for a close (its result is booked), a report, or an unfilled order", () => {
    expect(orderPlay(order({ realizedPl: "+$120" }))).toBeUndefined();
    expect(orderPlay(order({ lifecycle: "OPEXP", price: "$0.00" }))).toBeUndefined();
    expect(orderPlay(order({ filled: 0, price: "—", status: "canceled" }))).toBeUndefined();
    expect(orderPlay(order({ symbol: "", net: "$335.00 paid" }))).toBeUndefined();
  });
});

describe("days left", () => {
  it("counts calendar days from the fill's New York day to expiry, today's place between", () => {
    expect(daysLeft("2026-10-06T14:31:00Z", "2026-11-06", NOW)).toEqual({
      span: 31,
      gone: 2,
      words: "29 days left",
    });
  });

  it("says when it expires today, and when it has expired", () => {
    expect(daysLeft("2026-10-06T14:31:00Z", "2026-10-08", NOW).words).toBe("expires today");
    expect(daysLeft("2026-10-01T14:31:00Z", "2026-10-02", NOW)).toMatchObject({
      gone: 1,
      words: "expired",
    });
  });
});
