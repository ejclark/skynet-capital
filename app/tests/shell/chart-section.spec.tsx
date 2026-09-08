import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { BarsAnswer } from "../../src/live/bars";
import { ChartSection } from "../../src/shell/chart-section";

/**
 * `ChartSection`'s three degrade branches (#2017 Phase 1 chart build-out, the mount slice) — each
 * returns BEFORE `createChart` is ever called, so they render under happy-dom without the library
 * (which throws there — `docs/ENGINEERING.md` → House gotchas). The real-data branch is covered by
 * `chart-data.spec.ts` (the mapping) and `chart-mount.spec.ts` (one deliberate mount smoke test).
 */

let nextAnswer: BarsAnswer = { barsNote: "unset" };
const calls: string[] = [];
rstest.mock("../../src/live/bars", () => ({
  fetchBars: (symbol: string) => {
    calls.push(symbol);
    return Promise.resolve(nextAnswer);
  },
}));

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

beforeEach(() => {
  calls.length = 0;
});

describe("ChartSection", () => {
  it("asks for a symbol, and never fetches, when none is committed", () => {
    render(withClient(<ChartSection symbol="" />));
    expect(screen.getByText("Pick a symbol to see its chart.")).toBeInTheDocument();
    expect(calls).toEqual([]);
  });

  it("renders the server's barsNote verbatim", async () => {
    nextAnswer = { barsNote: "No market data client is linked, so there is no history." };
    render(withClient(<ChartSection symbol="NVDA" />));
    await waitFor(() =>
      expect(
        screen.getByText("No market data client is linked, so there is no history."),
      ).toBeInTheDocument(),
    );
    expect(calls).toEqual(["NVDA"]);
    expect(document.querySelector(".chart-canvas")).toBeNull();
  });

  it("treats an empty bars array as a real answer, not a failure", async () => {
    nextAnswer = { symbol: "NVDA", bars: [] };
    render(withClient(<ChartSection symbol="NVDA" />));
    await waitFor(() =>
      expect(screen.getByText("No price history for NVDA yet.")).toBeInTheDocument(),
    );
    expect(document.querySelector(".chart-canvas")).toBeNull();
  });
});
