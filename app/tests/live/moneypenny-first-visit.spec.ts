import {
  GOAL_ASK,
  GOAL_CLEARED,
  GOAL_PICKS,
  GOAL_SET,
  TOUR_END,
  VISIT_STOPPED,
  WELCOME,
} from "../../src/live/first-visit";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { movesFor } from "../../src/live/moneypenny-moves";
import { keyFor, load } from "../../src/live/moneypenny-storage";
import { json, onboarding } from "../shell/moneypenny-dock-harness";

/**
 * THE FIRST VISIT IN THE STORE (#7487 slice 7). The welcome stands in for her intro script on a
 * member's first visit only, never both; the visit and the goal persist with the member's
 * conversation; a goal is collected from the box (typed or picked) and a question typed meanwhile is
 * still a question; anything else typed ends the visit and routes as it always did.
 */

type Read = { viewerId?: string; connected?: boolean; messaged?: boolean };

const settle = () => new Promise((ok) => setTimeout(ok, 20));
const mpLines = () =>
  useMoneypenny
    .getState()
    .messages.filter((m) => m.role === "mp")
    .map((m) => m.text);

describe("a member's first visit", () => {
  let realFetch: typeof globalThis.fetch;
  let read: Read;
  let chats: number;
  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({ member: undefined, history: false, thread: undefined });
    read = { viewerId: "m-1" };
    chats = 0;
    globalThis.fetch = ((url: string) => {
      if (url === "/api/onboarding") {
        const ob = onboarding(read.connected === true);
        return Promise.resolve(
          json({
            ...ob,
            steps: ob.steps.map((s) =>
              s.id === "first-message" ? { ...s, done: read.messaged === true } : s,
            ),
            ...(read.viewerId ? { viewerId: read.viewerId } : {}),
          }),
        );
      }
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      if (url === "/api/companion/chat") {
        chats++;
        return Promise.resolve(
          new Response('event: delta\ndata: {"text":"an answer"}\n\nevent: done\ndata: {}\n\n', {
            status: 200,
            headers: { "content-type": "text/event-stream" },
          }),
        );
      }
      return Promise.resolve(new Response("{}", { status: 200 }));
    }) as typeof globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("welcomes a new member once, and saves that it did", async () => {
    await useMoneypenny.getState().welcome();
    await useMoneypenny.getState().welcome();
    expect(mpLines()).toEqual([WELCOME]);
    const s = useMoneypenny.getState();
    expect(s.visit).toEqual({ kind: "welcome" });
    expect(s.introDone).toBe(true);
    expect(load("m-1").visit).toEqual({ kind: "welcome" });
  });

  it("stands in for the intro: opening History after it plays no second greeting", async () => {
    await useMoneypenny.getState().welcome();
    await useMoneypenny.getState().wake({ intro: true });
    expect(mpLines()).toEqual([WELCOME]);
  });

  it("never welcomes a returning member, a signed-out viewer, or one already greeted", async () => {
    for (const r of [
      { viewerId: "m-1", connected: true },
      { viewerId: "m-1", messaged: true },
      {},
    ] satisfies Read[]) {
      localStorage.clear();
      useMoneypenny.getState().reset();
      useMoneypenny.setState({ member: undefined });
      read = r;
      await useMoneypenny.getState().welcome();
      expect(mpLines()).toEqual([]);
    }
    // Greeted by the intro on this device already.
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({ member: undefined });
    read = { viewerId: "m-1" };
    await useMoneypenny.getState().wake({ intro: true });
    const before = mpLines();
    await useMoneypenny.getState().welcome();
    expect(mpLines()).toEqual(before);
    expect(before).not.toContain(WELCOME);
  });

  it("steps through the tour, saying each line in the main conversation", async () => {
    await useMoneypenny.getState().welcome();
    await useMoneypenny.getState().stepVisit({ kind: "tour", step: 0 }, "Moneypenny · market");
    expect(useMoneypenny.getState().visit).toEqual({ kind: "tour", step: 0 });
    await useMoneypenny.getState().stepVisit({ kind: "end" }, TOUR_END);
    await useMoneypenny.getState().stepVisit(undefined, VISIT_STOPPED);
    expect(useMoneypenny.getState().visit).toBeUndefined();
    expect(mpLines()).toEqual([WELCOME, "Moneypenny · market", TOUR_END, VISIT_STOPPED]);
  });

  it("collects a goal from the box, pins it with its time, and ends the visit", async () => {
    await useMoneypenny.getState().welcome();
    await useMoneypenny.getState().askGoal();
    expect(useMoneypenny.getState().visit).toEqual({ kind: "goal" });
    expect(mpLines().at(-1)).toBe(GOAL_ASK);
    const before = Date.now();
    await useMoneypenny.getState().send("Get comfortable with covered calls");
    const s = useMoneypenny.getState();
    expect(s.goal?.text).toBe("Get comfortable with covered calls");
    expect(s.goal?.at).toBeGreaterThanOrEqual(before);
    expect(s.visit).toBeUndefined();
    expect(mpLines().at(-1)).toBe(GOAL_SET);
    expect(chats).toBe(0);
    expect(load("m-1").goal?.text).toBe("Get comfortable with covered calls");
  });

  it("asked for outside the welcome, sets aside a waiting setup beat so the picks show", async () => {
    // A member who skipped past the intro (History first, or a new conversation) has the setup
    // offer still waiting; the Quests row's "Set a goal" must still offer the picks and "Not now".
    useMoneypenny.setState({ member: "m-1", introDone: true, flow: "setup", visit: undefined });
    await useMoneypenny.getState().askGoal();
    const s = useMoneypenny.getState();
    expect(s.flow).toBe("idle");
    expect(s.visit).toEqual({ kind: "goal" });
    const labels = movesFor({
      busy: false,
      inThread: false,
      flow: s.flow,
      parked: { draft: false, view: false, followup: false, research: false },
      connected: false,
      firstTradeDone: false,
      latest: undefined,
      ...(s.visit ? { visit: s.visit } : {}),
    }).map((m) => m.label);
    expect(labels).toEqual([...GOAL_PICKS, "Not now"]);
  });

  it("answers a question typed while a goal is collected, and the goal waits", async () => {
    await useMoneypenny.getState().welcome();
    await useMoneypenny.getState().askGoal();
    await useMoneypenny.getState().send("what is an option?");
    await settle();
    expect(useMoneypenny.getState().goal).toBeUndefined();
    expect(useMoneypenny.getState().visit).toBeUndefined();
    expect(chats).toBe(1);
  });

  it("ends the visit when the member types their own way, and routes the line as always", async () => {
    await useMoneypenny.getState().welcome();
    await useMoneypenny.getState().send("how do sectors work?");
    await settle();
    expect(useMoneypenny.getState().visit).toBeUndefined();
    expect(chats).toBe(1);
  });

  it("clears a goal, and a new conversation keeps it", async () => {
    await useMoneypenny.getState().welcome();
    await useMoneypenny.getState().askGoal();
    await useMoneypenny.getState().send("Practice with small amounts");
    await useMoneypenny.getState().newConversation();
    expect(useMoneypenny.getState().goal?.text).toBe("Practice with small amounts");
    expect(mpLines()).not.toContain(WELCOME);
    await useMoneypenny.getState().clearGoal();
    expect(useMoneypenny.getState().goal).toBeUndefined();
    expect(mpLines().at(-1)).toBe(GOAL_CLEARED);
    expect(JSON.parse(localStorage.getItem(keyFor("m-1")) ?? "{}").goal).toBeUndefined();
  });

  it("never carries one member's goal or visit to the next on a shared device", async () => {
    await useMoneypenny.getState().welcome();
    await useMoneypenny.getState().askGoal();
    await useMoneypenny.getState().send("Learn how options work");
    read = { viewerId: "m-2", connected: true };
    await useMoneypenny.getState().wake();
    const s = useMoneypenny.getState();
    expect(s.member).toBe("m-2");
    expect(s.goal).toBeUndefined();
    expect(s.visit).toBeUndefined();
  });
});
