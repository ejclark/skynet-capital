import { useMoneypenny } from "../../src/live/moneypenny";
import { keyFor } from "../../src/live/moneypenny-storage";
import { json, onboarding } from "../shell/moneypenny-dock-harness";

/**
 * The Eye's line (`remark`, #7487 slice 5 review): a returning member loads Campaign cold, and the
 * notice can be ready before the onboarding read binds the thread. A line said then became the
 * store's first message: `hydrate` saw a touched store and never loaded the member's conversation,
 * and the line was saved under "anon". `remark` now says nothing until the thread is bound.
 */

const settle = () => new Promise((ok) => setTimeout(ok, 20));

describe("remark waits for the thread to be bound to its member", () => {
  let realFetch: typeof globalThis.fetch;
  beforeEach(async () => {
    realFetch = globalThis.fetch;
    localStorage.clear();
    useMoneypenny.getState().reset();
    globalThis.fetch = ((url: string) => {
      if (url === "/api/onboarding")
        return Promise.resolve(json({ ...onboarding(true), viewerId: "member-1" }));
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      return Promise.resolve(new Response("{}", { status: 200 }));
    }) as typeof globalThis.fetch;
    // member-1's saved conversation from an earlier visit.
    useMoneypenny.setState({ member: "member-1" });
    useMoneypenny.getState().remark("an earlier line");
    // A cold page load: nothing in memory, the saved blob still on this device.
    useMoneypenny.setState({ member: undefined, messages: [], threads: [] });
    await settle();
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("says nothing, and saves nothing under anon, before the member is known", () => {
    expect(useMoneypenny.getState().remark("the Eye is on the market")).toBeUndefined();
    expect(useMoneypenny.getState().messages).toEqual([]);
    expect(localStorage.getItem(keyFor("anon"))).toBeNull();
  });

  it("leaves hydrate free to load the member's own conversation, then lands after it", async () => {
    useMoneypenny.getState().remark("the Eye is on the market");
    await useMoneypenny.getState().hydrate();
    const s = useMoneypenny.getState();
    expect(s.member).toBe("member-1");
    expect(s.messages.map((m) => m.text)).toEqual(["an earlier line"]);
    const line = s.remark("the Eye is on the market");
    expect(line?.text).toBe("the Eye is on the market");
    expect(useMoneypenny.getState().messages.map((m) => m.text)).toEqual([
      "an earlier line",
      "the Eye is on the market",
    ]);
    expect(localStorage.getItem(keyFor("member-1"))).toContain("the Eye is on the market");
  });
});
