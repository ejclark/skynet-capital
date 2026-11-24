import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { cardEchoes, memberCard, rolesPacket } from "../../scripts/study/packets.mjs";
import { type AreaConfig, profileProblems } from "../../scripts/study/round-plan.mjs";
import { WORLDS } from "../../scripts/study/worlds/index.mjs";

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

// The ladder's area config (#8005 slice 5): what scripts/study/round.mjs reads to run its round.
// Checked against the worlds it names, so it can never point a member at a world, a viewer or a
// route the worlds do not serve, and its roles never carry a member card's words.
describe("the ladder area config", () => {
  const ROOT = join(import.meta.dirname, "../..");
  const config = JSON.parse(
    readFileSync(join(ROOT, "scripts/study/tasks/ladder.json"), "utf8"),
  ) as AreaConfig & { census: { world: string; viewer: string; for: string[] }[] };
  const world = (name: string) => WORLDS.find((w) => w.name === name);

  it("passes its own checks", () => {
    expect(profileProblems(config)).toEqual([]);
  });

  it("puts every member and every census on a ladder world, as one of its viewers", () => {
    for (const r of [...config.matrix, ...config.census]) {
      expect(r.world).toMatch(/^ladder-/);
      expect(Object.keys(world(r.world)?.viewers ?? {})).toContain(r.viewer);
    }
  });

  it("runs phone first, the thin cut included, with the chat in hand", () => {
    const frames = config.matrix.flatMap((r) => r.viewports);
    expect(frames.filter((v) => v === "phone").length).toBeGreaterThan(frames.length / 2);
    expect(config.thin.viewport).toBe("phone");
    for (const r of config.matrix) expect(world(r.world)?.chat).toBe(true);
  });

  it("starts the thin cut's experts on a route its world's own surfaces name", () => {
    const viewer = config.matrix.find((r) => r.member === config.thin.member)?.viewer;
    const routes = (world(config.thin.world)?.surfaces ?? [])
      .filter((s) => s.viewer === viewer && !s.struck)
      .map((s) => s.route);
    expect(routes).toContain(config.thin.expertRoute);
  });

  it("ships roles that repeat no member card", () => {
    const members = [...new Set(config.matrix.map((r) => r.member))];
    const cards = Object.fromEntries(
      members.map((m) => [
        m,
        memberCard(readFileSync(join(ROOT, "docs/members", `${m}.md`), "utf8"), {
          cutoff: config.cutoff,
          name: m,
        }).text,
      ]),
    );
    expect(cardEchoes(rolesPacket(config.roles, members).text, cards)).toEqual([]);
  });
});
