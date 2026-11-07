import type { AlpacaAccount } from "../../src/alpaca/alpaca-trading-client.js";
import type { ControlsState } from "../../src/autonomous/bot-controls.js";
import { SafetyController } from "../../src/autonomous/safety.js";
import { wireBreakerReset } from "../../src/scripts/autonomous-live-wiring.js";

/**
 * The owner's "reset breaker" as the bots process wires it (#6954 slice 3b): it re-arms the breakers
 * against the broker's day-open equity, so the loss that tripped one is never forgiven; it refuses
 * when that number cannot be read; it leaves the kill switch (not the safety controller's) alone.
 */

const BOOT = new Date("2026-11-09T14:00:00.000Z");
const PRESS: ControlsState = { bots: {}, breakerResetAt: "2026-11-09T15:00:00.000Z" };
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const account = (lastEquity: string | undefined) =>
  new Map<string, AlpacaAccount | undefined>([
    ["sauron", (lastEquity === undefined ? {} : { last_equity: lastEquity }) as AlpacaAccount],
  ]);

describe("wireBreakerReset", () => {
  it("re-arms a tripped breaker, and a loss that still stands trips it again at once", async () => {
    const safety = new SafetyController({ actor: "bot" });
    safety.seedBaseline(10_000);
    safety.recordEquity(9_400); // 6% down: daily-loss trips
    expect(safety.blockedReason()).toBe("daily-loss");

    const logs: string[] = [];
    const listener = wireBreakerReset([], safety, {
      bootedAt: BOOT,
      log: (line) => logs.push(line),
      read: () => Promise.resolve(account("10000")),
    });
    listener(PRESS);
    await settle();
    expect(safety.blockedReason()).toBeNull(); // re-armed...
    safety.recordEquity(9_400);
    expect(safety.blockedReason()).toBe("daily-loss"); // ...but the day-open baseline still counts
    expect(logs.some((l) => l.includes("re-armed by the owner"))).toBe(true);
  });

  it("re-arms for good when the account has recovered", async () => {
    const safety = new SafetyController({ actor: "bot" });
    safety.halt("errors");
    const listener = wireBreakerReset([], safety, {
      bootedAt: BOOT,
      log: () => undefined,
      read: () => Promise.resolve(account("10000")),
    });
    listener(PRESS);
    await settle();
    safety.recordEquity(9_900);
    expect(safety.blockedReason()).toBeNull();
  });

  it("refuses to re-arm when the day-open equity cannot be read, and tries again next poll", async () => {
    const safety = new SafetyController({ actor: "bot" });
    safety.halt("errors");
    const logs: string[] = [];
    let readable = false;
    const listener = wireBreakerReset([], safety, {
      bootedAt: BOOT,
      log: (line) => logs.push(line),
      read: () => Promise.resolve(account(readable ? "10000" : undefined)),
    });
    listener(PRESS);
    await settle();
    expect(safety.blockedReason()).toBe("errors"); // still held: no seed, no forgiveness
    expect(logs[0]).toContain("will retry next poll");
    readable = true;
    listener(PRESS);
    await settle();
    expect(safety.blockedReason()).toBeNull();
  });

  it("ignores a stamp from before this boot — the restart already cleared it", async () => {
    const safety = new SafetyController({ actor: "bot" });
    safety.halt("order-rate");
    const listener = wireBreakerReset([], safety, {
      bootedAt: BOOT,
      read: () => Promise.resolve(account("10000")),
    });
    listener({ bots: {}, breakerResetAt: "2026-11-09T13:00:00.000Z" });
    await settle();
    expect(safety.blockedReason()).toBe("order-rate");
  });
});
