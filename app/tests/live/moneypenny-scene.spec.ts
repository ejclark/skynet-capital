import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { BACK_TO_MAIN, type MoveState, movesFor } from "../../src/live/moneypenny-moves";
import {
  isSceneKey,
  newSceneThread,
  PLAY_SCENE_LABEL,
  SCENE_TITLE,
  sceneChoiceMoves,
  sceneTitle,
} from "../../src/live/moneypenny-scene";
import { json, onboarding } from "../shell/moneypenny-dock-harness";

/**
 * A GAME-MASTER SCENE IN THE DOCK (#8191 criteria 6, 7, 11, 13): the move in, the three choices as
 * moves, the way out, and the wire — every scene turn carries `mode: "game-master"`, and the next
 * main turn after "Back to the main conversation" carries none.
 */

const base: MoveState = {
  busy: false,
  inThread: false,
  flow: "idle",
  parked: { draft: false, view: false, followup: false, research: false },
  connected: true,
  firstTradeDone: true,
  latest: undefined,
};
const labels = (patch: Partial<MoveState>) => movesFor({ ...base, ...patch }).map((m) => m.label);

const CHOICES =
  "Moneypenny · **CRWV earnings print** — Tue Nov 10, date confirmed\nThe house: accumulate small.\n\n1. Watch it\n2. Take a paper position\n3. Stand aside";

describe("the dock's moves for a scene", () => {
  it("offers 'Play a scene' on the main conversation at rest only when the server offers scenes (criterion 6)", () => {
    expect(labels({ gameMaster: true })).toContain(PLAY_SCENE_LABEL);
    expect(labels({ gameMaster: false })).not.toContain(PLAY_SCENE_LABEL);
    expect(labels({})).not.toContain(PLAY_SCENE_LABEL);
    expect(labels({ gameMaster: true, busy: true })).toEqual([]);
    expect(labels({ gameMaster: true, inThread: true })).toEqual([BACK_TO_MAIN.label]);
  });

  it("in a scene, puts the three choices in order ahead of the way out, once she offers them (criterion 13)", () => {
    const latest = { role: "mp" as const, text: CHOICES };
    expect(labels({ inThread: true, inScene: true, latest })).toEqual([
      "Watch it",
      "Take a paper position",
      "Stand aside",
      BACK_TO_MAIN.label,
    ]);
    // Before she has offered the choices, or in another thread, only the way out.
    const scene = { role: "mp" as const, text: "Moneypenny · setting the scene…" };
    expect(labels({ inThread: true, inScene: true, latest: scene })).toEqual([BACK_TO_MAIN.label]);
    expect(labels({ inThread: true, latest })).toEqual([BACK_TO_MAIN.label]);
  });

  it("sends each choice as the member's own words; none is a link or an order", () => {
    for (const m of sceneChoiceMoves(CHOICES)) {
      expect(m.kind).toBe("say");
      expect(m.kind === "say" && m.msg).toBe(m.label);
    }
  });
});

describe("a scene thread", () => {
  it("is keyed fresh per tap and named from her first reply's first line", () => {
    const a = newSceneThread(1, "/trade");
    expect(a).toEqual({ key: "scene-1", title: SCENE_TITLE, path: "/trade" });
    expect(newSceneThread(2, "x").path).toBe("/");
    expect(isSceneKey(a.key)).toBe(true);
    expect(isSceneKey("event-cpi")).toBe(false);
    expect(isSceneKey(undefined)).toBe(false);
    expect(sceneTitle(CHOICES)).toBe("Scene · CRWV earnings print — Tue Nov 10, date confirmed");
    expect(sceneTitle("Moneypenny · ")).toBe(SCENE_TITLE);
  });
});

describe("the wire: mode rides only on a scene's turns (criteria 7, 11)", () => {
  let realFetch: typeof globalThis.fetch;
  const bodies: { mode?: string }[] = [];
  const settle = () => new Promise((ok) => setTimeout(ok, 20));
  const stream = (text: string) =>
    new Response(`event: delta\ndata: ${JSON.stringify({ text })}\n\nevent: done\ndata: {}\n\n`, {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    });

  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({ member: undefined, expanded: false, thread: undefined });
    bodies.length = 0;
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      if (url === "/api/onboarding")
        return Promise.resolve(json({ ...onboarding(true), viewerId: "member-1" }));
      if (url === "/api/companion")
        return Promise.resolve(json({ enabled: true, disclosure: "", gameMaster: true }));
      if (url === "/api/companion/chat") {
        bodies.push(JSON.parse(String(init?.body)) as { mode?: string });
        return Promise.resolve(stream(CHOICES.replace(/^Moneypenny · /, "")));
      }
      return Promise.resolve(new Response("{}", { status: 200 }));
    }) as typeof globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("opens a scene thread, sends every turn in it as a scene, names it, and leaves it cleanly", async () => {
    expect(useMoneypenny.getState().startScene()).toBe(true);
    await settle();
    let s = useMoneypenny.getState();
    expect(s.gameMaster).toBe(true);
    expect(isSceneKey(s.thread?.key)).toBe(true);
    expect(s.thread?.title).toBe("Scene · CRWV earnings print — Tue Nov 10, date confirmed");
    await s.send("Take a paper position");
    expect(bodies.map((b) => b.mode)).toEqual(["game-master", "game-master"]);

    useMoneypenny.getState().closeThread();
    await useMoneypenny.getState().send("what's on my desk?");
    expect(bodies.at(-1)?.mode).toBeUndefined();

    // A new tap after leaving starts a fresh scene: its transcript holds only its own lines.
    const first = s.thread?.key;
    await new Promise((ok) => setTimeout(ok, 2));
    useMoneypenny.getState().startScene();
    await settle();
    s = useMoneypenny.getState();
    expect(s.thread?.key).not.toBe(first);
    const sent = bodies.at(-1) as unknown as { messages: { content: string }[]; mode?: string };
    expect(sent.mode).toBe("game-master");
    expect(sent.messages.map((m) => m.content)).toEqual([PLAY_SCENE_LABEL]);
  });
});
