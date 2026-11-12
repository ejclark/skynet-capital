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

  it("waits while the member is typing, and looks once they stop", async () => {
    rememberQuests([]);
    await mount();
    const box = screen.getByLabelText("box") as HTMLInputElement;
    act(() => {
      box.focus();
      box.value = "what moved";
    });
    await past();
    expect(useEyeLight.getState().request).toBeUndefined();
    act(() => {
      box.value = "";
      box.blur();
    });
    await waitFor(() => expect(useEyeLight.getState().request?.anchor).toBe("sector-XLE"), {
      timeout: 3000,
    });
  });
});
