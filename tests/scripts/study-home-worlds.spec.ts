import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { cardEchoes, memberCard, rolesPacket } from "../../scripts/study/packets.mjs";
import { type AreaConfig, profileProblems } from "../../scripts/study/round-plan.mjs";
import { WORLDS } from "../../scripts/study/worlds/index.mjs";
import { githubAnswer, loadInput } from "../../scripts/study/worlds/inputs.mjs";

/**
 * The landing page's worlds, with Me and the chat (#8005: `docs/IA.md` §5.9, §5.6), and what they
 * asked of the harness: a member's own filings, the log as production's store lists it and each
 * filing's standing classified by production's own status fetcher over GitHub's answer — which the
 * world gives from its input and never sends off the machine.
 */

describe("a member's filings, as production reads them", () => {
  it("answers GitHub's issue read for a filing the input names, and nothing else", () => {
    const answer = githubAnswer(loadInput("home-filed"));
    expect(answer("https://api.github.com/repos/ejclark/skynet-capital/issues/9102")).toMatchObject(
      { number: 9102, state: "open" },
    );
    expect(answer("https://api.github.com/repos/ejclark/skynet-capital/issues/1")).toBeUndefined();
    expect(answer("https://api.github.com/repos/other/repo/issues/9102")).toBeUndefined();
  });

  it("lists each filing with the status production's fetcher gives it, the owner's only", () => {
    const script = `
      const { guardNetwork } = await import("./scripts/study/no-network.mjs");
      const { loadInput, worldNetwork } = await import("./scripts/study/worlds/inputs.mjs");
      const answer = worldNetwork(loadInput("home-filed"));
      guardNetwork((url) => answer(url));
      const { buildBook } = await import("./scripts/study/worlds/book.mjs");
      const { serverConfig, sessionFor } = await import("./scripts/study/worlds/server-config.mjs");
      const { serverRead } = await import("./scripts/study/server-reads.mjs");
      const { createBoardChannel } = await import("./src/server/board-patch-routes.ts");
      const config = serverConfig(buildBook("home-filed"));
      const read = async (email) => (await serverRead("/api/feedback", config,
        createBoardChannel("spec"), sessionFor(email))).body;
      const eric = await read("eric@study.world");
      const jordan = await read("jordan@study.world");
      console.log(JSON.stringify({ eric: eric.recent.map((r) => [r.issueNumber, r.status]),
        jordan: jordan.recent.length }));
    `;
    const run = spawnSync("npx", ["tsx", "--input-type=module", "-e", script], {
      encoding: "utf8",
      env: { ...process.env, STUDY_INSTANT: "2026-11-23T15:00:00-05:00" },
    });
    expect(run.stderr).toBe("");
    const out = JSON.parse(run.stdout.trim().split("\n").at(-1) ?? "{}");
    expect(out.eric).toEqual([
      [9101, "shipped"],
      [9102, "needs-info"],
      [9103, "up-next"],
    ]);
    expect(out.jordan).toBe(0);
  }, 60_000);
});

// The landing page's area config, with Me and the chat (#8005 slice 5): what scripts/study/round.mjs reads to run its round.
// Checked against the worlds it names, so it can never point a member at a world, a viewer or a
// route the worlds do not serve, and its roles never carry a member card's words.
describe("the home area config", () => {
  const ROOT = join(import.meta.dirname, "../..");
  const config = JSON.parse(
    readFileSync(join(ROOT, "scripts/study/tasks/home.json"), "utf8"),
  ) as AreaConfig & { census: { world: string; viewer: string; for: string[] }[] };
  const world = (name: string) => WORLDS.find((w) => w.name === name);

  it("passes its own checks", () => {
    expect(profileProblems(config)).toEqual([]);
  });

  it("puts every member and every census on a landing/Me world, as one of its viewers", () => {
    for (const r of [...config.matrix, ...config.census]) {
      expect(r.world).toMatch(/^home-/);
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
