import { describe, expect, it } from "@rstest/core";
import { buildBook } from "../../scripts/study/worlds/book.mjs";
import { INSTANT } from "../../scripts/study/worlds/instant.mjs";
import { serverConfig } from "../../scripts/study/worlds/server-config.mjs";
import { STALE_AFTER_MS } from "../../src/observatory/bot-heartbeat-view.js";
import { checkWeekView } from "../../src/observatory/check-week-view.js";

/**
 * A study world never shows a state production can't (#5208), and a running bot checks every ~15s
 * (#5223). The world holds only its notable passes, so it declares the cadence and the week strip
 * fills the checks between them: a running bot reads "none missed", a stopped one still shows the
 * gap after its last pass, and no check is ever newer than the pass the heartbeat reads.
 */
const NOW = new Date(INSTANT);

function week(world: string) {
  const book = buildBook(world);
  const rows = serverConfig(book).readCheckWeek("sauron");
  if (!rows) throw new Error("no week");
  const newest = Math.max(...(book.decisions.sauron ?? []).map((d) => d.at));
  return { rows, newest, view: checkWeekView(rows, NOW, STALE_AFTER_MS) };
}

describe("a study world's declared check cadence (#5223)", () => {
  it("draws the running bot's week with no gap its input does not declare", () => {
    const { rows, newest, view } = week("profile-today");
    expect(view.gaps).toEqual([]);
    expect(rows.checks.length).toBeGreaterThan(1_000);
    expect(Math.max(...rows.checks)).toBeLessThanOrEqual(newest);
  });

  it("still shows a stopped bot's silence after its last pass", () => {
    const { view } = week("profile-bad-day");
    expect(view.gaps.length).toBeGreaterThan(0);
  });
});
