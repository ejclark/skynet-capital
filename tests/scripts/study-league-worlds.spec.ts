import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { cardEchoes, memberCard, rolesPacket } from "../../scripts/study/packets.mjs";
import { type AreaConfig, profileProblems } from "../../scripts/study/round-plan.mjs";
import { dayChangeGaps } from "../../scripts/study/worlds/day-change.mjs";
import { WORLDS } from "../../scripts/study/worlds/index.mjs";
import { loadInput } from "../../scripts/study/worlds/inputs.mjs";

/**
 * The league's worlds (#8005, the league: `docs/IA.md` §5.7) and what they asked of the harness: an
 * account whose broker read did not finish at the instant, read as production's own degraded row —
 * zeros, no holdings, the reason in production's words with production's deadline in it — whose
 * history ends at its last good sample and whose missing header is no day-change gap.
 */

describe("an account whose broker read timed out", () => {
  it("is layered onto one account only", () => {
    const input = loadInput("league-read-failed") as {
      participants: { id: string; brokerRead?: string }[];
    };
    expect(input.participants.filter((p) => p.brokerRead).map((p) => p.id)).toEqual(["jordan"]);
  });

  it("holds no header to rows a failed read never produced", () => {
    const book = {
      participants: [
        { id: "ok", equity: 110, positions: [] },
        { id: "unread", equity: 0, error: "Error: broker read timed out", positions: [] },
      ],
      lastEquity: { ok: 110, unread: 25_000 },
    };
    expect(dayChangeGaps(book)).toEqual([]);
  });

  it("reads as production's degraded row, at production's deadline, its history cut", () => {
    const script = `
      const { buildBook } = await import("./scripts/study/worlds/book.mjs");
      const { SNAPSHOT_READ_TIMEOUT_MS } = await import("./src/observatory/dashboard-data.ts");
      const book = buildBook("league-read-failed");
      const jordan = book.participants.find((p) => p.id === "jordan");
      const history = book.history.jordan;
      console.log(JSON.stringify({ jordan, ms: SNAPSHOT_READ_TIMEOUT_MS, last: history.at(-1),
        fills: book.activity.jordan.length }));
    `;
    const run = spawnSync("npx", ["tsx", "--input-type=module", "-e", script], {
      encoding: "utf8",
      env: { ...process.env, STUDY_INSTANT: "2026-11-23T15:00:00-05:00" },
    });
    expect(run.stderr).toBe("");
    const out = JSON.parse(run.stdout.trim().split("\n").at(-1) ?? "{}");
    expect(out.jordan).toEqual({
      id: "jordan",
      displayName: "Jordan",
      kind: "human",
      cash: 0,
      equity: 0,
      positions: [],
      activity: [],
      error: `Error: broker read timed out after ${out.ms}ms`,
    });
    // Friday's close is its last sample; its fills stay on the feed.
    expect(Date.parse(out.last.at)).toBeLessThan(Date.parse("2026-11-23T15:00:00-05:00"));
    expect(out.last.equity).toBeGreaterThan(0);
    expect(out.fills).toBeGreaterThan(0);
  }, 60_000);
});

// The league's area config (#8005 slice 5): what scripts/study/round.mjs reads to run its round.
// Checked against the worlds it names, so it can never point a member at a world, a viewer or a
// route the worlds do not serve, and its roles never carry a member card's words.
describe("the league area config", () => {
  const ROOT = join(import.meta.dirname, "../..");
  const config = JSON.parse(
    readFileSync(join(ROOT, "scripts/study/tasks/league.json"), "utf8"),
  ) as AreaConfig & { census: { world: string; viewer: string; for: string[] }[] };
  const world = (name: string) => WORLDS.find((w) => w.name === name);

  it("passes its own checks", () => {
    expect(profileProblems(config)).toEqual([]);
  });

  it("puts every member and every census on a league world, as one of its viewers", () => {
    for (const r of [...config.matrix, ...config.census]) {
      expect(r.world).toMatch(/^league-/);
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
