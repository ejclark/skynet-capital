import { createCompanionChat } from "../../src/companion/companion-chat.js";
import {
  GAME_MASTER_RULES,
  type ReadSceneFacts,
  SCENE_CHOICES,
  SCENE_FACTS_TOOL_NAME,
} from "../../src/companion/companion-game-master.js";
import { COMPANION_SYSTEM_PROMPT } from "../../src/companion/companion-system-prompt.js";
import type { DoFetch } from "../../src/companion/companion-tool-rounds.js";
import { systemBlocks, toolsFor } from "../../src/companion/companion-tool-rounds.js";
import {
  COMPANION_TOOL_NAMES,
  type CompanionDeskDeps,
  declaredToolNames,
  runCompanionTool,
} from "../../src/companion/companion-tools.js";
import { gameMasterAdmits } from "../../src/companion/game-master-flag.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type { SceneFacts } from "../../src/server/scene-facts.js";

/**
 * THE GAME-MASTER PILOT, ENGINE SIDE (#8191 criteria 1, 2, 6, 8, 12): the setting admits whom it
 * names; the scene rules and `get_scene_facts` exist only in a game-master turn; an ordinary turn
 * cannot call the scene tool even by name; and the tool reads, never writes.
 */

const SCENE: SceneFacts = {
  found: false,
  asOf: "2026-11-08",
  marketOpen: true,
  marketWords: "the regular session is open now",
  said: "nothing is on the event calendar for the next 14 days",
  notCovered: "News and lawsuits: not covered yet",
};

const snapshot = {
  cash: 25_000,
  positions: [{ symbol: "NVDA" }, { symbol: "NVDA261218C00200000" }],
} as unknown as ParticipantSnapshot;

function recordingReader() {
  const calls: Parameters<ReadSceneFacts>[0][] = [];
  const read: ReadSceneFacts = (query) => {
    calls.push(query);
    return SCENE;
  };
  return { calls, read };
}

const deps = (over: Partial<CompanionDeskDeps> = {}): CompanionDeskDeps => ({
  snapshotFor: (id) => (id === "acct-1" ? snapshot : undefined),
  ...over,
});

describe("the pilot setting (criteria 1, 2)", () => {
  it("off admits no one; owner admits the owner only; members admits any signed-in member", () => {
    expect(gameMasterAdmits("off", { owner: true })).toBe(false);
    expect(gameMasterAdmits("owner", { owner: false })).toBe(false);
    expect(gameMasterAdmits("owner", { owner: true })).toBe(true);
    expect(gameMasterAdmits("members", { owner: false })).toBe(true);
  });
});

