import type { ControlsState } from "../../src/autonomous/bot-controls.js";
import { breakerResetDue, parseControlsState } from "../../src/autonomous/bot-controls.js";
import { breakerResetListener } from "../../src/autonomous/breaker-reset.js";

/**
 * The owner's "reset breaker", bots side (#6954 slice 3b). The behaviours: a stamp newer than the
 * last honoured re-arms once; a stamp from before this boot is already honoured by the restart; a
 * failed re-arm is tried again on the next poll; nothing here can run twice for one press.
 */

const BOOT = new Date("2026-11-09T14:00:00.000Z");
const stateWith = (breakerResetAt?: string): ControlsState => ({
  bots: {},
  ...(breakerResetAt ? { breakerResetAt } : {}),
});
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function harness(over: { rearm?: (r: number | undefined) => void } = {}) {
  const rearmed: (number | undefined)[] = [];
  const logs: string[] = [];
  const listener = breakerResetListener<number>({
    read: async () => 42,
    rearm: over.rearm ?? ((reading) => void rearmed.push(reading)),
    bootedAt: BOOT,
    log: (line) => logs.push(line),
  });
  return { listener, rearmed, logs };
}

describe("breakerResetListener", () => {
  it("re-arms once on a stamp newer than boot, with the broker read it took first", async () => {
    const { listener, rearmed, logs } = harness();
    listener(stateWith("2026-11-09T15:00:00.000Z"));
    await settle();
    listener(stateWith("2026-11-09T15:00:00.000Z")); // the same press, polled again
    await settle();
    expect(rearmed).toEqual([42]);
    expect(logs[0]).toContain("re-armed by the owner");
  });

  it("does nothing for no stamp, or one at or before this boot — the restart already cleared it", async () => {
    const { listener, rearmed } = harness();
    listener(stateWith());
    listener(stateWith("2026-11-09T13:59:59.000Z"));
    listener(stateWith(BOOT.toISOString()));
    await settle();
    expect(rearmed).toEqual([]);
  });

  it("honours a later press after an earlier one", async () => {
    const { listener, rearmed } = harness();
    listener(stateWith("2026-11-09T15:00:00.000Z"));
    await settle();
    listener(stateWith("2026-11-09T16:00:00.000Z"));
    await settle();
    expect(rearmed).toHaveLength(2);
  });

  it("leaves the stamp un-honoured when the re-arm fails, so the next poll tries again", async () => {
    let attempts = 0;
    const { listener, logs } = harness({
      rearm: () => {
        attempts += 1;
        if (attempts === 1) throw new Error("day-open equity unreadable");
      },
    });
    listener(stateWith("2026-11-09T15:00:00.000Z"));
    await settle();
    expect(logs[0]).toContain("will retry next poll");
    listener(stateWith("2026-11-09T15:00:00.000Z"));
    await settle();
    expect(attempts).toBe(2);
    expect(logs[1]).toContain("re-armed by the owner");
  });

  it("hands rearm undefined when the broker read throws, and never throws into the poll", async () => {
    const seen: (number | undefined)[] = [];
    const listener = breakerResetListener<number>({
      read: () => Promise.reject(new Error("down")),
      rearm: (reading) => void seen.push(reading),
      bootedAt: BOOT,
      log: () => undefined,
    });
    expect(() => listener(stateWith("2026-11-09T15:00:00.000Z"))).not.toThrow();
    await settle();
    expect(seen).toEqual([undefined]);
  });
});

describe("breakerResetAt on the controls state", () => {
  it("parses a real instant and reads junk as unset", () => {
    expect(parseControlsState({ bots: {}, breakerResetAt: "2026-11-09T15:00:00.000Z" })).toEqual({
      bots: {},
      breakerResetAt: "2026-11-09T15:00:00.000Z",
    });
    expect(parseControlsState({ bots: {}, breakerResetAt: "soon" })).toEqual({ bots: {} });
    expect(parseControlsState({ bots: {}, breakerResetAt: 5 })).toEqual({ bots: {} });
  });

  it("orders stamps as instants, not strings", () => {
    // 15:00Z written with an offset sorts later as text than the 14:30Z it actually follows.
    expect(
      breakerResetDue(stateWith("2026-11-09T10:00:00.000-05:00"), "2026-11-09T14:30:00.000Z"),
    ).toBe(true);
    expect(breakerResetDue(stateWith("2026-11-09T14:00:00.000Z"), "2026-11-09T14:30:00.000Z")).toBe(
      false,
    );
    expect(breakerResetDue(stateWith(), "2026-11-09T14:30:00.000Z")).toBe(false);
  });
});
