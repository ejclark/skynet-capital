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
  it("keeps the aria-live wrapper mounted but empty for an uncommitted symbol", () => {
    const { container } = render(withClient(<QuoteHeader symbol="" />));
    const header = container.querySelector(".quote-header");
    expect(header).not.toBeNull();
    expect(header?.childElementCount).toBe(0);
    expect(header?.getAttribute("aria-live")).toBe("polite");
  });

  it("renders the glyph, sign and tone-pos class for a positive quote", async () => {
    nextAnswer = { symbol: "NVDA", last: 181.32, change: 2.14, changePct: 1.19, tone: "pos" };
    render(withClient(<QuoteHeader symbol="NVDA" />));

    await waitFor(() => expect(screen.getByText("▲")).toBeInTheDocument());
    expect(screen.getByText(/\+\$2\.14/)).toBeInTheDocument();
    expect(screen.getByText(/\+1\.19%/)).toBeInTheDocument();
    const change = screen.getByText("▲").closest(".quote-change");
    expect(change).toHaveClass("tone-pos");
    expect(screen.getByText("▲")).toHaveAttribute("aria-hidden", "true");

    const hidden = change?.parentElement?.querySelector(".visually-hidden");
    expect(hidden).not.toBeNull();
    expect(hidden?.textContent).toContain("up");
    expect(hidden?.textContent).not.toContain("today");
  });

  it("renders the down glyph and tone-neg class for a negative quote", async () => {
    nextAnswer = { symbol: "NVDA", last: 179.18, change: -2.14, changePct: -1.18, tone: "neg" };
    render(withClient(<QuoteHeader symbol="NVDA" />));

    await waitFor(() => expect(screen.getByText("▼")).toBeInTheDocument());
    const change = screen.getByText("▼").closest(".quote-change");
    expect(change).toHaveClass("tone-neg");
    expect(screen.getByText("▼")).toHaveAttribute("aria-hidden", "true");

    const hidden = change?.parentElement?.querySelector(".visually-hidden");
    expect(hidden?.textContent).toContain("down");
  });

  it("renders the flat glyph and tone-flat class with no sign for a zero-change quote", async () => {
    nextAnswer = { symbol: "NVDA", last: 180.0, change: 0, changePct: 0, tone: "flat" };
    render(withClient(<QuoteHeader symbol="NVDA" />));

    await waitFor(() => expect(screen.getByText("·")).toBeInTheDocument());
    const change = screen.getByText("·").closest(".quote-change");
    expect(change).toHaveClass("tone-flat");
    expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
    expect(screen.queryByText(/\+0\.00%|−0\.00%/)).not.toBeInTheDocument();
  });

  it("signs the percent from a real sub-cent decline even though the rounded dollar change is flat", async () => {
    // The bug this pins (review finding #1): tone/sign must read the RAW pre-round delta, not
    // the rounded-to-cent dollar change, or a real decline on a cheap ticker shows flat.
    nextAnswer = { symbol: "XYZ", last: 0.4489, change: 0, changePct: -0.75, tone: "neg" };
    render(withClient(<QuoteHeader symbol="XYZ" />));

    await waitFor(() => expect(screen.getByText("▼")).toBeInTheDocument());
    expect(screen.getByText(/−0\.75%/)).toBeInTheDocument();
    const change = screen.getByText("▼").closest(".quote-change");
    expect(change).toHaveClass("tone-neg");
  });

  it("renders the note text when the feed degrades, inside the same aria-live wrapper", async () => {
    nextAnswer = { quoteNote: "No quote for NVDA right now." };
    const { container } = render(withClient(<QuoteHeader symbol="NVDA" />));

    await waitFor(() =>
      expect(screen.getByText("No quote for NVDA right now.")).toBeInTheDocument(),
    );
    const header = container.querySelector(".quote-header");
    expect(header?.getAttribute("aria-live")).toBe("polite");
    expect(header?.querySelector(".quote-note")).not.toBeNull();
  });
});