describe("the scene's two halves exist only in a game-master turn", () => {
  it("declares get_scene_facts only in game-master mode, with or without a linked desk", () => {
    expect(declaredToolNames("acct-1")).not.toContain(SCENE_FACTS_TOOL_NAME);
    expect(declaredToolNames(undefined)).not.toContain(SCENE_FACTS_TOOL_NAME);
    expect(declaredToolNames("acct-1", true)).toEqual(COMPANION_TOOL_NAMES);
    expect(declaredToolNames(undefined, true)).toContain(SCENE_FACTS_TOOL_NAME);
    const names = (gm: boolean) =>
      (toolsFor("acct-1", gm) as { name: string }[]).map((t) => t.name);
    expect(names(false)).not.toContain(SCENE_FACTS_TOOL_NAME);
    expect(names(true)).toContain(SCENE_FACTS_TOOL_NAME);
  });

  it("adds the scene rules as a second cached block, after the main prompt and before the volatile context", () => {
    expect(systemBlocks("ctx")).toHaveLength(2);
    expect(systemBlocks("ctx", true)).toEqual([
      { type: "text", text: COMPANION_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      { type: "text", text: GAME_MASTER_RULES, cache_control: { type: "ephemeral" } },
      { type: "text", text: "ctx" },
    ]);
  });

  it("refuses the scene tool by name in an ordinary turn, reading nothing", async () => {
    const { calls, read } = recordingReader();
    const result = await runCompanionTool(
      SCENE_FACTS_TOOL_NAME,
      deps({ readSceneFacts: read }),
      "acct-1",
    );
    expect(result.ok).toBe(false);
    expect(calls).toEqual([]);
  });

  it("in a scene, reads the session's own held names and cash, and nothing for a deskless session", async () => {
    const { calls, read } = recordingReader();
    const d = deps({ readSceneFacts: read });
    expect(await runCompanionTool(SCENE_FACTS_TOOL_NAME, d, "acct-1", {}, true)).toEqual({
      ok: true,
      result: SCENE,
    });
    await runCompanionTool(SCENE_FACTS_TOOL_NAME, d, undefined, { underlying: " nbis " }, true);
    await runCompanionTool(SCENE_FACTS_TOOL_NAME, d, "acct-1", { eventId: "cpi-nov" }, true);
    expect(calls).toEqual([
      { held: ["NVDA", "NVDA261218C00200000"], desk: { id: "acct-1", cash: 25_000 } },
      { held: [], underlying: "NBIS" },
      {
        held: ["NVDA", "NVDA261218C00200000"],
        desk: { id: "acct-1", cash: 25_000 },
        eventId: "cpi-nov",
      },
    ]);
  });

  it("refuses an option symbol or a path-shaped event id before any read, and says so when unwired", async () => {
    const { calls, read } = recordingReader();
    const d = deps({ readSceneFacts: read });
    const bad = [{ underlying: "NVDA261218C00200000" }, { eventId: "../../etc/passwd" }];
    for (const input of bad)
      expect((await runCompanionTool(SCENE_FACTS_TOOL_NAME, d, "acct-1", input, true)).ok).toBe(
        false,
      );
    expect(calls).toEqual([]);
    expect(await runCompanionTool(SCENE_FACTS_TOOL_NAME, deps(), "acct-1", {}, true)).toEqual({
      ok: false,
      error: "the event calendar isn't available on this deployment",
    });
  });
});

describe("the scene rules say what the criteria require", () => {
  it("offers the three choices in order with none the default (criterion 6), and reflects 'should we' back (criterion 8)", () => {
    expect(SCENE_CHOICES).toEqual(["watch it", "take a paper position", "stand aside"]);
    expect(GAME_MASTER_RULES).toContain("1. Watch it\n2. Take a paper position\n3. Stand aside");
    expect(GAME_MASTER_RULES).toContain("none marked as the default");
    expect(GAME_MASTER_RULES).toMatch(
      /"should we buy".*reflect it back as a question about their own goals/s,
    );
  });

  it("hands over a review-screen link and places no order (criterion 7); timing and gaps in words (4, 9, 10)", () => {
    expect(GAME_MASTER_RULES).toContain("questHref");
    expect(GAME_MASTER_RULES).toContain("get_sized_suggestions");
    expect(GAME_MASTER_RULES).toContain("You place no order");
    expect(GAME_MASTER_RULES).toContain("after-hours price");
    expect(GAME_MASTER_RULES).toContain("the first regular-session reaction is the next open");
    expect(GAME_MASTER_RULES).toContain("invent no event");
    expect(GAME_MASTER_RULES).toContain("the record does not cover it");
  });
});

describe("the engine sends a scene only when the route set gameMaster", () => {
  async function requestFor(gameMaster: boolean | undefined) {
    const bodies: { system: unknown; tools: { name: string }[] }[] = [];
    const doFetch: DoFetch = (_m, _u, _h, body) => {
      bodies.push(body as never);
      return Promise.resolve({ status: 200, body: { content: [{ type: "text", text: "ok" }] } });
    };
    const chat = createCompanionChat({ apiKey: "k", tools: deps() }, doFetch);
    await chat(
      {
        messages: [{ role: "user", content: "play a scene" }],
        participantId: "acct-1",
        ...(gameMaster === undefined ? {} : { gameMaster }),
      },
      { onText: () => undefined, onDone: () => undefined, onError: () => undefined },
    );
    const [first] = bodies;
    if (!first) throw new Error("no request sent");
    return { system: JSON.stringify(first.system), tools: first.tools.map((t) => t.name) };
  }

  it("an ordinary turn carries no scene rules and no scene tool", async () => {
    for (const gm of [undefined, false]) {
      const req = await requestFor(gm);
      expect(req.system).not.toContain("GAME-MASTER MODE");
      expect(req.tools).not.toContain(SCENE_FACTS_TOOL_NAME);
    }
  });

  it("a game-master turn carries both", async () => {
    const req = await requestFor(true);
    expect(req.system).toContain("GAME-MASTER MODE");
    expect(req.tools).toContain(SCENE_FACTS_TOOL_NAME);
  });
});
