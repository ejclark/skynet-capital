import type { MarketContext } from "../../src/domain/types.js";
import {
  announceRoster,
  announceScout,
  sessionDayOf,
  stageOnce,
  watchScoutPicks,
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
      "log [beta-scout] armed: up to 2 forced pick(s)/day when nothing organic fires, on Sauron's account while it is subscribed to BETA-SCOUT; after the close, picks stage for Alpaca's next open.",
    ]);
  });

  it("announces the playbook roster: refused tokens loudly, the armed set once", () => {
    const lines: string[] = [];
    const sink = {
      log: (l: string) => lines.push(`log ${l}`),
      error: (l: string) => lines.push(`error ${l}`),
    };
    announceRoster({ enabled: [], rejected: [] }, sink);
    announceRoster(
      {
        enabled: [{ playbook: { id: "S1-NVDA" }, mode: "standard" }],
        rejected: ["BOGUS", "S1-NVDA:aggressive (repeated)"],
      },
      sink,
    );
    expect(lines).toEqual([
      'error [playbooks] REFUSED token "BOGUS" in SKYNET_PLAYBOOKS — unknown, malformed or repeated',
      'error [playbooks] REFUSED token "S1-NVDA:aggressive (repeated)" in SKYNET_PLAYBOOKS — unknown, malformed or repeated',
      "log [playbooks] armed: S1-NVDA:standard",
    ]);
  });
});

// The scout reads its count at every scan; the poll-time watch only refreshes what the count also
// shows (the host's roster, with the scout on it while armed) and says so (#4535 slice 2b).
describe("watching the owner's forced-pick count", () => {
  it("applies and logs once per change, and stays quiet while the count holds still", () => {
    let picks = 0;
    const applied: number[] = [];
    const logged: string[] = [];
    const poll = watchScoutPicks(
      () => picks,
      () => applied.push(picks),
      (line) => logged.push(line),
    );
    poll();
    expect(applied).toEqual([]);
    picks = 3;
    poll();
    poll();
    expect(applied).toEqual([3]);
    expect(logged).toEqual([
      "[beta-scout] forced picks per day 0 → 3 (the owner's setting; applied with no restart)",
    ]);
    picks = 0;
    poll();
    expect(applied).toEqual([3, 0]);
  });

  it("tries again next poll when applying a change failed", () => {
    let picks = 0;
    let fail = true;
    const logged: string[] = [];
    const poll = watchScoutPicks(
      () => picks,
      () => {
        if (fail) throw new Error("swap failed");
      },
      (line) => logged.push(line),
    );
    picks = 2;
    expect(poll).toThrow("swap failed");
    expect(logged).toEqual([]);
    fail = false;
    poll();
    expect(logged).toHaveLength(1);
  });
});
