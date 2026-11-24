import { spawnSync } from "node:child_process";
import { describe, expect, it } from "@rstest/core";
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
