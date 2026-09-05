import type { MarketContext } from "../../src/domain/types.js";
import {
  announceScout,
  sessionDayOf,
  stageOnce,
} from "../../src/scripts/autonomous-scout-staging.js";
import { aContext } from "../support/builders.js";

// Eric, 2026-09-04: the staged trade executes "on tuesday, not monday; a red flag that the days
// the market are closed are not on your radar". The session is whatever Alpaca's next_open says.
describe("after-close scout staging", () => {
  const ctx = (): MarketContext => aContext({ NVDA: { last: 100, momentum: 0.03 } });

  it("sessionDayOf reads the calendar date Alpaca's next_open names (Labor Day → Tuesday)", () => {
    expect(sessionDayOf("2026-09-08T09:30:00-04:00")).toBe("2026-09-08");
    expect(sessionDayOf(undefined)).toBeUndefined();
    expect(sessionDayOf("soon")).toBeUndefined();
  });

  it("stages for next_open's session while the market is closed, and says so honestly", async () => {
    const calls: string[] = [];
    const logged: string[] = [];
    const staged = await stageOnce({
      clock: { isOpen: () => false, nextOpen: () => "2026-09-08T09:30:00-04:00" },
      runner: {
        stageScout: (_c, day) => {
          calls.push(day);
          return Promise.resolve(2);
        },
      },
      context: ctx,
      log: (line) => logged.push(line),
    });
    expect(staged).toBe(2);
    expect(calls).toEqual(["2026-09-08"]);
    expect(logged[0]).toContain("staged 2 pick(s) for the 2026-09-08 (Tue) session");
    expect(logged[0]).toContain("fill at the open (2026-09-08T09:30:00-04:00)");
  });

  it("does nothing while the market is open, or before the clock has a next_open", async () => {
    let calls = 0;
    const runner = {
      stageScout: () => {
        calls++;
        return Promise.resolve(1);
      },
    };
    await stageOnce({
      clock: { isOpen: () => true, nextOpen: () => "2026-09-08T09:30:00-04:00" },
      runner,
      context: ctx,
    });
    await stageOnce({
      clock: { isOpen: () => false, nextOpen: () => undefined },
      runner,
      context: ctx,
    });
    expect(calls).toBe(0);
  });

  it("logs nothing on an empty scan and never throws out of the poll", async () => {
    const logged: string[] = [];
    const warned: string[] = [];
    const quiet = await stageOnce({
      clock: { isOpen: () => false, nextOpen: () => "2026-09-08T09:30:00-04:00" },
      runner: { stageScout: () => Promise.resolve(0) },
      context: ctx,
      log: (line) => logged.push(line),
    });
    const failed = await stageOnce({
      clock: { isOpen: () => false, nextOpen: () => "2026-09-08T09:30:00-04:00" },
      runner: { stageScout: () => Promise.reject(new Error("broker down")) },
      context: ctx,
      warn: (line) => warned.push(line),
    });
    expect([quiet, failed]).toEqual([0, 0]);
    expect(logged).toEqual([]);
    expect(warned).toEqual(["[beta-scout] staging failed:"]);
  });

  it("announces the staging mode at boot, and warns when there is no account to run on", () => {
    const lines: string[] = [];
    const sink = {
      log: (l: string) => lines.push(`log ${l}`),
      warn: (l: string) => lines.push(`warn ${l}`),
    };
    announceScout({ maxPicks: 0, stageAfterClose: false }, "Sauron", sink);
    announceScout({ maxPicks: 2, stageAfterClose: false }, undefined, sink);
    announceScout({ maxPicks: 2, stageAfterClose: true }, "Sauron", sink);
    expect(lines).toEqual([
      "warn [beta-scout] SKYNET_BETA_FORCING set but no bot account available — staying dark.",
      "log [beta-scout] armed: up to 2 forced pick(s)/day when nothing organic fires, on Sauron's account; after the close, picks stage for Alpaca's next open.",
    ]);
  });
});
