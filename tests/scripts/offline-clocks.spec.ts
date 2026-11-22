import { offlineClock } from "../../src/scripts/offline-clocks.js";

// The server's frozen clocks (#4683, #7901): the e2e boot pins them, a real account never does.
describe("offlineClock", () => {
  const env = {
    SKYNET_FIXED_NOW: "2026-09-18T14:00:00Z",
    SKYNET_EDITION_NOW: "2026-11-09T14:00:00Z",
  };

  it("reads each pinned instant on an offline boot", () => {
    expect(offlineClock(env, "offline", "SKYNET_FIXED_NOW")?.().toISOString()).toBe(
      "2026-09-18T14:00:00.000Z",
    );
    expect(offlineClock(env, "offline", "SKYNET_EDITION_NOW")?.().toISOString()).toBe(
      "2026-11-09T14:00:00.000Z",
    );
  });

  it("never freezes a live boot, whatever its environment says", () => {
    expect(offlineClock(env, "live", "SKYNET_FIXED_NOW")).toBeUndefined();
    expect(offlineClock(env, "live", "SKYNET_EDITION_NOW")).toBeUndefined();
  });

  it("is the wall clock when the instant is absent or unreadable", () => {
    expect(offlineClock({}, "offline", "SKYNET_EDITION_NOW")).toBeUndefined();
    expect(
      offlineClock({ SKYNET_EDITION_NOW: "next tuesday" }, "offline", "SKYNET_EDITION_NOW"),
    ).toBeUndefined();
  });
});
