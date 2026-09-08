import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { useState } from "react";
import type { BarsAnswer } from "../../src/live/bars";
import { ChartSection } from "../../src/shell/chart-section";
import { type StudyId, toggleStudy } from "../../src/shell/chart-studies";
import { StudyToggles } from "../../src/shell/study-toggle";

/**
 * `ChartSection`'s three degrade branches (#2017 Phase 1 chart build-out, the mount slice) — each
 * returns BEFORE `createChart` is ever called, so they render under happy-dom without the library
 * (which throws there — `docs/ENGINEERING.md` → House gotchas). The real-data branch is covered by
 * `chart-data.spec.ts` (the mapping) and `chart-mount.spec.ts` (one deliberate mount smoke test).
 * The study toggles (the studies slice) are specced as the controlled component they are, driven
 * by the same `toggleStudy` reducer the section wires them to — no chart needs to mount for that.
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

function Harness(): ReactElement {
  const [active, setActive] = useState<ReadonlySet<StudyId>>(new Set());
  return (
    <StudyToggles active={active} onToggle={(id) => setActive((set) => toggleStudy(set, id))} />
  );
}

describe("StudyToggles", () => {
  it("starts with every study off and no gloss shown", () => {
    render(<Harness />);
    for (const name of ["SMA", "EMA", "Bollinger", "RSI"]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
    }
    expect(document.querySelectorAll(".chart-gloss")).toHaveLength(0);
  });

  it("presses a chip on click and prints that study's gloss under the row", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "RSI" }));
    expect(screen.getByRole("button", { name: "RSI" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/overbought above 70, oversold below 30/)).toBeInTheDocument();
  });

  it("lets any number be on at once, and a second click turns one off again", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "SMA" }));
    fireEvent.click(screen.getByRole("button", { name: "Bollinger" }));
    expect(screen.getByRole("button", { name: "SMA" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Bollinger" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "EMA" })).toHaveAttribute("aria-pressed", "false");
    expect(document.querySelectorAll(".chart-gloss")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "SMA" }));
    expect(screen.getByRole("button", { name: "SMA" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/the average price over the window/)).toBeNull();
    expect(document.querySelectorAll(".chart-gloss")).toHaveLength(1);
  });
});
