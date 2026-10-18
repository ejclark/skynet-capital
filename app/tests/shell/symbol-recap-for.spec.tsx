import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { SymbolOutlook } from "../../../src/research/symbol-outlook-shape";
import { SymbolRecapFor } from "../../src/shell/symbol-recap-for";

/**
 * The recap wherever a symbol appears (#4807 slice 4). WHEN a row mounts it, the symbol's summary
 * SHALL be fetched from the light outlook route and drawn as the same card the Guidance tab leads
 * with; WHILE it is closed it SHALL fetch nothing; WHEN the read fails it SHALL say so in words,
 * never draw a call it never had.
 */

const OUTLOOK: SymbolOutlook = {
  symbol: "CRWV",
  asOf: "2026-10-18",
  call: "sell",
  confidence: "high",
  why: "The thesis broke.",
  until: "2026-11-07",
  falsifier: "A reclaim of $90.",
  windows: [{ start: "2026-10-18", end: "2027-01-16", state: "open", reason: "The call applies." }],
};

const realFetch = globalThis.fetch;
const asked: string[] = [];
afterEach(() => {
  globalThis.fetch = realFetch;
  asked.length = 0;
});

const stub = (status: number, body: unknown) => {
  globalThis.fetch = ((url: string) => {
    asked.push(String(url));
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
  }) as typeof fetch;
};

const mount = (symbol: string, enabled = true) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SymbolRecapFor symbol={symbol} enabled={enabled} />
    </QueryClientProvider>,
  );

describe("SymbolRecapFor", () => {
  it("draws the served summary as the recap card", async () => {
    stub(200, { outlooks: { CRWV: OUTLOOK } });
    mount("CRWV");
    const card = await screen.findByRole("region", { name: "CRWV research recap" });
    expect(card.textContent).toMatch(/SELL/);
    expect(asked).toEqual(["/api/research/outlook?symbol=CRWV"]);
  });

  it("fetches nothing while closed", () => {
    stub(200, { outlooks: {} });
    mount("CRWV", false);
    expect(asked).toEqual([]);
  });

  it("says so in words when the read fails", async () => {
    stub(500, {});
    mount("CRWV");
    expect(await screen.findByText(/No research recap for CRWV right now/)).toBeTruthy();
  });

  it("says so in words when the server has no summary for the name", async () => {
    stub(200, { outlooks: {} });
    mount("ZZZT");
    expect(await screen.findByText(/No research recap for ZZZT right now/)).toBeTruthy();
  });
});
