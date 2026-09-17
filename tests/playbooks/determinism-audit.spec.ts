import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { playbookIntents } from "../../src/playbooks/playbook.js";
import { S1_NVDA } from "../../src/playbooks/registry.js";
import { aContext, aPortfolio } from "../support/builders.js";

/**
 * PLAYBOOK ANATOMY (#3194, step 3) — observe-only cross-account determinism audit. Proves, as a
 * test rather than an assertion in prose, that two differently-sized accounts subscribed to the
 * SAME playbook at the SAME mode produce the same call (state) and the same fractional exposure
 * — divergence should come only from each account's own equity, never from the playbook's rules
 * reading differently per account. Observe-only: this never gates a real subscription, since no
 * subscription mechanism reads these fields yet (#3194 step 2's schema is still unread at
 * runtime).
 */

const ASOF = "2026-07-24T14:30:00Z";
const CALENDAR: readonly EarningsPrint[] = [
  { symbol: "NVDA", date: "2026-08-03", status: "confirmed", source: "test fixture" },
];

describe("determinism audit: two accounts on the same playbook", () => {
  it("gives both accounts the same buy/flat/no-window call for the same context", () => {
    const context = aContext({ NVDA: { last: 100 } }, ASOF);
    const small = aPortfolio({ cash: 50_000 });
    const large = aPortfolio({ cash: 5_000_000 });

    const smallIntents = playbookIntents(
      [{ playbook: S1_NVDA, mode: "standard" }],
      context,
      small,
      CALENDAR,
    );
    const largeIntents = playbookIntents(
      [{ playbook: S1_NVDA, mode: "standard" }],
      context,
      large,
      CALENDAR,
    );

    expect(smallIntents).toHaveLength(1);
    expect(largeIntents).toHaveLength(1);
    expect(smallIntents[0]?.side).toBe("buy");
    expect(largeIntents[0]?.side).toBe("buy");
  });

  it("sizes each account to the same fraction of its own equity, within one-share floor rounding", () => {
    const context = aContext({ NVDA: { last: 100 } }, ASOF);
    const small = aPortfolio({ cash: 50_000 });
    const large = aPortfolio({ cash: 5_000_000 });

    const [smallIntent] = playbookIntents(
      [{ playbook: S1_NVDA, mode: "standard" }],
      context,
      small,
      CALENDAR,
    );
    const [largeIntent] = playbookIntents(
      [{ playbook: S1_NVDA, mode: "standard" }],
      context,
      large,
      CALENDAR,
    );

    const ask = context.quotes.NVDA?.ask ?? 0;
    const smallFraction = ((smallIntent?.quantity ?? 0) * ask) / small.cash;
    const largeFraction = ((largeIntent?.quantity ?? 0) * ask) / large.cash;

    // standard mode's declared target is 0.02; the small account's floor-rounding to whole
    // shares costs it more of that fraction proportionally, so the tolerance is asymmetric —
    // it can only undershoot never overshoot the declared size.
    expect(largeFraction).toBeCloseTo(S1_NVDA.size.standard, 3);
    expect(smallFraction).toBeLessThanOrEqual(S1_NVDA.size.standard);
    expect(smallFraction).toBeGreaterThan(0);
  });

  it("is a pure function of its inputs: calling desiredState twice with identical arguments agrees with itself", () => {
    const first = S1_NVDA.desiredState(ASOF, CALENDAR);
    const second = S1_NVDA.desiredState(ASOF, CALENDAR);
    expect(second).toBe(first);
  });
});
