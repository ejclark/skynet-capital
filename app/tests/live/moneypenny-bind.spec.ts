import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { keyFor } from "../../src/live/moneypenny-storage";
import { type MpThread, rowLines } from "../../src/live/moneypenny-threads";
import { json, onboarding } from "../shell/moneypenny-rail-harness";

/**
 * A failed onboarding read is not a sign-out (#7307). The server answers a signed-out session 200
 * without `viewerId` (`onboarding-api-routes.ts`), so a 503 or a dropped connection says nothing
 * about who is signed in. Before the fix, one failed read bound the store to "anon", closed the
 * open row thread, and deleted the member's saved blob, which stayed empty after the server came
 * back. Each case drives the store the way the row's "Continue in the chat" and its ask box do.
 */

const thread: MpThread = {
  key: "event-2026-11-10-coreweave-q3-results",
  title: "CoreWeave Q3 results",
  path: "/#event-2026-11-10-coreweave-q3-results",
};

const stream = (text: string) =>
  new Response(`event: delta\ndata: ${JSON.stringify({ text })}\n\nevent: done\ndata: {}\n\n`, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });

type Read = "member-1" | "member-2" | "signed-out" | "503" | "network";

const settle = () => new Promise((ok) => setTimeout(ok, 20));
const storedKeys = () =>
  Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter(
    (k): k is string => k?.startsWith("sc.moneypenny.v1.") ?? false,
  );

describe("a failed onboarding read keeps the member's chat (#7307)", () => {
  let realFetch: typeof globalThis.fetch;
  let read: Read;
  beforeEach(async () => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({ member: undefined, open: false, thread: undefined });
    read = "member-1";
    let turn = 0;
    globalThis.fetch = ((url: string) => {
      if (url === "/api/onboarding") {
        if (read === "503") return Promise.resolve(json({ error: "down" }, 503));
        if (read === "network") return Promise.reject(new TypeError("Failed to fetch"));
        const viewer = read === "signed-out" ? {} : { viewerId: read };
        return Promise.resolve(json({ ...onboarding(true), ...viewer }));
      }
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      if (url === "/api/companion/chat") return Promise.resolve(stream(`answer ${++turn}`));
      return Promise.resolve(new Response("{}", { status: 200 }));
    }) as typeof globalThis.fetch;
    // member-1 asks on a row: their saved blob now holds the row's thread.
    useMoneypenny.getState().ask("what's the setup?", thread);
    await settle();
    useMoneypenny.getState().closeThread();
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const rowThread = () => rowLines(useMoneypenny.getState().messages, thread.key);

  it("starts from member-1 with a saved row thread", () => {
    expect(useMoneypenny.getState().member).toBe("member-1");
    expect(rowThread().map((m) => m.role)).toEqual(["user", "mp"]);
    expect(storedKeys()).toEqual([keyFor("member-1")]);
  });

  for (const failure of ["503", "network"] as const) {
    it(`keeps the member, their open thread and their saved blob when the read answers ${failure}`, async () => {
      read = failure;
      useMoneypenny.getState().openThread(thread);
      await settle();
      const s = useMoneypenny.getState();
      expect(s.member).toBe("member-1");
      expect(s.thread?.key).toBe(thread.key);
      expect(rowThread()).toHaveLength(2);
      expect(storedKeys()).toEqual([keyFor("member-1")]);
    });
  }

  it("tags a row's question with that row's thread while the read fails", async () => {
    read = "503";
    useMoneypenny.getState().ask("and the risk?", thread);
    await settle();
    const asked = useMoneypenny.getState().messages.find((m) => m.text.endsWith("and the risk?"));
    expect(asked?.thread).toBe(thread.key);
    expect(rowThread().map((m) => m.role)).toEqual(["user", "mp", "user", "mp"]);
  });

  it("shows the earlier messages and threads once the server recovers", async () => {
    read = "503";
    useMoneypenny.getState().openThread(thread);
    await settle();
    useMoneypenny.getState().ask("and the risk?", thread);
    await settle();
    read = "member-1";
    await useMoneypenny.getState().openRail();
    const s = useMoneypenny.getState();
    expect(s.member).toBe("member-1");
    expect(s.threads.map((t) => t.key)).toEqual([thread.key]);
    expect(rowThread()).toHaveLength(4);
    expect(storedKeys()).toEqual([keyFor("member-1")]);
  });

  it("never deletes a saved member's blob when the very first read on a page load fails", async () => {
    useMoneypenny.setState({ member: undefined, thread: undefined });
    read = "503";
    await useMoneypenny.getState().openRail();
    expect(storedKeys()).toContain(keyFor("member-1"));
    read = "member-1";
    await useMoneypenny.getState().openRail();
    expect(useMoneypenny.getState().member).toBe("member-1");
    expect(rowThread()).toHaveLength(2);
  });

  it("still forgets member-1's chat when the read answers signed out", async () => {
    read = "signed-out";
    await useMoneypenny.getState().openRail();
    expect(useMoneypenny.getState().member).toBe("anon");
    expect(useMoneypenny.getState().messages).toEqual([]);
    expect(storedKeys()).not.toContain(keyFor("member-1"));
  });

  it("still switches member and forgets the other's chat when the read answers someone else", async () => {
    read = "member-2";
    await useMoneypenny.getState().openRail();
    expect(useMoneypenny.getState().member).toBe("member-2");
    expect(useMoneypenny.getState().messages).toEqual([]);
    expect(storedKeys()).not.toContain(keyFor("member-1"));
  });
});
