import { spawnSync } from "node:child_process";
import { describe, expect, it } from "@rstest/core";

/**
 * The ladder's worlds (#8005, the ladder: `docs/IA.md` §5.5): the rung a fill earns is the
 * progression service's own reading of the book, never typed — so the first stock sale the edge
 * world adds earns rung 102 on the instant's day, and the figures the sale moves still add up.
 */

describe("the first stock sale, as the ladder reads it", () => {
  it("earns 102 today from the sale's own fill, and the day's change still adds up", () => {
    const script = `
      const { buildBook } = await import("./scripts/study/worlds/book.mjs");
      const { dayChangeGaps } = await import("./scripts/study/worlds/day-change.mjs");
      const { serverConfig, sessionFor } = await import("./scripts/study/worlds/server-config.mjs");
      const { serverRead } = await import("./scripts/study/server-reads.mjs");
      const { createBoardChannel } = await import("./src/server/board-patch-routes.ts");
      const book = buildBook("ladder-first-sale");
      const config = serverConfig(book);
      const learn = (await serverRead("/api/learn", config, createBoardChannel("spec"),
        sessionFor("eric@study.world"))).body;
      const stock = learn.courses.find((c) => c.level === 100).milestones;
      console.log(JSON.stringify({ gaps: dayChangeGaps(book).length, stock }));
    `;
    const run = spawnSync("npx", ["tsx", "--input-type=module", "-e", script], {
      encoding: "utf8",
      env: { ...process.env, STUDY_INSTANT: "2026-11-23T15:00:00-05:00" },
    });
    expect(run.stderr).toBe("");
    const out = JSON.parse(run.stdout.trim().split("\n").at(-1) ?? "{}") as {
      gaps: number;
      stock: { code: string; earned?: { on: string; orderId: string } }[];
    };
    expect(out.gaps).toBe(0);
    expect(out.stock.map((m) => [m.code, m.earned])).toEqual([
      ["101", { on: "2026-11-06", orderId: "eric-aapl-1" }],
      ["102", { on: "2026-11-23", orderId: "eric-aapl-2" }],
    ]);
  }, 60_000);
});
