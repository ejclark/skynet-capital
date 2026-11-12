import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { type Notice, rememberQuests, seenQuests, useNoticeMoves } from "../../src/live/eye-notice";
import type { MissionWindow } from "../../src/live/mission";
import { useMoneypenny } from "../../src/live/moneypenny";
import { useEyeLight } from "../../src/shell/eye-light";
import { useEyeNotice } from "../../src/shell/use-eye-notice";

/**
 * THE EYE NOTICES, PLAYED (#7487 slice 5): once the page has its data the Eye points at one thing —
 * the window slides to it (the address), the row is lit with a reason, and Moneypenny's latest line
 * says what it saw with "Back to where I was" — but never on the first look, never while the member
 * types, never on a visit that arrived on a deep link, and never twice in a session.
 */

const NOTICE: Notice = {
  key: "sector:XLE:2026-11-10",
  window: "market",
  anchor: "sector-XLE",
  reason: "left its usual range",
  line: "Moneypenny · the Eye is on the market: Energy (XLE) closed above its usual 20-day range, after a close inside it.",
  ask: { label: "What moved XLE?", msg: "What moved Energy (XLE) above its usual range?" },
};

function Page({
  deepLink,
  cur,
}: {
  readonly deepLink: boolean;
  readonly cur: MissionWindow;
}): ReactElement {
  useEyeNotice({ ready: true, deepLink, cur, candidates: () => [NOTICE], questIds: ["q-1"] });
  return <input aria-label="box" />;
}

async function mount(opts: { deepLink?: boolean; cur?: MissionWindow } = {}) {
  const root = createRootRoute();
  const index = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => <Page deepLink={opts.deepLink ?? false} cur={opts.cur ?? "overview"} />,
  });
  const router = createRouter({
    routeTree: root.addChildren([index]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByLabelText("box");
  return router;
}

/** Past the Eye's look (NOTICE_AFTER_MS), with room to spare. */
const past = () => act(() => new Promise((r) => setTimeout(r, 1500)));

describe("useEyeNotice", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    useEyeLight.setState({ request: undefined });
    useNoticeMoves.setState({ line: undefined, moves: [] });
    useMoneypenny.getState().reset();
    // The dock's `hydrate` has bound the thread to its member (the notice waits for that).
    useMoneypenny.setState({ member: "member-1" });
  });

  it("on the first look only records the quests already there", async () => {
    const router = await mount();
    await past();
    expect(useEyeLight.getState().request).toBeUndefined();
    expect(router.state.location.search).toEqual({});
    expect(seenQuests()).toEqual(new Set(["q-1"]));
  });

  it("slides to the window, lights the row with its reason, and says what it saw", async () => {
    rememberQuests([]);
    const router = await mount({ cur: "calendar" });
    await waitFor(
      () =>
        expect(useEyeLight.getState().request).toMatchObject({
          anchor: "sector-XLE",
          reason: "left its usual range",
        }),
      { timeout: 3000 },
    );
    await waitFor(() => expect(router.state.location.search).toEqual({ w: "market" }));
    expect(router.state.location.hash).toBe("sector-XLE");
    const latest = useMoneypenny.getState().messages.at(-1);
    expect(latest?.text).toBe(NOTICE.line);
    expect(useNoticeMoves.getState().moves).toEqual([
      { kind: "say", label: "What moved XLE?", msg: NOTICE.ask.msg },
      { kind: "go", label: "Back to where I was", href: "/?w=calendar" },
    ]);
  });

  it("never twice for the same item in a session", async () => {
    rememberQuests([]);
    window.sessionStorage.setItem("skynet.eye.noticed", JSON.stringify([NOTICE.key]));
    await mount();
    await past();
    expect(useEyeLight.getState().request).toBeUndefined();
  });

  it("holds back on a visit that arrived on a deep link", async () => {
    rememberQuests([]);
    await mount({ deepLink: true });
    await past();
    expect(useEyeLight.getState().request).toBeUndefined();
  });

  // #7487 slice 5 review: a notice held back used to fire the moment the member paused, long after
  // they had started using the page. Any sign they came for something now drops it for the visit.
  /** Long past every retry: the notice would have played by now if it were going to. */
  const longPast = () => act(() => new Promise((r) => setTimeout(r, 2500)));
  /** What the Eye has done so far: the light it asked for and the lines she said. */
  const said = () => ({
    light: useEyeLight.getState().request,
    lines: useMoneypenny.getState().messages.length,
  });
  const nothing = { light: undefined, lines: 0 };

  it("drops the notice once the member presses a key, even after they stop", async () => {
    rememberQuests([]);
    await mount();
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
    });
    await longPast();
    expect(said()).toEqual(nothing);
  });

  it("drops the notice once the member taps anywhere on the page", async () => {
    rememberQuests([]);
    await mount();
    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
    });
    await longPast();
    expect(said()).toEqual(nothing);
  });

  it("drops the notice once focus moves (a screen reader in focus mode, a tab)", async () => {
    rememberQuests([]);
    await mount();
    act(() => screen.getByLabelText("box").focus());
    await longPast();
    expect(said()).toEqual(nothing);
  });

  it("drops the notice once the member has moved to another window", async () => {
    rememberQuests([]);
    const router = await mount();
    await act(() => router.navigate({ href: "/?w=calendar" }));
    await longPast();
    expect(said()).toEqual(nothing);
    expect(router.state.location.search).toEqual({ w: "calendar" });
  });

  it("never lands after an answer: a turn with Moneypenny drops it, even once she is done", async () => {
    rememberQuests([]);
    await mount();
    act(() => useMoneypenny.setState({ streaming: true }));
    act(() => useMoneypenny.setState({ streaming: false }));
    await longPast();
    expect(useEyeLight.getState().request).toBeUndefined();
  });

  it("waits until her thread is bound to its member, then says it under that member", async () => {
    rememberQuests([]);
    useMoneypenny.setState({ member: undefined });
    await mount();
    await past();
    expect(said()).toEqual(nothing);
    act(() => useMoneypenny.setState({ member: "member-1" }));
    await waitFor(() => expect(useEyeLight.getState().request?.anchor).toBe("sector-XLE"), {
      timeout: 3000,
    });
    expect(useMoneypenny.getState().messages.at(-1)?.text).toBe(NOTICE.line);
  });

  it("waits while the page is scrolling, and looks once it settles", async () => {
    rememberQuests([]);
    await mount();
    let scrolls = 0;
    const tick = setInterval(() => {
      scrolls += 1;
      window.dispatchEvent(new Event("scroll"));
    }, 100);
    try {
      await act(() => new Promise((r) => setTimeout(r, 1800)));
      expect(scrolls).toBeGreaterThan(10);
      expect(useEyeLight.getState().request).toBeUndefined();
    } finally {
      clearInterval(tick);
    }
    await waitFor(() => expect(useEyeLight.getState().request?.anchor).toBe("sector-XLE"), {
      timeout: 3000,
    });
  });
});
