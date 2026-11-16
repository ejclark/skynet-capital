import type { MpMessage } from "../../src/live/moneypenny";
import { cardIndex, revealCard } from "../../src/shell/mp-card";

// #7614: a parked card's buttons sit on the card, and the pane scrolls to a card it cannot see.
describe("revealCard — bringing a parked card into the pane", () => {
  const view = { scrollTop: 200, height: 160 };

  it("leaves the list alone while any of the card shows", () => {
    expect(revealCard({ top: 300, height: 120 }, view)).toBeUndefined();
    expect(revealCard({ top: 150, height: 60 }, view)).toBeUndefined();
  });

  it("a card above the view: its top goes to the pane's top", () => {
    expect(revealCard({ top: 40, height: 100 }, view)).toBe(32);
  });

  it("a card below the view: its bottom goes to the pane's bottom", () => {
    // bottom 600 + 8 of breath − 160 of pane
    expect(revealCard({ top: 500, height: 100 }, view)).toBe(448);
  });

  it("a card taller than the pane leads with its top; the sticky buttons still show", () => {
    expect(revealCard({ top: 500, height: 400 }, view)).toBe(492);
  });

  it("never scrolls above the list's start", () => {
    expect(revealCard({ top: 4, height: 20 }, { scrollTop: 100, height: 50 })).toBe(0);
  });
});

describe("cardIndex — the card a parked answer acts on", () => {
  const line = (role: MpMessage["role"]): MpMessage => ({ role, text: role });

  it("is the newest card, even with a note after it", () => {
    expect(cardIndex([line("draft"), line("user"), line("draft"), line("sys")])).toBe(2);
  });

  it("is -1 with no card", () => {
    expect(cardIndex([line("user"), line("mp")])).toBe(-1);
  });
});
