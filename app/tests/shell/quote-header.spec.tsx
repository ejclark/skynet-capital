import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { QuoteAnswer } from "../../src/live/quote";
import { QuoteHeader } from "../../src/shell/quote-header";

/**
 * `QuoteHeader` (#2017 cockpit plan, Phase 0.9) — the glyph + explicit sign carry tone, never hue
 * alone (a standing reader is red/green colourblind); an unlinked/failed feed renders the honest
 * note, never an error; an uncommitted symbol renders nothing.
 */

let nextAnswer: QuoteAnswer = { quoteNote: "unset" };
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () => Promise.resolve(nextAnswer),
}));

function withClient(node: ReactElement) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

describe("QuoteHeader", () => {
  it("renders nothing for an empty symbol", () => {
    const { container } = render(withClient(<QuoteHeader symbol="" />));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the glyph, sign and tone-pos class for a positive quote", async () => {
    nextAnswer = { symbol: "NVDA", last: 181.32, change: 2.14, changePct: 1.19, tone: "pos" };
    render(withClient(<QuoteHeader symbol="NVDA" />));

    await waitFor(() => expect(screen.getByText("▲")).toBeInTheDocument());
    expect(screen.getByText(/\+\$2\.14/)).toBeInTheDocument();
    expect(screen.getByText(/\+1\.19%/)).toBeInTheDocument();
    const change = screen.getByText("▲").closest(".quote-change");
    expect(change).toHaveClass("tone-pos");
  });

  it("renders the down glyph and tone-neg class for a negative quote", async () => {
    nextAnswer = { symbol: "NVDA", last: 179.18, change: -2.14, changePct: -1.18, tone: "neg" };
    render(withClient(<QuoteHeader symbol="NVDA" />));

    await waitFor(() => expect(screen.getByText("▼")).toBeInTheDocument());
    const change = screen.getByText("▼").closest(".quote-change");
    expect(change).toHaveClass("tone-neg");
  });

  it("renders the note text when the feed degrades", async () => {
    nextAnswer = { quoteNote: "No quote for NVDA right now." };
    render(withClient(<QuoteHeader symbol="NVDA" />));

    await waitFor(() =>
      expect(screen.getByText("No quote for NVDA right now.")).toBeInTheDocument(),
    );
  });
});
