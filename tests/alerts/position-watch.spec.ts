import { alertFingerprint } from "../../src/alerts/alert.js";
import {
  ASSIGNMENT_WINDOW_DAYS,
  POSITION_WATCH_SOURCE,
  positionAlerts,
} from "../../src/alerts/position-watch.js";
import type { OptionPositionRow } from "../../src/server/option-positions-view.js";

/**
 * Position watch (#3407 P4 slice 1): the alerts a member's own option positions imply, pure over
 * the positions view — expiry rungs a month / a week / today out, assignment risk on a short in
 * the money inside a week, a long out of the money that expires worthless; nothing without a spot,
 * nothing for a contract no longer held, and a dedupe key that survives the clock.
 */

const row = (over: Partial<OptionPositionRow> = {}): OptionPositionRow => ({
  symbol: "MSFT260918P00420000",
  display: "MSFT $420 put · Sep 18",
  underlying: "MSFT",
  type: "put",
  strike: 420,
  expiration: "2026-09-18",
  daysToExpiry: 17.25,
  contracts: 2,
  inTheMoney: true,
  spot: 410.2,
  ...over,
});

const AT = 1_758_000_000_000;

describe("positionAlerts — expiry reminders", () => {
  it.each([
    [17.25, "month", "info", "expires in 18 days"],
    [6.5, "week", "warning", "expires in 7 days"],
    [0.3, "today", "critical", "expires today"],
  ])("%s days → the %s rung, %s", (days, rung, priority, words) => {
    const alerts = positionAlerts([row({ daysToExpiry: days, inTheMoney: undefined })], AT);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      source: POSITION_WATCH_SOURCE,
      priority,
      symbol: "MSFT",
      dedupeKey: `expiry:MSFT260918P00420000:${rung}`,
    });
    expect(alerts[0]?.title).toBe(`MSFT $420 put · Sep 18 ${words}`);
  });

  it("says nothing beyond a month out, and nothing for a contract no longer held", () => {
    expect(positionAlerts([row({ daysToExpiry: 45 })], AT)).toEqual([]);
    expect(positionAlerts([row({ contracts: 0, daysToExpiry: 2 })], AT)).toEqual([]);
  });

  it("keeps the fingerprint stable across reads while the id carries the clock", () => {
    const [a] = positionAlerts([row()], AT);
    const [b] = positionAlerts([row()], AT + 60_000);
    if (!(a && b)) throw new Error("expected alerts");
    expect(a.id).not.toBe(b.id);
    expect(alertFingerprint(a)).toBe(alertFingerprint(b));
  });
});

describe("positionAlerts — moneyness inside the assignment window", () => {
  it("flags a short in the money as assignment risk, critical", () => {
    const alerts = positionAlerts(
      [row({ contracts: -1, inTheMoney: true, daysToExpiry: ASSIGNMENT_WINDOW_DAYS - 1 })],
      AT,
    );
    const risk = alerts.find((a) => a.dedupeKey?.startsWith("assignment:"));
    expect(risk).toMatchObject({ priority: "critical", symbol: "MSFT" });
    expect(risk?.title).toContain("assignment risk");
    expect(risk?.data).toMatchObject({ contracts: -1, inTheMoney: true, spot: 410.2 });
  });

  it("warns that a long out of the money expires worthless at this price", () => {
    const alerts = positionAlerts([row({ contracts: 2, inTheMoney: false, daysToExpiry: 3 })], AT);
    const worthless = alerts.find((a) => a.dedupeKey?.startsWith("worthless:"));
    expect(worthless).toMatchObject({ priority: "warning" });
    expect(worthless?.title).toContain("expires worthless at this price");
  });

  it("says nothing about moneyness without a spot, outside the window, or when nothing is at stake", () => {
    const noSpot = positionAlerts(
      [row({ inTheMoney: undefined, spot: undefined, daysToExpiry: 2 })],
      AT,
    );
    expect(noSpot.map((a) => a.dedupeKey)).toEqual(["expiry:MSFT260918P00420000:week"]);
    const farOut = positionAlerts([row({ contracts: -1, inTheMoney: true, daysToExpiry: 12 })], AT);
    expect(farOut.map((a) => a.dedupeKey)).toEqual(["expiry:MSFT260918P00420000:month"]);
    // A long in the money and a short out of the money inside the window are fine as they stand.
    expect(
      positionAlerts([row({ contracts: 2, inTheMoney: true, daysToExpiry: 2 })], AT).map(
        (a) => a.dedupeKey,
      ),
    ).toEqual(["expiry:MSFT260918P00420000:week"]);
    expect(
      positionAlerts([row({ contracts: -2, inTheMoney: false, daysToExpiry: 2 })], AT).map(
        (a) => a.dedupeKey,
      ),
    ).toEqual(["expiry:MSFT260918P00420000:week"]);
  });
});
