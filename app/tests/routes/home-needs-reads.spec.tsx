import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { NeedsYou, readGaps } from "../../src/routes/index";

/**
 * #8316: "Needs you" is a claim, so its all-clear shows only when every read it rests on
 * succeeded. WHEN the accounts, a desk or the quests read fails (or comes back error-tagged, or
 * leaves names unjudged), the strip SHALL say what it could not read, in words, and SHALL NOT say
 * "Nothing needs you right now." WHEN every read succeeds and finds nothing, it SHALL say so.
 */

const ALL_CLEAR = "Nothing needs you right now.";

const desk = (id: string, error?: string) => ({
  generatedAt: "2026-11-24T15:00:00Z",
  desk: {
    id,
    name: id,
    kind: "human",
    ...(error ? { error } : {}),
    tiles: {},
    positions: [],
    considerations: [],
  },
});

type Answer = { status: number; body?: unknown };
const ok = (body: unknown): Answer => ({ status: 200, body });

let routes: Record<string, Answer> = {};
const serve = (over: Record<string, Answer>) => {
  routes = {
    "/api/settings": ok({ accounts: [{ id: "a1" }, { id: "a2" }] }),
    "/api/desk/a1": ok(desk("a1")),
    "/api/desk/a2": ok(desk("a2")),
    "/api/quests": ok({ available: true, asOf: "2026-11-24", quests: [], unread: [] }),
    ...over,
  };
};

const realFetch = globalThis.fetch;
beforeEach(() => {
  serve({});
  globalThis.fetch = ((url: string) => {
    const a = routes[String(url)] ?? { status: 404 };
    return Promise.resolve(
      new Response(a.body === undefined ? "" : JSON.stringify(a.body), { status: a.status }),
    );
  }) as typeof fetch;
});
afterEach(() => {
  cleanup();
  globalThis.fetch = realFetch;
});

const mount = async () => {
  const root = createRootRoute();
  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({ getParentRoute: () => root, path: "/", component: NeedsYou }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByText("Needs you");
  // Wait for every read to settle: the "checking" line goes once nothing is pending.
  await waitFor(() => {
    if (screen.queryByText("Checking what needs you…")) throw new Error("reads still pending");
  });
};

describe("Needs you reads a failed read as a failure, never as all-clear (#8316)", () => {
  it("says the accounts are unreachable when the settings read fails", async () => {
    serve({ "/api/settings": { status: 500 } });
    await mount();
    expect(screen.queryByText(ALL_CLEAR)).toBeNull();
    expect(screen.getByText(/Accounts are unreachable\./)).toBeInTheDocument();
  });

  it("says positions can't be read when a desk read rejects", async () => {
    serve({ "/api/desk/a2": { status: 502 } });
    await mount();
    expect(screen.queryByText(ALL_CLEAR)).toBeNull();
    expect(screen.getByText(/positions can't be read right now/)).toBeInTheDocument();
  });

  it("names the one unreachable account when a desk comes back error-tagged", async () => {
    serve({ "/api/desk/a2": ok(desk("a2", "keys rejected")) });
    await mount();
    expect(screen.queryByText(ALL_CLEAR)).toBeNull();
    expect(
      screen.getByText("One account is unreachable — its positions can't be read right now."),
    ).toBeInTheDocument();
  });

  it("says the quests can't be read when the quests read errors", async () => {
    serve({ "/api/quests": { status: 500 } });
    await mount();
    expect(screen.queryByText(ALL_CLEAR)).toBeNull();
    expect(screen.getByText("Quests can't be read right now.")).toBeInTheDocument();
  });

  it("says the quests can't be read when the account's broker read failed (#8334)", async () => {
    serve({ "/api/quests": ok({ available: false, reason: "read-failed", quests: [] }) });
    await mount();
    expect(screen.queryByText(ALL_CLEAR)).toBeNull();
    expect(screen.getByText("Quests can't be read right now.")).toBeInTheDocument();
  });

  it("says what went unjudged when the quests read leaves names unread", async () => {
    serve({
      "/api/quests": ok({
        available: true,
        asOf: "2026-11-24",
        quests: [],
        unread: ["NVDA", "conditions"],
      }),
    });
    await mount();
    expect(screen.queryByText(ALL_CLEAR)).toBeNull();
    expect(screen.getByText(/Not judged this time: NVDA/)).toBeInTheDocument();
  });

  it("still gives the all-clear when every read succeeds and finds nothing", async () => {
    await mount();
    expect(screen.getByText(ALL_CLEAR)).toBeInTheDocument();
  });
});

describe("readGaps", () => {
  const clean = {
    settingsFailed: false,
    desksFailed: false,
    desksUnreachable: 0,
    desksRead: 2,
    questsFailed: false,
    questsUnread: [] as string[],
  };

  it("names nothing when every read succeeded", () => {
    expect(readGaps(clean)).toEqual([]);
  });

  it("uses Profile's words when every desk is unreachable", () => {
    expect(readGaps({ ...clean, desksUnreachable: 2 })).toEqual([
      "Account unreachable — positions can't be read right now.",
    ]);
  });

  it("counts the unreachable accounts in words when only some are", () => {
    expect(readGaps({ ...clean, desksRead: 4, desksUnreachable: 2 })).toEqual([
      "Two accounts are unreachable — their positions can't be read right now.",
    ]);
  });

  it("says only the accounts line when settings failed, since nothing past it was read", () => {
    expect(readGaps({ ...clean, settingsFailed: true, questsFailed: true })).toHaveLength(1);
  });
});
