import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { GuidanceMarket } from "../../../src/options/position-guidance-types";
import { inputs } from "../../../tests/options/position-guidance-fixture";
import { SavedPositionsSection } from "../../src/shell/saved-positions-section";

/**
 * The saved-positions section (#3968 slice 3a) — deliberately isolated: mounted alone, no desk, no
 * blotter, no trade form. What it must never get wrong: a position is saved only with a valid
 * ticker, each card computes guidance from its OWN stake, and delete/rename never touch another
 * position.
 */

const { stake: _fixtureStake, ...MARKET } = inputs();

let positions: unknown[] = [];
let accounts: unknown[] = [];
let deskBody: unknown = { generatedAt: "", desk: { positions: [] } };
const posted: { url: string; body: unknown }[] = [];

function serve(market: GuidanceMarket): void {
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    if (url === "/api/saved-positions") {
      return Promise.resolve(new Response(JSON.stringify({ positions }), { status: 200 }));
    }
    if (url === "/api/settings") {
      return Promise.resolve(new Response(JSON.stringify({ accounts }), { status: 200 }));
    }
    if (url.startsWith("/api/desk/")) {
      return Promise.resolve(new Response(JSON.stringify(deskBody), { status: 200 }));
    }
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      posted.push({ url, body });
      if (url === "/api/saved-positions/save") {
        const saved = {
          id: `pos-${positions.length + 1}`,
          symbol: body.symbol,
          name: body.name,
          stake: body.stake,
          createdAt: "2026-09-29T00:00:00.000Z",
          updatedAt: "2026-09-29T00:00:00.000Z",
        };
        positions = [...positions, saved];
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true, position: saved }), { status: 200 }),
        );
      }
      if (url === "/api/saved-positions/delete") {
        positions = positions.filter((p) => (p as { id: string }).id !== body.id);
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      }
      if (url === "/api/saved-positions/update") {
        positions = positions.map((p) =>
          (p as { id: string }).id === body.id ? { ...(p as object), ...body } : p,
        );
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      }
    }
    return Promise.resolve(new Response(JSON.stringify({ market }), { status: 200 }));
  }) as typeof fetch;
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SavedPositionsSection />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  positions = [];
  accounts = [];
  deskBody = { generatedAt: "", desk: { positions: [] } };
  posted.length = 0;
  serve(MARKET);
});

describe("saved positions — adding one", () => {
  it("saves a typed-in symbol and stake, and lists the new card", async () => {
    mount();
    await screen.findByText("Nothing saved yet — add a position above.");
    fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "crwv" } });
    fireEvent.change(screen.getByLabelText("Name it (optional)"), {
      target: { value: "My Fidelity calls" },
    });
    fireEvent.change(screen.getByLabelText("Shares you hold"), { target: { value: "400" } });
    fireEvent.blur(screen.getByLabelText("Shares you hold"));
    fireEvent.click(screen.getByRole("button", { name: "Save position" }));

    // The new card's own symbol span, not the add-form's (about-to-clear) name input.
    await screen.findByText("CRWV");
    expect(posted[0]).toMatchObject({
      url: "/api/saved-positions/save",
      body: { symbol: "CRWV", name: "My Fidelity calls", stake: { shares: 400 } },
    });
    expect(screen.getByDisplayValue("My Fidelity calls")).toBeTruthy();
  });

  it("refuses to save a malformed ticker without a round trip", async () => {
    mount();
    await screen.findByText("Nothing saved yet — add a position above.");
    fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "not a ticker" } });
    fireEvent.click(screen.getByRole("button", { name: "Save position" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid ticker");
    expect(posted).toHaveLength(0);
  });
});

describe("saved positions — a saved card", () => {
  beforeEach(() => {
    positions = [
      {
        id: "pos-1",
        symbol: "CRWV",
        name: "My Fidelity calls",
        stake: { shares: 400, costBasis: 70, goal: "income" },
        createdAt: "2026-09-29T00:00:00.000Z",
        updatedAt: "2026-09-29T00:00:00.000Z",
      },
    ];
  });

  it("computes guidance from its own stake — the same engine, unchanged", async () => {
    mount();
    const symbol = await screen.findByText("CRWV");
    const list = await within(symbol.closest("li") as HTMLElement).findByRole("list");
    expect(within(list).getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("removes only the card it's clicked on", async () => {
    positions = [...positions, { ...(positions[0] as object), id: "pos-2", name: "A second one" }];
    mount();
    await screen.findByDisplayValue("A second one");
    const [firstRemove] = await screen.findAllByRole("button", { name: /Remove/ });
    fireEvent.click(firstRemove as HTMLElement);
    await waitFor(() => expect(screen.queryByDisplayValue("My Fidelity calls")).toBeNull());
    expect(screen.getByDisplayValue("A second one")).toBeTruthy();
    expect(posted[0]).toMatchObject({ url: "/api/saved-positions/delete", body: { id: "pos-1" } });
  });

  it("renames on blur, never touching the stake", async () => {
    mount();
    const input = await screen.findByLabelText("Name for CRWV");
    fireEvent.change(input, { target: { value: "Renamed" } });
    fireEvent.blur(input);
    await waitFor(() =>
      expect(posted).toContainEqual({
        url: "/api/saved-positions/update",
        body: { id: "pos-1", name: "Renamed" },
      }),
    );
  });
});

describe("saved positions — pulling an existing paper position in (#3968 slice 3b)", () => {
  it("has nothing to offer when the member owns no accounts", async () => {
    mount();
    await screen.findByText("Nothing saved yet — add a position above.");
    expect(screen.queryByLabelText("Account")).toBeNull();
  });

  it("imports a held stock position as an ordinary saved position", async () => {
    accounts = [
      { id: "acct-1", name: "acct-1", kind: "human", hostConfigured: false, profile: null },
    ];
    deskBody = {
      generatedAt: "",
      desk: {
        positions: [{ symbol: "CRWV", isOption: false, quantity: "150", costPerShare: "$62.10" }],
      },
    };
    mount();
    await screen.findByText("Nothing saved yet — add a position above.");
    fireEvent.change(await screen.findByLabelText("Account"), { target: { value: "acct-1" } });
    await screen.findByRole("option", { name: "CRWV" });
    fireEvent.change(screen.getByLabelText("Position"), { target: { value: "CRWV" } });
    fireEvent.click(screen.getByRole("button", { name: "Import position" }));

    await screen.findByText("CRWV");
    expect(posted[0]).toMatchObject({
      url: "/api/saved-positions/save",
      body: { symbol: "CRWV", stake: { shares: 150, costBasis: 62.1 } },
    });
  });
});
