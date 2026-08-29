import type { PlaybookEvent } from "../../src/playbooks/playbook.js";
import { TACO_DJT } from "../../src/playbooks/registry.js";

const AT = "2026-08-28T14:00:00Z";
const later = (minutes: number): string =>
  new Date(Date.parse(AT) + minutes * 60_000).toISOString();

const event = (over: Partial<PlaybookEvent> = {}): PlaybookEvent => ({
  symbol: "DJT",
  detectedAt: AT,
  ...over,
});

describe("TACO-DJT.desiredState", () => {
  it("stays no-window with no events at all — never opens on silence", () => {
    expect(TACO_DJT.desiredState(AT, [])).toBe("no-window");
    expect(TACO_DJT.desiredState(AT, [], [])).toBe("no-window");
  });

  it("ignores events for a different symbol entirely", () => {
    expect(TACO_DJT.desiredState(AT, [], [event({ symbol: "AAPL" })])).toBe("no-window");
  });

  it("wants long inside the entry window", () => {
    expect(TACO_DJT.desiredState(later(0), [], [event()])).toBe("long");
    expect(TACO_DJT.desiredState(later(15), [], [event()])).toBe("long"); // entryMinutes boundary
  });

  it("stays long through the hold window, past entry but before the total life ends", () => {
    expect(TACO_DJT.desiredState(later(45), [], [event()])).toBe("long");
    expect(TACO_DJT.desiredState(later(90), [], [event()])).toBe("long"); // holdMinutes boundary
  });

  it("converges to flat once the event has expired — the exit side, no separate sweep", () => {
    expect(TACO_DJT.desiredState(later(91), [], [event()])).toBe("flat");
    expect(TACO_DJT.desiredState(later(500), [], [event()])).toBe("flat");
  });

  it("stays flat (not no-window) once expired, even with no other live event", () => {
    // A stale record must still flatten a position it opened — "no-window" would silently skip
    // the exit, per the honesty invariant: an undetermined state must never read as "hold".
    expect(TACO_DJT.desiredState(later(200), [], [event({ detectedAt: AT })])).toBe("flat");
  });

  it("treats a future-dated event as expired, never granting an entry window that never closes", () => {
    const future = event({ detectedAt: later(60) });
    expect(TACO_DJT.desiredState(AT, [], [future])).toBe("flat");
  });

  it("is long if ANY of several events is still live, even if another has expired", () => {
    const stale = event({ detectedAt: AT });
    const fresh = event({ detectedAt: later(80) });
    expect(TACO_DJT.desiredState(later(85), [], [stale, fresh])).toBe("long");
  });

  it("carries a symbol, size tiers, and an evidence line naming the unvalidated timing", () => {
    expect(TACO_DJT.id).toBe("TACO-DJT");
    expect(TACO_DJT.symbol).toBe("DJT");
    expect(TACO_DJT.size.standard).toBeGreaterThan(0);
    expect(TACO_DJT.size.standard).toBeLessThan(0.02); // deliberately below S1/G1's evidenced sizing
    expect(TACO_DJT.evidence).toContain("unvalidated");
  });
});
