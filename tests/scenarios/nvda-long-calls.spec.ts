import { decisionsFor } from "../../src/observatory/decisions-view.js";
import { positionGuidance } from "../../src/options/position-guidance.js";
import { EXIT_DTE } from "../../src/playbooks/long-call.js";
import { inputs } from "../options/position-guidance-fixture.js";
import { held } from "./scenario-world.js";

/**
 * SCENARIO 2 — NVDA long calls with no exit plan (Eric, 2026-10-18; docs/members/scenarios.md).
 * "I have a bunch of long calls on NVDA that I entered with no plan to take profit and cycle out.
 * NVDA recently had run up followed by significant pullback. This is the second time this happened
 * which has effectively resulted in me bleeding out theta for no profit… Doing this effectively
 * would've set me up to have a lot of capital… to buy CRWV cash secured PUTs at an extreme low."
 *
 * `it.fails` is a known gap — it turns red the day the gap closes (docs/members/README.md ratchet).
 */

describe("scenario 2 — NVDA long calls, run-up then pullback, no exit plan", () => {
  it("s1 — WHEN a long call is up past the lock-in bar on the run-up, the app shall raise a lock-in decision with its expiry and next print as clocks", () => {
    // 4 NVDA Dec 18 $200 calls, paid $15.00, now $24.00 (+60%)
    const [d] = decisionsFor("eric", [held("NVDA261218C00200000", 4, 1500, 4 * 2400)], []);
    expect(d?.kind).toBe("lock-in");
    expect(d?.title).toMatch(/^Up 60%/);
    expect(d?.clocks[0]).toMatch(/^Expires in \d+ days$/);
    expect(d?.clocks.some((c) => c.startsWith("Earnings"))).toBe(true);
    expect(d?.primary.href).toContain("manage=NVDA261218C00200000");
  });

  it("s2 — WHEN a long call expires after its own earnings print, the at-risk card shall warn that the print can shrink it even if the stock rises", () => {
    // 4 NVDA Nov 20 $210 calls, paid $15.00, now $10.00 (−33%), NVDA's print lands before expiry
    const [d] = decisionsFor("eric", [held("NVDA261120C00210000", 4, 1500, 4 * 1000)], []);
    expect(d?.kind).toBe("at-risk");
    expect(d?.learn?.term).toBe("ivCrush");
    expect(d?.why).toMatch(/decide before the print/);
  });

  it("s3 — WHEN the member's cash is tied up and they ask for a put to sell, the app shall say the cash is why nothing passes", () => {
    // The cost of not cycling out: $5,000 free, CRWV puts at $60+ need $6,000 each.
    const g = positionGuidance(inputs({ stake: { cash: 5_000, happyToOwnAt: 70 } }));
    const why = g.calls[2].reasons.map((r) => r.text).join(" ");
    expect(g.calls[2].call).toBe("WAIT");
    expect(why).toMatch(/not covered by your cash/);
  });

  // KNOWN GAP — #5709 slice 2. `stake.longOption` is "forward guidance only" (src/options/position-guidance-types.ts):
  // a held long call shapes the page but gets no verdict of its own. `manage` covers sold calls only.
  // The fix may give long options their own list; rename the read here when it does.
  it.fails("s4 — WHEN the member holds a long call, position guidance shall carry a call on that contract — take, trim, roll or hold — with the day it is next due", () => {
    const g = positionGuidance(
      inputs({
        stake: {
          cash: 5_000,
          longOption: {
            type: "call",
            strike: 90,
            expiration: "2026-11-20",
            contracts: 5,
            costPerContract: 12,
            bid: 6,
            ask: 6.4,
          },
        },
      }),
    );
    const own = g.manage.find((m) => m.strike === 90 && m.expiration === "2026-11-20");
    expect(own).toBeDefined();
    expect(own?.call).not.toBe("NO ANSWER");
    expect(own?.until?.date).toBeDefined();
  });

  // Closed by #5709 slice 1: the house's bot sells a long call at EXIT_DTE days left "before time
  // decay speeds up", and a member holding the same call now hears that rule on a TIME STOP card.
  it(`s5 — WHEN a member's long call reaches ${EXIT_DTE} days left, the app shall raise a decision naming the time stop, whatever its return`, () => {
    // 4 NVDA Nov 27 $190 calls (40 days left), paid $12.00, now $11.40 (−5%)
    const [d] = decisionsFor("eric", [held("NVDA261127C00190000", 4, 1200, 4 * 1140)], []);
    expect(d).toBeDefined();
    expect(`${d?.title} ${d?.why}`).toMatch(/time|days left/i);
  });
});
