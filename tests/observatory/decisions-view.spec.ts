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
        href: "/app/trade?desk=eric&symbol=TSLA&strike=400&exp=2026-10-17",
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

  it("suggests locking in a big winner, with a lower bar for shares than options", () => {
    const [share] = decisionsFor("eric", [held("MSFT", 10, 300, 3900)], []);
    expect(share).toMatchObject({
      kind: "lock-in",
      title: "Up 30%: consider locking some of it in",
      learn: { term: "lockedIn" },
    });
    expect(decisionsFor("eric", [held("NVDA261218C00130000", 1, 500, 700)], [])).toEqual([]);
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
