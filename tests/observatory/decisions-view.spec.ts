import type { ConsiderationChip } from "../../src/observatory/considerations-view.js";
import { decisionsFor } from "../../src/observatory/decisions-view.js";
import { plainPosition } from "../../src/observatory/position-plain.js";

// Needs a decision (#3689 slice 7). Premiums are per contract (x100), as the broker adapter scales them.
const now = new Date("2026-09-23T19:00:00Z");
const held = (symbol: string, quantity: number, avgPrice: number, marketValue: number) => {
  const p = { symbol, quantity, avgPrice, marketValue };
  return { ...p, plain: plainPosition(p, now) };
};

const idea: ConsiderationChip = {
  id: "opportunity-earnings-run-AAPL",
  kind: "opportunity",
  symbol: "AAPL",
  display: "AAPL",
  notional: "—",
  delta: "D-20 to D-6",
  deltaTone: "flat",
  reason: "Long into the earnings print, out before the number lands.",
  action: { label: "View playbook", href: "/app/research?section=playbooks" },
};

describe("decisionsFor", () => {
  it("flags a put that's down with little time left, in plain words, and only drafts", () => {
    // 8 TSLA Oct 17 $400 puts, paid $14.10, now worth $6.30 (−55.3%).
    const [d] = decisionsFor("eric", [held("TSLA261017P00400000", 8, 1410, 5040)], []);
    expect(d).toMatchObject({
      kind: "at-risk",
      title: "Down 55% from what you paid",
      captionShort: "Needs TSLA below $385.90 by Oct 17 to profit.",
      pl: "-$6,240 · −55.3%",
      plTone: "neg",
      // the next headline macro print before expiry rides along as a clock (#3689 follow-up)
      clocks: ["Expires in 24 days", "Jobs report Oct 2", "8 contracts · worth $5,040"],
      primary: {
        label: "Review on Trade ↗",
        // the held contract, never a new-order preset (#4947)
        href: "/app/trade?desk=eric&symbol=TSLA&section=orders&manage=TSLA261017P00400000",
      },
      range: { type: "put", side: "long", strike: 400, breakeven: 385.9 },
    });
    expect(d?.why.startsWith("✦ ")).toBe(true);
  });

  it("names the last three weeks when time is the problem", () => {
    const [d] = decisionsFor("eric", [held("NVDA261009C00200000", 2, 500, 400)], []);
    expect(d?.title).toBe("Down 60% with 16 days left");
    expect(d?.why).toMatch(/last three weeks/);
    expect(d?.learn?.term).toBe("timeDecay");
  });

  describe("a sold option (#4947): the member was paid, so the copy is a seller's", () => {
    it("states what came in and what buying back costs, never 'from what you paid'", () => {
      // 1 AMD Nov 20 $150 put sold for $263, now $555 to buy back (−111% of the premium).
      const [d] = decisionsFor("eric", [held("AMD261120P00150000", -1, 263, -555)], []);
      expect(d).toMatchObject({
        kind: "at-risk",
        title: "Collected $263; buying back costs $555",
        caption: expect.stringContaining("Buying it back now costs $555, $292 more than that."),
        primary: {
          label: "Review on Trade ↗",
          href: "/app/trade?desk=eric&symbol=AMD&section=orders&manage=AMD261120P00150000",
        },
        range: { type: "put", side: "short", strike: 150 },
      });
      expect(`${d?.title} ${d?.caption} ${d?.why}`).not.toMatch(/what you paid|it cost|from cost/);
    });

    it("never says time works against it in the last three weeks", () => {
      // 2 NVDA Oct 9 $180 calls sold for $300, now $900 to buy back, 16 days left.
      const [d] = decisionsFor("eric", [held("NVDA261009C00180000", -2, 300, -900)], []);
      expect(d?.title).toBe("Collected $600; buying back costs $900");
      expect(d?.why).not.toMatch(/working against|loses value fastest/);
      expect(d?.why).toMatch(/works for a seller/);
      expect(d?.learn?.term).not.toBe("timeDecay");
      expect(d?.primary.href).toBe(
        "/app/trade?desk=eric&symbol=NVDA&section=orders&manage=NVDA261009C00180000",
      );
    });

    it("keeps the seller's numbers when it's a winner worth locking in", () => {
      // 1 AMD Nov 20 $150 put sold for $263, now $100 to buy back (+62% of the premium).
      const [d] = decisionsFor("eric", [held("AMD261120P00150000", -1, 263, -100)], []);
      expect(d).toMatchObject({
        kind: "lock-in",
        title: "Collected $263; buying back costs $100",
        caption: expect.stringContaining("Buying it back now costs $100, which keeps $163 of it."),
        learn: { term: "lockedIn" },
      });
      expect(`${d?.title} ${d?.caption}`).not.toMatch(/has made|Up \d+%/);
    });
  });

  it("suggests locking in a big winner, with a lower bar for shares than options", () => {
    const [share] = decisionsFor("eric", [held("MSFT", 10, 300, 3900)], []);
    expect(share).toMatchObject({
      kind: "lock-in",
      title: "Up 30%: consider locking some of it in",
      learn: { term: "lockedIn" },
    });
    expect(decisionsFor("eric", [held("NVDA261218C00130000", 1, 500, 700)], [])).toEqual([]);
  });

  describe("the day it's due (#3977 slice 4)", () => {
    it("is an option's expiry when its stock has nothing of its own before then", () => {
      // TSLA's jobs-report clock is a macro print: a clock on the card, never its due date
      const [d] = decisionsFor("eric", [held("TSLA261017P00400000", 8, 1410, 5040)], []);
      expect(d?.due).toEqual({ at: "2026-10-17", reason: "expiry", label: "Expires Oct 17" });
    });

    it("is the stock's own print for shares, flagged when the date is an estimate", () => {
      const [d] = decisionsFor("eric", [held("MSFT", 10, 300, 3900)], []);
      expect(d?.due).toEqual({
        at: "2026-10-27",
        reason: "event",
        label: "Earnings Oct 27",
        estimated: true,
      });
    });

    it("is absent when there is no such day — shares with nothing dated, and ideas", () => {
      const ds = decisionsFor("eric", [held("SPY", 10, 700, 5000)], [idea]);
      expect(ds.map((d) => d.kind)).toEqual(["at-risk", "idea"]);
      expect(ds.every((d) => d.due === undefined)).toBe(true);
    });
  });

  it("leaves a position between the lines alone", () => {
    expect(decisionsFor("eric", [held("AAPL", 100, 190, 18_500)], [])).toEqual([]);
  });

  it("orders by money at stake, with playbook ideas after the holdings", () => {
    const ds = decisionsFor(
      "eric",
      [held("MSFT", 10, 300, 3900), held("TSLA261017P00400000", 8, 1410, 5040)],
      [idea],
    );
    expect(ds.map((d) => d.kind)).toEqual(["at-risk", "lock-in", "idea"]);
    expect(ds[2]).toMatchObject({ title: "A playbook fits AAPL, which you already hold" });
  });
});
