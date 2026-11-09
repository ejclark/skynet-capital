import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { FastTrackInput } from "../../../src/domain/fast-track";
import type { MarketEvent } from "../../../src/domain/market-events";
import { FastTrackWalk } from "../../src/shell/fast-track-walk";

/**
 * "What's coming up that I should watch?" drawn as cards (#7034 slice 2): the events first (at most
 * 3, the member's names first, the rest folded behind a count), then one card per empty exit field,
 * ending on a link to the trade form carrying the stop and the exit — five taps from the question.
 */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    search,
    className,
  }: {
    children: ReactNode;
    to: string;
    search?: Record<string, string>;
    className?: string;
  }) => {
    const query = new URLSearchParams(search ?? {}).toString();
    return (
      <a className={className} href={`${to}${query ? `?${query}` : ""}`}>
        {children}
      </a>
    );
  },
}));

const watched: string[] = [];
rstest.mock("../../src/live/watchlist", () => ({
  watchlistKey: ["watchlist"],
  setWatching: (symbol: string) => {
    watched.push(symbol);
    return Promise.resolve({ ok: true, watching: [{ symbol, at: "2026-11-09" }] });
  },
}));

const event = (over: Partial<MarketEvent> & Pick<MarketEvent, "id">): MarketEvent => ({
  kind: "earnings",
  title: `${over.id} title`,
  date: "2026-11-19",
  status: "confirmed",
  source: "IR: fixture",
  impact: "medium",
  symbols: [],
  ...over,
});

const INPUT: FastTrackInput = {
  asOf: "2026-11-09",
  book: { held: ["NVDA"], watched: [] },
  events: [
    {
      event: event({ id: "cpi", title: "CPI", impact: "critical", date: "2026-11-10" }),
      killSwitches: [],
    },
    {
      event: event({ id: "nvda", title: "NVDA earnings print", symbols: ["NVDA"] }),
      stance: "Stand aside into the print",
      killSwitches: ["A guide below consensus by 2026-11-19", "Implied move over 12%"],
    },
    {
      event: event({
        id: "launch",
        title: "A launch",
        status: "estimate",
        impact: "high",
        symbols: ["AAPL"],
      }),
      killSwitches: [],
    },
    {
      event: event({ id: "ppi", title: "PPI", impact: "high", date: "2026-11-13" }),
      killSwitches: [],
    },
  ],
};

const realFetch = globalThis.fetch;
beforeEach(() => {
  watched.length = 0;
  globalThis.fetch = (() =>
    Promise.resolve(new Response(JSON.stringify(INPUT), { status: 200 }))) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

const asked: string[] = [];
function mount() {
  asked.length = 0;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <FastTrackWalk
        onAsk={(q) => {
          asked.push(q);
          return Promise.resolve(true);
        }}
      />
    </QueryClientProvider>,
  );
}

describe("the first fast track's card walk", () => {
  it("shows at most 3 events, the held name's first, each dated in words with its stance, and folds the rest", async () => {
    mount();
    const list = (await screen.findAllByRole("list"))[0];
    if (!list) throw new Error("no event list");
    const titles = within(list)
      .getAllByRole("listitem")
      .map((li) => li.querySelector(".ft-event-title")?.textContent);
    // Held name first, then impact (critical over high), then date: the later launch folds.
    expect(titles).toEqual(["NVDA earnings print", "CPI", "PPI"]);
    expect(screen.getByText("Nov 19 · date confirmed")).toBeInTheDocument();
    expect(screen.getByText("Nov 19 · date is an estimate")).toBeInTheDocument();
    expect(screen.getByText("Stand aside into the print")).toBeInTheDocument();
    expect(screen.getAllByText("not researched yet").length).toBeGreaterThan(0);
    expect(screen.getByText("1 more in the next 14 days")).toBeInTheDocument();
    expect(screen.getByText("News and lawsuits: not covered yet.")).toBeInTheDocument();
  });

  it("offers only Watch and Ask on an estimate-dated event", async () => {
    mount();
    const launch = (await screen.findByText("A launch")).closest("li");
    if (!launch) throw new Error("no launch row");
    const labels = within(launch)
      .getAllByRole("button")
      .map((b) => b.textContent);
    expect(labels).toEqual(["Watch AAPL", "Ask what we know"]);
  });

  it("walks Plan a move → the stop → the exit to a trade-form link carrying both, in 5 taps", async () => {
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Plan a move on NVDA" }));
    expect(screen.getByText(/What would prove you wrong\?/)).toBeInTheDocument();
    expect(screen.getByText("· tap 3 of 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "A guide below consensus by 2026-11-19" }));
    expect(screen.getByText(/Where would you take profit, or by when\?/)).toBeInTheDocument();
    expect(
      screen.getByText("Base rate: untested. The house has not measured this move."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Close before it/ }));
    const link = screen.getByRole("link", { name: "Open it in the trade form" });
    const url = new URL(link.getAttribute("href") ?? "", "http://x");
    expect(url.pathname).toBe("/trade");
    expect(url.searchParams.get("symbol")).toBe("NVDA");
    expect(url.searchParams.get("plan")).toBe("NVDA");
    expect(url.searchParams.get("stop")).toBe("A guide below consensus by 2026-11-19");
    expect(url.searchParams.get("exit")).toMatch(/^Close before it/);
    expect(url.searchParams.get("by")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("fills a field with the member's own answer, and keeps added context as a note on the ticket", async () => {
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Plan a move on NVDA" }));
    const own = screen.getByLabelText("My own answer");
    fireEvent.change(own, { target: { value: "NVDA closes under $150" } });
    fireEvent.submit(own.closest("form") as HTMLFormElement);
    const context = screen.getByLabelText("Add context");
    fireEvent.change(context, { target: { value: "I hold it into Ignite" } });
    fireEvent.submit(context.closest("form") as HTMLFormElement);
    expect(screen.getByText("I hold it into Ignite")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Close the first session after it/ }));
    const url = new URL(
      screen.getByRole("link", { name: "Open it in the trade form" }).getAttribute("href") ?? "",
      "http://x",
    );
    expect(url.searchParams.get("stop")).toBe("NVDA closes under $150");
    expect(url.searchParams.get("note")).toBe("I hold it into Ignite");
  });

  it("adds the name to the watchlist on Watch, and says so only once the list answers", async () => {
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Watch NVDA" }));
    expect(await screen.findByText(/is on your watchlist\./)).toBeInTheDocument();
    expect(watched).toEqual(["NVDA"]);
  });

  it("hands Ask what we know to the chat", async () => {
    mount();
    const nvda = (await screen.findByText("NVDA earnings print")).closest("li");
    if (!nvda) throw new Error("no nvda row");
    fireEvent.click(within(nvda).getByRole("button", { name: "Ask what we know" }));
    expect(asked).toEqual(["What do we know about NVDA earnings print?"]);
  });
});
