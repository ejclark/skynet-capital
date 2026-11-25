import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { ScoreboardTile } from "../../src/shell/needs-you";
import { SEAT_LINE, SEAT_READING_LINE, SEAT_UNREAD_LINE } from "../../src/shell/party-table";

/**
 * #8368: the Scoreboard tile's seat verdict rests on two reads — the viewer's accounts
 * (`/api/settings`) and the party's table (`/api/board?by=realized`). WHILE either is still
 * loading, or WHEN either has failed, the tile SHALL NOT tell a member "Your seat opens with your
 * first filled paper order": it says the seat is being read, or that it could not be read. WHEN
 * both land, a seated member reads the lead line and the tile lights.
 */

type Answer = { status: number; body?: unknown } | "never";
const ok = (body: unknown): Answer => ({ status: 200, body });

const BOARD = {
  seq: 1,
  generatedAt: "2026-11-24T15:00:00Z",
  metric: "realized",
  view: {
    rows: [],
    party: {
      seats: [
        {
          key: "a1",
          name: "Member A",
          monthReturn: "+1.00%",
          monthReturnTone: "pos",
          booked: "+$40",
          bookedTone: "pos",
        },
      ],
      partyReturn: "+1.00%",
      partyReturnTone: "pos",
      partyCount: "Average of 1 seated account",
      houseReturn: "+0.80%",
      houseReturnTone: "pos",
      openSeats: 2,
      openLine: "2 seats open",
      lead: {
        line: "The party leads the house bot by 0.20 points",
        glyph: "▲",
        figure: "+0.20 pts",
        tone: "pos",
      },
      footnote: "Paper results.",
    },
  },
};

let routes: Record<string, Answer> = {};
const serve = (over: Record<string, Answer>) => {
  routes = {
    "/api/settings": ok({ accounts: [{ id: "a1" }] }),
    "/api/board?by=realized": ok(BOARD),
    ...over,
  };
};

const realFetch = globalThis.fetch;
beforeEach(() => {
  serve({});
  globalThis.fetch = ((url: string) => {
    const a = routes[String(url)] ?? { status: 404 };
    if (a === "never")
      return new Promise<Response>(() => {
        // never settles: the read stays pending for the whole test
      });
    return Promise.resolve(
      new Response(a.body === undefined ? "" : JSON.stringify(a.body), { status: a.status }),
    );
  }) as typeof fetch;
});
afterEach(() => {
  cleanup();
  globalThis.fetch = realFetch;
});

const mount = () => {
  const root = createRootRoute();
  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({
        getParentRoute: () => root,
        path: "/",
        component: () => (
          <ul>
            <ScoreboardTile />
          </ul>
        ),
      }),
      createRoute({ getParentRoute: () => root, path: "/leaderboard" }),
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
  return screen.findByRole("link", { name: /Scoreboard/ });
};

describe("the Scoreboard tile never reads an unread seat as no seat (#8368)", () => {
  it("lights with the lead line when both reads land for a seated member", async () => {
    const tile = await mount();
    await waitFor(() => expect(tile.textContent).toContain("leads the house bot"));
    expect(tile.textContent).toContain("your seat");
    expect(tile.textContent).not.toContain(SEAT_LINE);
  });

  it("says the seat couldn't be read when the settings read fails", async () => {
    serve({ "/api/settings": { status: 502 } });
    const tile = await mount();
    await waitFor(() => expect(tile.textContent).toContain(SEAT_UNREAD_LINE));
    expect(tile.textContent).not.toContain(SEAT_LINE);
  });

  it("says the seat couldn't be read when the board read fails", async () => {
    serve({ "/api/board?by=realized": { status: 502 } });
    const tile = await mount();
    await waitFor(() => expect(tile.textContent).toContain(SEAT_UNREAD_LINE));
    expect(tile.textContent).not.toContain(SEAT_LINE);
  });

  it("says the seat is being read while both reads are pending", async () => {
    serve({ "/api/settings": "never", "/api/board?by=realized": "never" });
    const tile = await mount();
    expect(tile.textContent).toContain(SEAT_READING_LINE);
    expect(tile.textContent).not.toContain(SEAT_LINE);
  });

  it("still shows the seat line once both reads land and the member has no seat", async () => {
    serve({ "/api/settings": ok({ accounts: [{ id: "z9" }] }) });
    const tile = await mount();
    await waitFor(() => expect(tile.textContent).toContain(SEAT_LINE));
  });
});
