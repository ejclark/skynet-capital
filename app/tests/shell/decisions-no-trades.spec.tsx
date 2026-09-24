import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { DecisionsSection } from "../../src/shell/decisions-section";

/** The Heartbeat tab's no-trade log (#3687 slice 4): asks only for passes that placed nothing, and
 *  walks past a page the filter emptied rather than showing it blank. */

const asked: string[] = [];
const realFetch = globalThis.fetch;
const cycle = {
  at: "2026-09-22T18:59:00Z",
  mode: "live",
  status: "halted",
  headline: "halted: daily-loss",
  rawCount: 0,
  guardedCount: 0,
  outcomes: [],
  halted: "daily-loss",
};
beforeEach(() => {
  asked.length = 0;
  globalThis.fetch = ((url: string) => {
    asked.push(String(url));
    const body = String(url).includes("before=")
      ? { available: true, kind: "bot", cycles: [cycle] }
      : { available: true, kind: "bot", cycles: [], nextCursor: 5_000 };
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

describe("DecisionsSection noTrades", () => {
  it("asks for trades=none and walks past an emptied page to the next passes", async () => {
    render(withClient(<DecisionsSection deskId="sauron" noTrades />));
    expect(await screen.findByText("halted: daily-loss")).toBeInTheDocument();
    expect(asked.every((url) => url.includes("trades=none"))).toBe(true);
    expect(asked).toHaveLength(2);
  });
});
