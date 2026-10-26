import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import type { FitRow } from "../../../src/playbooks/fit-finder";
import { SymbolFitFor } from "../../src/shell/symbol-fit-for";

/**
 * The fit finder (#4469 slice 4). WHEN it mounts, the ticker's strategies SHALL be drawn from the
 * light fit route as served, best first; the refusals SHALL fold into one counted line that opens to
 * the same rows; a strategy with no row SHALL offer the one research request the Store's picker
 * files; WHILE closed it SHALL fetch nothing; WHEN the read fails it SHALL say so in words.
 */

const row = (over: Partial<FitRow>): FitRow => ({
  strategy: "wheel",
  name: "the wheel",
  line: "Sells puts, then calls on shares it's assigned",
  act: "Sell cash-secured puts on AMZN, then covered calls on any shares assigned",
  status: "researched",
  glyph: "✓",
  word: "researched",
  reason: "Options have priced AMZN's moves below what followed.",
  ...over,
});

const FITS: readonly FitRow[] = [
  row({ confidence: "medium", until: "2027-03-31", measuredExit: "D-5" }),
  row({
    strategy: "pre-print-run-up",
    name: "the pre-print run-up",
    status: "not-studied",
    glyph: "?",
    word: "not studied",
    reason: "The house has not run the pre-print run-up on AMZN yet.",
    askable: true,
  }),
  row({
    strategy: "event",
    name: "the TACO event play",
    status: "cant-run",
    glyph: "⊘",
    word: "can't run",
    reason: "No news feed is wired to it yet.",
  }),
];

const realFetch = globalThis.fetch;
const asked: { url: string; body?: string }[] = [];
afterEach(() => {
  globalThis.fetch = realFetch;
  asked.length = 0;
});

const stub = (status: number, body: unknown) => {
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    asked.push({ url: String(url), ...(init?.body ? { body: String(init.body) } : {}) });
    const answer = String(url) === "/api/feedback" ? { ok: true } : body;
    return Promise.resolve(new Response(JSON.stringify(answer), { status }));
  }) as typeof fetch;
};

const mount = (enabled = true) => {
  const rootRoute = createRootRoute({
    component: () => <SymbolFitFor symbol="AMZN" enabled={enabled} />,
  });
  const research = createRoute({ getParentRoute: () => rootRoute, path: "/research" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([research]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
};

describe("SymbolFitFor", () => {
  it("draws each strategy with its status in words, reason and facts, and links a verdict to its card", async () => {
    stub(200, { symbol: "AMZN", fits: FITS });
    mount();
    const panel = await screen.findByRole("region", { name: "AMZN strategy fit" });
    expect(panel).toHaveTextContent("Where AMZN fits");
    expect(panel).toHaveTextContent("The wheel");
    expect(panel).toHaveTextContent("✓ researched");
    expect(panel).toHaveTextContent(
      "medium confidence · measured out at D-5 · re-research by 2027-03-31",
    );
    expect(screen.getByRole("link", { name: /Open the wheel's card to add AMZN/ })).toHaveAttribute(
      "href",
      "/research?section=playbooks&strategy=wheel",
    );
    expect(asked[0]?.url).toBe("/api/research/fit?symbol=AMZN");
  });

  it("folds a refusal into one counted line that opens to its reason", async () => {
    stub(200, { symbol: "AMZN", fits: FITS });
    mount();
    const summary = await screen.findByText(/1 not to take: can't run/);
    const folded = summary.closest("details");
    expect(folded).not.toHaveAttribute("open");
    expect(folded).toHaveTextContent("No news feed is wired to it yet.");
    expect(folded).toHaveTextContent("The TACO event play");
  });

  it("files the one research request for a strategy with no row, once", async () => {
    stub(200, { symbol: "AMZN", fits: FITS });
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Ask for research" }));
    expect(
      await screen.findByText(/Asked\. AMZN appears on the pre-print run-up's card/),
    ).toBeInTheDocument();
    const filing = asked.find((a) => a.url === "/api/feedback");
    expect(filing?.body).toContain("Study AMZN for the pre-print run-up in the Playbook Store");
    expect(filing?.body).toContain("the fit finder on R&D");
  });

  it("fetches nothing while closed", () => {
    stub(200, { symbol: "AMZN", fits: FITS });
    mount(false);
    expect(asked).toEqual([]);
  });

  it("says so in words when the read fails, never drawing a fit it never had", async () => {
    stub(500, {});
    mount();
    expect(await screen.findByText("No strategy read for AMZN right now.")).toBeInTheDocument();
  });
});
