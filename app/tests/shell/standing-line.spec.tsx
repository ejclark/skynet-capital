import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import type { DeskPulse, PulseTileData } from "../../src/live/pulse";
import { StandingLine } from "../../src/shell/standing-line";

// The five tiles the server sends, in its own order — the line must pick three of them by key.
const TILES: readonly PulseTileData[] = [
  { key: "equity", label: "Equity", value: "$120,000", note: "cash $40,000" },
  {
    key: "netRealized",
    label: "Net realized",
    value: "+$4,250",
    note: "booked, not on paper",
    tone: "pos",
  },
  { key: "winRate", label: "Win rate", value: "62.5%", note: "5W · 3L" },
  {
    key: "profitFactor",
    label: "Profit factor",
    value: "1.84×",
    note: "wins ÷ losses; above 1× is paying",
  },
  {
    key: "maxDrawdown",
    label: "Max drawdown",
    value: "4.20%",
    note: "from peak $131,000",
    tone: "neg",
  },
];

function mount(pulse: DeskPulse) {
  const rootRoute = createRootRoute({ component: () => <StandingLine accountId="human-eric" /> });
  const u = createRoute({ getParentRoute: () => rootRoute, path: "/u/$id/pulse" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([u]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["desk-pulse", "human-eric"], pulse);
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
}

const pulse = (tiles: readonly PulseTileData[]): DeskPulse => ({
  curve: null,
  weeks: [],
  tiles,
  race: null,
  streaks: [],
});

describe("StandingLine", () => {
  it("shows the three headline facts the Pulse page shows, with the same figures", async () => {
    mount(pulse(TILES));
    expect(await screen.findByText("62.5%")).toBeInTheDocument();
    expect(screen.getByText("1.84×")).toBeInTheDocument();
    expect(screen.getByText("4.20%")).toHaveClass("tone-neg");
    // Equity and net realized belong to the card's own figures, not the record.
    expect(screen.queryByText("$120,000")).not.toBeInTheDocument();
    expect(screen.queryByText("+$4,250")).not.toBeInTheDocument();
  });

  it("teaches the jargon in place — each label is a glossary term", async () => {
    mount(pulse(TILES));
    expect(await screen.findByRole("button", { name: "Profit factor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Win rate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Max drawdown" })).toBeInTheDocument();
  });

  it("links this account's own Pulse for everything it does not show", async () => {
    mount(pulse(TILES));
    const link = await screen.findByRole("link", { name: /Open the full Pulse/ });
    expect(link).toHaveAttribute("href", "/u/human-eric/pulse");
  });

  it("selects by key, so the server's display copy is free to change", async () => {
    mount(pulse(TILES.map((t) => (t.key === "winRate" ? { ...t, label: "Hit rate" } : t))));
    expect(await screen.findByRole("button", { name: "Win rate" })).toBeInTheDocument();
    expect(screen.getByText("62.5%")).toBeInTheDocument();
  });

  it("renders nothing rather than an empty row when the payload carries no headline facts", async () => {
    mount(pulse(TILES.filter((t) => t.key === "equity")));
    await screen.findByText((_, el) => el?.tagName === "BODY");
    expect(screen.queryByRole("link", { name: /Open the full Pulse/ })).not.toBeInTheDocument();
  });
});
