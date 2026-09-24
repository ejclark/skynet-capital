import type { DeskActivityEvent } from "../../src/live/desk";
import { readForm, streakLabel } from "../../src/shell/form-data";

let n = 0;
function fill(over: Partial<DeskActivityEvent>): DeskActivityEvent {
  n += 1;
  return {
    orderId: `o${n}`,
    symbol: "NVDA",
    display: "NVDA",
    side: "sell",
    quantity: 1,
    filled: 1,
    price: "$1.00",
    status: "filled",
    at: `2026-09-${String(10 + n).padStart(2, "0")}T15:00:00Z`,
    backfilled: false,
    origin: "desk",
    ...over,
  };
}
const win = (pl = "+$100") => fill({ realizedPl: pl, realizedTone: "pos" });
const loss = (pl = "-$50") => fill({ realizedPl: pl, realizedTone: "neg" });
const open = () => fill({ side: "buy" });

// The Form strip's reading of the activity feed (#3689 slice 3b). The feed arrives newest-first.
describe("readForm", () => {
  it("skips opening fills and counts the current win run from the newest close", () => {
    const form = readForm([win(), open(), win(), loss(), win(), win(), win()]);
    expect(form.streak).toBe(2);
    expect(form.best).toBe(3);
    expect(form.seen).toBe(6);
  });

  it("lays the squares out oldest → newest, capped to the most recent", () => {
    const newest = win("+$9");
    const form = readForm([newest, loss(), win(), loss()], 3);
    expect(form.closes.map((c) => c.result)).toEqual(["win", "loss", "win"]);
    expect(form.closes[2]?.pl).toBe("+$9");
    expect(form.seen).toBe(4);
  });

  it("lets an even close break a streak without calling it a loss", () => {
    const form = readForm([win(), fill({ realizedPl: "+$0", realizedTone: "flat" }), win()]);
    expect(form.streak).toBe(1);
    expect(form.closes.map((c) => c.result)).toEqual(["win", "flat", "win"]);
  });

  it("reads an empty record as no closes, not a losing one", () => {
    expect(readForm([open(), open()])).toEqual({ closes: [], streak: 0, best: 0, seen: 0 });
  });
});

describe("streakLabel", () => {
  it("counts wins in plain English, and says nothing with no run going", () => {
    expect(streakLabel(4)).toBe("4 wins in a row");
    expect(streakLabel(1)).toBe("1 win in a row");
    expect(streakLabel(0)).toBe("");
  });
});
