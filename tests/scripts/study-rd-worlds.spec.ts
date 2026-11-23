import { spawnSync } from "node:child_process";
import { describe, expect, it } from "@rstest/core";
import { loadInput } from "../../scripts/study/worlds/inputs.mjs";

/**
 * The R&D worlds (#8005, R&D: `docs/IA.md` §5.4) and what they asked of the harness: a layer that
 * adds an account the base does not hold (a member who linked one this morning), and a member's own
 * R&D records — a stated view, a drafted playbook — written through production's own handlers into
 * production's own stores at compose, each stamped at its own time (member-stores.mjs), so the
 * world never holds a record production would have refused.
 */

type Input = {
  participants: { id: string; cash: number; positions: unknown[] }[];
  members: { email: string; owns: string[] }[];
  history: Record<string, { at: string; equity: number }[]>;
  watchlists: Record<string, { symbol: string }[]>;
  stores?: string[];
  writes?: { member: string; at: string; path: string }[];
};

describe("a layer that adds an account", () => {
  const today = loadInput("rd-today") as Input;
  const first = loadInput("rd-first-day") as Input;

  it("adds the new account beside the base's, with its own history, and keeps the rest", () => {
    expect(first.participants.map((p) => p.id)).toEqual([
      ...today.participants.map((p) => p.id),
      "casey",
    ]);
    expect(first.participants.at(-1)).toMatchObject({ id: "casey", cash: 25000, positions: [] });
    expect(first.history.casey?.map((h) => h.at)).toEqual(["@0d 09:40", "@now"]);
    expect(first.history.eric).toEqual(today.history.eric);
    expect(first.members.find((m) => m.email === "casey@study.world")?.owns).toEqual(["casey"]);
  });

  it("carries the base's watchlist and adds no member store it did not name", () => {
    expect(first.watchlists.eric?.map((w) => w.symbol)).toEqual(["AVGO", "GOOG", "NVDA"]);
    expect(first.stores).toBeUndefined();
    expect(loadInput("rd-own-views")).toMatchObject({
      stores: ["memberConvictions", "authoredPlays"],
    });
  });
});

/** Compose-time replay in a child pinned to the worlds' day, as compose.mjs runs it. */
function replayed(writesJson?: string): { ok: boolean; out: string; err: string } {
  const script = `
    const { buildBook } = await import("./scripts/study/worlds/book.mjs");
    const { serverConfig, sessionFor } = await import("./scripts/study/worlds/server-config.mjs");
    const { memberStores, replayWrites } = await import("./scripts/study/worlds/member-stores.mjs");
    const { serverRead, serverWrite } = await import("./scripts/study/server-reads.mjs");
    const { createBoardChannel } = await import("./src/server/board-patch-routes.ts");
    const book = buildBook("rd-own-views");
    const config = { ...serverConfig(book), ...(await memberStores(book.stores)) };
    const channel = createBoardChannel("spec");
    const writes = ${writesJson ?? "book.writes"};
    await replayWrites(writes, { config, channel, sessionFor, serverWrite });
    const eric = sessionFor("eric@study.world");
    const read = async (u) => (await serverRead(u, config, channel, eric)).body;
    console.log(JSON.stringify({
      convictions: (await read("/api/convictions/mine")).convictions,
      plays: (await read("/api/authored-plays")).plays,
    }));
  `;
  const run = spawnSync("npx", ["tsx", "--input-type=module", "-e", script], {
    encoding: "utf8",
    env: { ...process.env, STUDY_INSTANT: "2026-11-23T15:00:00-05:00" },
  });
  return { ok: run.status === 0, out: run.stdout.trim().split("\n").at(-1) ?? "", err: run.stderr };
}

describe("a member's own R&D records, through the real handlers", () => {
  it("keeps the view and the draft as production's stores record them, each at its own time", () => {
    const run = replayed();
    expect(run.err).toBe("");
    const { convictions, plays } = JSON.parse(run.out) as {
      convictions: {
        status: string;
        createdAt: string;
        conviction: { statedOn: string; steers: string[] };
        takesOver: { from: string }[];
      }[];
      plays: { id: string; status: string; runsOn: string; updatedAt: string }[];
    };
    // Stated Friday 20:10 New York; drafted today at 12:15 New York.
    expect(convictions).toHaveLength(1);
    expect(convictions[0]).toMatchObject({
      status: "draft",
      createdAt: "2026-11-21T01:10:00.000Z",
      conviction: { statedOn: "2026-11-20", steers: ["CRWV-WHEEL"] },
      takesOver: [{ from: "AI-dip view" }],
    });
    expect(plays).toEqual([
      expect.objectContaining({
        id: "U-sauron-crwv-news-pop",
        status: "draft",
        runsOn: "sauron",
        updatedAt: "2026-11-23T17:15:00.000Z",
      }),
    ]);
  }, 60_000);

  it("stops the compose on a write the handler refuses, with the handler's words", () => {
    const refused = JSON.stringify([
      {
        member: "eric@study.world",
        at: "2026-11-21T01:10:00.000Z",
        path: "/api/convictions/save",
        body: { draft: { title: "steers nothing", checkOn: "2027-01-29", claims: [], steers: [] } },
      },
    ]);
    const run = replayed(refused);
    expect(run.ok).toBe(false);
    expect(run.err).toMatch(/\/api\/convictions\/save at 2026-11-21T01:10:00.000Z was not saved/);
  }, 60_000);
});
