import { etWall } from "../../src/domain/et-wall.js";

/** An instant on the exchange's wall clock — the pair every intraday rule is written in (#5489). */
describe("etWall", () => {
  it("reads 9:30 ET as 570 minutes in summer (EDT, UTC-4)", () => {
    expect(etWall(Date.parse("2026-10-02T13:30:00Z"))).toEqual({
      date: "2026-10-02",
      minutes: 570,
    });
  });

  it("reads 9:30 ET as 570 minutes in winter (EST, UTC-5)", () => {
    expect(etWall(Date.parse("2026-12-02T14:30:00Z"))).toEqual({
      date: "2026-12-02",
      minutes: 570,
    });
  });

  it("follows the clock change, not a fixed offset", () => {
    // The Friday before and the Monday after the fall-back, both 9:30 ET.
    expect(etWall(Date.parse("2026-10-30T13:30:00Z"))?.minutes).toBe(570);
    expect(etWall(Date.parse("2026-11-02T14:30:00Z"))?.minutes).toBe(570);
  });

  it("puts a late-evening UTC instant on the ET date it belongs to", () => {
    expect(etWall(Date.parse("2026-10-03T02:00:00Z"))).toEqual({
      date: "2026-10-02",
      minutes: 22 * 60,
    });
  });

  it("reads midnight as minute 0, not 24 hours", () => {
    expect(etWall(Date.parse("2026-10-02T04:00:00Z"))).toEqual({ date: "2026-10-02", minutes: 0 });
  });

  it("answers nothing for an instant that is not a time", () => {
    expect(etWall(Number.NaN)).toBeUndefined();
    expect(etWall(Date.parse("not a date"))).toBeUndefined();
  });
});
